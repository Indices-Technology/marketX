import { createHash } from 'node:crypto'
import { assessPayoutRisk, type RiskFlag } from './settlement-risk'

/**
 * Settlement batch preparation.
 *
 * THE ONE RULE THIS FILE OBEYS
 *
 * Preparation NEVER moves money. It reads balances and writes SettlementBatch /
 * SettlementBatchItem rows. It does not debit a wallet, does not create a
 * Payout, and does not call a disbursement provider. Everything here can run
 * daily against live balances with no possibility of a payout.
 *
 * That is what makes shadow mode meaningful: you can read what the engine WOULD
 * have paid, compare it against your own judgement, and tune the thresholds —
 * all before an approve button exists anywhere.
 *
 * Turning proposals into real Payout rows is a separate, human-gated step that
 * is deliberately not implemented yet.
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const n = raw == null ? NaN : parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * ₦5,000 in kobo. Below this the flat transfer fee is a punitive share of the
 * payout, so small balances roll into the next run instead.
 */
export const DEFAULT_MIN_PAYOUT_KOBO = 500_000

/**
 * Shadow mode is ON unless explicitly disabled. Defaulting the other way would
 * mean a missing env var silently arms real settlement.
 */
export function isShadowMode(): boolean {
  return process.env.SETTLEMENT_SHADOW !== 'false'
}

/** A priced, risk-assessed proposal, ready to be written as a batch item. */
interface ProposedItem {
  walletId: string | null
  buyerWalletId: string | null
  amountGross: number
  amountNet: number
  platformFee: number
  transferFee: number
  flags: RiskFlag[]
  excluded: boolean
  excludeReason: string | null
}

interface Candidate {
  walletId?: string
  buyerWalletId?: string
  /** Withdrawable, in minor units. */
  available: number
  isSellerPayee: boolean
}

export const settlementService = {
  /**
   * Build a batch of proposed payouts for everything currently payable.
   *
   * Returns the batch id, or null when nothing qualifies — an empty batch is not
   * written, so the history stays a record of runs that had something to say.
   */
  async prepareBatch(opts: { currency?: string; shadow?: boolean } = {}) {
    const currency = opts.currency ?? 'NGN'
    const shadow = opts.shadow ?? isShadowMode()
    const floor = envInt('SETTLEMENT_MIN_PAYOUT_KOBO', DEFAULT_MIN_PAYOUT_KOBO)
    const periodEnd = new Date()

    const candidates = await this.findCandidates(currency, floor)
    if (!candidates.length) return null

    const priced: ProposedItem[] = []
    for (const c of candidates) {
      // Same fee calculation as a manual withdrawal — one source of truth for
      // what a payee actually receives.
      const { net, platformFee, transferFee } = calculatePayout(c.available)
      // Fees can exceed a small balance. The floor mostly prevents this; this is
      // the backstop, because an item with no net must never reach a batch.
      if (net <= 0) continue

      const risk = await this.assess(c)
      priced.push({
        walletId: c.walletId ?? null,
        buyerWalletId: c.buyerWalletId ?? null,
        amountGross: c.available,
        amountNet: net,
        platformFee,
        transferFee,
        flags: risk.flags,
        excluded: risk.shouldExclude,
        excludeReason: risk.shouldExclude
          ? `Auto-excluded pending review: ${risk.flags.join(', ')}`
          : null,
      })
    }
    if (!priced.length) return null

    // Period start is the previous run for this currency, so consecutive batches
    // tile the timeline without gaps or overlap.
    const previous = await prisma.settlementBatch.findFirst({
      where: { currency },
      orderBy: { preparedAt: 'desc' },
      select: { periodEnd: true },
    })
    const periodStart =
      previous?.periodEnd ?? new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000)

    const includedItems = priced.filter((p) => !p.excluded)
    const totals = includedItems.reduce(
      (acc, p) => ({
        gross: acc.gross + p.amountGross,
        net: acc.net + p.amountNet,
        fees: acc.fees + p.platformFee + p.transferFee,
      }),
      { gross: 0, net: 0, fees: 0 },
    )

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.settlementBatch.create({
        data: {
          currency,
          shadow,
          status: 'DRAFT',
          periodStart,
          periodEnd,
          // Totals describe what would actually be PAID — excluded items are
          // proposals a human has not agreed to, and counting them would
          // overstate the run at a glance.
          payoutCount: includedItems.length,
          flaggedCount: priced.length - includedItems.length,
          totalGross: totals.gross,
          totalNet: totals.net,
          totalFees: totals.fees,
        },
      })

      for (const item of priced) {
        await tx.settlementBatchItem.create({
          data: { batchId: created.id, ...item },
        })
      }
      return created
    })

    // The digest covers what was proposed, computed from the rows as persisted
    // rather than from the in-memory list, so it attests to what is actually in
    // the database.
    const digest = await this.computeDigest(batch.id)
    await prisma.settlementBatch.update({
      where: { id: batch.id },
      data: { approvalDigest: digest },
    })

    return {
      batchId: batch.id,
      shadow,
      proposed: priced.length,
      included: includedItems.length,
      flagged: priced.length - includedItems.length,
      totalNet: totals.net,
    }
  },

  /**
   * Everyone with a payable balance right now.
   *
   * Seller withdrawable is `balance - held_balance` — the same expression the
   * withdrawal endpoint guards on, so a batch can never propose money a manual
   * withdrawal would refuse.
   */
  async findCandidates(currency: string, floor: number): Promise<Candidate[]> {
    const sellers = await prisma.$queryRaw<
      { id: string; available: number }[]
    >`
      SELECT id, (balance - held_balance) AS available
      FROM "SellerWallet"
      WHERE currency = ${currency}
        AND (balance - held_balance) >= ${floor}::double precision
    `

    const buyers = await prisma.$queryRaw<
      { id: string; available: number }[]
    >`
      SELECT id, balance AS available
      FROM "BuyerWallet"
      WHERE currency = ${currency}
        AND balance >= ${floor}::double precision
    `

    return [
      ...sellers.map((s) => ({
        walletId: s.id,
        available: s.available,
        isSellerPayee: true,
      })),
      ...buyers.map((b) => ({
        buyerWalletId: b.id,
        available: b.available,
        isSellerPayee: false,
      })),
    ]
  },

  /** Gather the facts each rule needs, then apply them. */
  async assess(c: Candidate) {
    const where = c.walletId
      ? { walletId: c.walletId }
      : { buyerWalletId: c.buyerWalletId! }

    const priorPayouts = await prisma.payout.findMany({
      where: { ...where, status: 'PAID' },
      select: { amountGross: true },
      orderBy: { requested_at: 'desc' },
      take: 20,
    })

    let newestBankAccountAgeHours: number | null = null
    let trustTier: string | null = null
    let hasActiveHold = false
    let hasUnsecuredClaim = false

    if (c.walletId) {
      const wallet = await prisma.sellerWallet.findUnique({
        where: { id: c.walletId },
        select: {
          seller: {
            select: {
              trustTier: true,
              bankAccounts: {
                select: { created_at: true },
                orderBy: { created_at: 'desc' },
                take: 1,
              },
            },
          },
        },
      })
      trustTier = wallet?.seller?.trustTier ?? null
      const newest = wallet?.seller?.bankAccounts?.[0]?.created_at
      if (newest) {
        newestBankAccountAgeHours =
          (Date.now() - new Date(newest).getTime()) / 3_600_000
      }

      const holds = await prisma.walletHold.findMany({
        where: { walletId: c.walletId, status: 'ACTIVE' },
        select: { amount: true, amountRequested: true },
      })
      hasActiveHold = holds.length > 0
      hasUnsecuredClaim = holds.some((h) => h.amount < h.amountRequested)
    } else {
      // Affiliates have no BankAccount records — they supply details per
      // withdrawal. Treat the destination as unproven rather than missing, so
      // they are not permanently flagged NO_BANK_ACCOUNT.
      newestBankAccountAgeHours = Number.POSITIVE_INFINITY
    }

    return assessPayoutRisk({
      amountGross: c.available,
      priorPayoutAmounts: priorPayouts.map((p) => p.amountGross),
      newestBankAccountAgeHours,
      hasActiveHold,
      hasUnsecuredClaim,
      trustTier,
      isSellerPayee: c.isSellerPayee,
    })
  },

  /**
   * Fingerprint of what a reviewer is agreeing to: every included item's id, net
   * amount and destination.
   *
   * Recomputed before execution. If it differs, something changed between
   * approval and payment and the batch must not run — that is the whole reason
   * an approval is worth anything.
   */
  async computeDigest(batchId: string): Promise<string> {
    const items = await prisma.settlementBatchItem.findMany({
      where: { batchId, excluded: false },
      select: {
        id: true,
        amountNet: true,
        walletId: true,
        buyerWalletId: true,
      },
      orderBy: { id: 'asc' },
    })
    const canonical = items
      .map(
        (i) =>
          `${i.id}:${i.amountNet}:${i.walletId ?? ''}:${i.buyerWalletId ?? ''}`,
      )
      .join('|')
    return createHash('sha256').update(canonical).digest('hex')
  },

  /**
   * Has the batch changed since it was fingerprinted?
   *
   * Every path that would move money must call this first and refuse on false.
   */
  async verifyDigest(batchId: string): Promise<boolean> {
    const batch = await prisma.settlementBatch.findUniqueOrThrow({
      where: { id: batchId },
      select: { approvalDigest: true },
    })
    if (!batch.approvalDigest) return false
    return (await this.computeDigest(batchId)) === batch.approvalDigest
  },

  /** Batch plus items, for the admin review screen. */
  async getBatch(batchId: string) {
    return prisma.settlementBatch.findUnique({
      where: { id: batchId },
      include: {
        items: {
          orderBy: [{ excluded: 'desc' }, { amountNet: 'desc' }],
          include: {
            wallet: {
              select: {
                seller: {
                  select: { store_name: true, store_slug: true, store_logo: true },
                },
              },
            },
            buyerWallet: {
              select: { profile: { select: { username: true, avatar: true } } },
            },
          },
        },
      },
    })
  },

  async listBatches(limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      prisma.settlementBatch.findMany({
        orderBy: { preparedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.settlementBatch.count(),
    ])
    return { items, total, limit, offset }
  },
}

export type { RiskFlag }
