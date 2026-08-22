import { UserError } from '~~/layers/profile/server/types/user.types'
import { auditQueue } from '~~/server/queues/audit.queue'
import { walletRepository } from '../repositories/wallet.repository'
import { buyerWalletRepository } from '../repositories/buyer-wallet.repository'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import {
  buildAffiliateCommissionEmail,
  buildFundsReleasedEmail,
} from '~~/server/utils/email/emailService'
import { verifyShippingQuote } from '~~/layers/shipping/server/utils/quoteToken'
import { squareService } from '~~/layers/square/server/services/square.service'

/**
 * True when this order's shipping is fulfilled by the seller themselves
 * (self / own-rider delivery or in-person pickup) rather than a real carrier.
 * For self-delivery the seller IS the courier, so the delivery fee is theirs;
 * for a carrier (GIG) it is owed to the carrier and must NOT be credited here.
 *
 * Detected from the signed quote token's provider claim (tamper-proof), with a
 * fallback to the persisted carrier name for legacy orders placed before the
 * token carried the provider id.
 */
function isSelfDeliveryOrder(shippingBreakdown: unknown): boolean {
  const bd = shippingBreakdown as
    | { token?: string; carrier?: string }
    | null
    | undefined
  if (!bd) return false
  const claims = verifyShippingQuote(bd.token)
  if (claims?.c) return claims.c === 'self'
  return /^(seller delivery|pickup from seller)/i.test(String(bd.carrier ?? ''))
}

interface BankAccount {
  type?: string
  account_number: string
  bank_code: string
  name: string
  [key: string]: string | undefined
}

export const walletService = {
  /**
   * Called when payment is confirmed (PAID).
   * Credits each seller's pending_balance. Stores transactions as 'CREDIT_PENDING'
   * so the exact same amounts can be released on delivery without recalculation.
   */
  async creditSellersOnPayment(orderId: number) {
    // Idempotency guard — skip if already credited for this order
    const existing = await prisma.transaction.findFirst({
      where: { orderId, type: { in: ['CREDIT_PENDING', 'CREDIT'] } },
    })
    if (existing) return

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { shippingCost: true, shippingBreakdown: true },
    })

    const items = await prisma.orderItem.findMany({
      where: { orderId },
      select: {
        price: true,
        affiliateCut: true,
        variant: {
          select: {
            product: {
              select: {
                seller: { select: { id: true } },
              },
            },
          },
        },
      },
    })

    const sellerAmounts = new Map<string, number>()
    for (const item of items) {
      const sellerId = item.variant.product.seller?.id
      if (!sellerId) continue
      // item.price is the line total the buyer paid. Affiliate cut (if any) is
      // deducted so the seller only receives their net amount — the affiliate
      // earns the cut, not the platform.
      const net = item.price - (item.affiliateCut ?? 0)
      sellerAmounts.set(sellerId, (sellerAmounts.get(sellerId) ?? 0) + net)
    }

    for (const [sellerId, amount] of sellerAmounts) {
      if (amount <= 0) continue
      const wallet = await walletRepository.getOrCreateWallet(sellerId)
      await walletRepository.incrementPendingBalance(wallet.id, amount)
      // Store as CREDIT_PENDING — this exact record is used for the release
      await walletRepository.createTransaction(wallet.id, {
        amount,
        type: 'CREDIT_PENDING',
        description: `Order #${orderId} — payment held pending delivery`,
        orderId,
      })
    }

    // Self-delivery: the seller is the courier, so the delivery fee they set is
    // theirs — credit it alongside the goods (held pending, released on delivery
    // with the same rules). For a real carrier the fee is owed to the carrier,
    // so it is deliberately NOT credited here. Orders are one-seller, so the
    // whole shippingCost belongs to that single seller.
    const shippingFee = order?.shippingCost ?? 0
    if (shippingFee > 0 && isSelfDeliveryOrder(order?.shippingBreakdown)) {
      const sellerId = items.find((i) => i.variant.product.seller?.id)?.variant
        .product.seller?.id
      if (sellerId) {
        const wallet = await walletRepository.getOrCreateWallet(sellerId)
        await walletRepository.incrementPendingBalance(wallet.id, shippingFee)
        await walletRepository.createTransaction(wallet.id, {
          amount: shippingFee,
          type: 'CREDIT_PENDING',
          description: `Order #${orderId} — delivery fee (self-shipping) held pending delivery`,
          orderId,
        })
      }
    }

    // Tell the referrer their link converted. This is the only hook every payment
    // path shares (card → paymentConfirmation, PayPal capture, POD confirm-cash),
    // so it lives here rather than in any one endpoint. Non-blocking: a failed
    // notification must never fail a confirmed payment.
    this.notifyAffiliateOfConversion(orderId).catch((e) =>
      logger.logError('[wallet] affiliate conversion notification', e, { orderId }),
    )
  },

  /**
   * Notify the referring affiliate that an order placed through their link has
   * been paid for. Fires at payment, NOT delivery — the commission is still
   * pending at this point, but waiting until release means the affiliate learns
   * about a sale days later (or a week, via the auto-release cron), which is far
   * too late to reinforce the sharing that produced it.
   */
  async notifyAffiliateOfConversion(orderId: number) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { affiliateUserId: true, affiliateCut: true },
    })
    if (!order?.affiliateUserId || order.affiliateCut <= 0) return

    const amount = `₦${(order.affiliateCut / 100).toLocaleString('en-NG')}`
    notificationQueue.enqueue(
      {
        userId: order.affiliateUserId,
        type: 'ORDER',
        orderId,
        message: `Your referral converted — ${amount} commission pending on Order #${orderId}. It's released to you once the buyer receives the order.`,
      },
      // Idempotent: POD re-confirms and webhook/verify races must not double-ping.
      { dedupeKey: `affiliate-conversion:${orderId}` },
    )
  },

  /**
   * Called when order status moves to DELIVERED.
   * Finds the CREDIT_PENDING transactions for this order and releases the
   * exact same amounts — no recalculation, no floating-point drift.
   * Also credits the affiliate wallet if this order had a referral.
   */
  async releaseFundsOnDelivery(orderId: number) {
    // Atomic claim-and-move so concurrent callers (buyer confirm-receipt, seller
    // status → DELIVERED, and the 7-day auto-release cron) can't double-release.
    // The whole claim + balance move runs in ONE transaction; the winning caller's
    // conditional updateMany flips the pending rows, and any racing caller then
    // matches zero rows and bails before touching a balance. This replaces the old
    // read-then-write guard, which two callers could both pass and double-credit.
    const byWallet = await prisma.$transaction(async (tx) => {
      const pendingCredits = await tx.transaction.findMany({
        where: { orderId, type: 'CREDIT_PENDING' },
      })
      if (!pendingCredits.length) return null

      // Claim: only the caller whose updateMany changes rows owns this release.
      const { count } = await tx.transaction.updateMany({
        where: { orderId, type: 'CREDIT_PENDING' },
        data: {
          type: 'CREDIT_RELEASED',
          description: `Order #${orderId} — delivered, funds released to balance`,
        },
      })
      if (count === 0) return null

      const totals = new Map<string, number>()
      for (const c of pendingCredits) {
        totals.set(c.walletId, (totals.get(c.walletId) ?? 0) + c.amount)
      }
      for (const [walletId, total] of totals) {
        if (total <= 0) continue

        // The association cut comes OUT OF THE SELLER'S SHARE, taken here at
        // release rather than credited separately at payment.
        //
        // It used to be credited to the association wallet without being debited
        // from anyone, so the sum of all wallet balances exceeded the money
        // actually collected. Splitting the seller's own released amount keeps
        // the identity exact:
        //
        //   line total = affiliate commission + association cut + seller amount
        //
        // Taking it at release (not payment) also means a cancelled or reversed
        // order needs no separate association unwind — the whole pending credit
        // reverses as one figure, exactly as it did before.
        const cut = await squareService.resolveAssociationCut(walletId, total, tx)
        const sellerShare = total - (cut?.cutAmount ?? 0)

        await tx.sellerWallet.update({
          where: { id: walletId },
          data: {
            // Pending always drops by the full held amount; only the part that
            // reaches the seller's usable balance is reduced by the cut.
            pending_balance: { decrement: total },
            balance: { increment: sellerShare },
          },
        })

        if (cut && cut.cutAmount > 0) {
          await squareService.applyAssociationCredit(cut, orderId, total, tx)
          await tx.transaction.create({
            data: {
              walletId,
              amount: cut.cutAmount,
              type: 'ASSOCIATION_CUT',
              description: `Order #${orderId} — ${cut.cutPercent}% association cut to ${cut.squareName ?? 'your Square'}`,
              orderId,
            },
          })
        }
      }
      return totals
    })

    // Lost the race (already released) or nothing to release TO A SELLER. The
    // affiliate credit is deliberately NOT gated on that: an order whose whole
    // line total went to commission (the clamp in placeOrder can make the seller
    // net exactly 0, so no CREDIT_PENDING row is ever written) would otherwise
    // bail here and the affiliate would never be paid for money the buyer did
    // pay. `creditAffiliate` carries its own idempotency guard, so it is safe to
    // run on the losing side of the race too.
    if (!byWallet) {
      await this.creditAffiliate(orderId)
      return
    }

    // Notify each seller — resolve wallet IDs to seller profiles, then notify individually
    prisma.sellerWallet.findMany({
      where: { id: { in: [...byWallet.keys()] } },
      select: {
        id: true,
        seller: {
          select: {
            profileId: true,
            profile: { select: { email: true } },
          },
        },
      },
    }).then((walletRows) => {
      for (const row of walletRows) {
        const profileId = row.seller?.profileId
        if (!profileId) continue
        const amount = byWallet.get(row.id) ?? 0
        notificationQueue.enqueue({
          userId: profileId,
          type: 'ORDER',
          message: `₦${(amount / 100).toLocaleString('en-NG')} from Order #${orderId} has been released to your wallet.`,
          orderId,
        })
        const email = row.seller?.profile?.email
        if (email) {
          const { subject, html, text } = buildFundsReleasedEmail(orderId, amount)
          emailQueue.enqueue({ to: email, subject, html, text, type: 'GENERAL' })
        }
      }
    }).catch(() => {})

    await this.creditAffiliate(orderId)
  },

  /**
   * Credit the referring affiliate's wallet for a delivered order.
   * Split out of `releaseFundsOnDelivery` so it runs on every delivery path,
   * including ones where no seller CREDIT_PENDING row exists. Idempotent: an
   * existing AFFILIATE_CREDIT transaction for this order is a no-op.
   */
  async creditAffiliate(orderId: number) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { affiliateUserId: true, affiliateCut: true },
    })

    if (!order?.affiliateUserId || order.affiliateCut <= 0) return
    const affiliateUserId = order.affiliateUserId
    const amountKobo = order.affiliateCut

    /** In-app + WhatsApp (via the ORDER type) + email, mirroring what the seller
     *  gets on the same release. Called only inside the idempotency guards below,
     *  so a repeat release never re-sends. */
    const announce = (isSellerWallet: boolean) => {
      notificationQueue.enqueue({
        userId: affiliateUserId,
        type: 'ORDER',
        message: `You earned ₦${(amountKobo / 100).toLocaleString('en-NG')} affiliate commission from Order #${orderId}`,
        orderId,
      })
      prisma.profile
        .findUnique({ where: { id: affiliateUserId }, select: { email: true } })
        .then((p) => {
          // Skip synthetic guest-checkout addresses — they route nowhere.
          if (!p?.email || p.email.includes('@checkout.marketx.')) return
          const base = useRuntimeConfig().public.baseURL
          const { subject, html, text } = buildAffiliateCommissionEmail(
            orderId,
            amountKobo,
            {
              isSellerWallet,
              walletUrl: base ? `${base}/profile/me?tab=wallet` : undefined,
            },
          )
          emailQueue.enqueue({ to: p.email, subject, html, text, type: 'GENERAL' })
        })
        .catch((e) =>
          logger.logError('[wallet] affiliate commission email', e, { orderId }),
        )
    }

    // Affiliate must have a seller profile to receive a seller-wallet credit
    const sellerProfile = await prisma.sellerProfile.findFirst({
      where: { profileId: affiliateUserId },
      select: { id: true },
    })

    if (sellerProfile) {
      const wallet = await walletRepository.getOrCreateWallet(sellerProfile.id)
      // Idempotency: don't double-credit if called again
      const existingAffiliate = await prisma.transaction.findFirst({
        where: { walletId: wallet.id, orderId, type: 'AFFILIATE_CREDIT' },
      })
      if (!existingAffiliate) {
        await walletRepository.incrementBalance(wallet.id, amountKobo)
        await walletRepository.createTransaction(wallet.id, {
          amount: amountKobo,
          type: 'AFFILIATE_CREDIT',
          description: `Affiliate commission — Order #${orderId}`,
          orderId,
        })
        announce(true)
      }
    } else {
      // Non-seller affiliate — credit their BuyerWallet
      const buyerWallet = await buyerWalletRepository.getOrCreate(affiliateUserId)
      const existingBuyerCredit = await buyerWalletRepository.findExistingCredit(
        buyerWallet.id,
        orderId,
        'AFFILIATE_CREDIT',
      )
      if (!existingBuyerCredit) {
        await buyerWalletRepository.incrementBalance(buyerWallet.id, amountKobo)
        await buyerWalletRepository.createTransaction(buyerWallet.id, {
          amount: amountKobo,
          type: 'AFFILIATE_CREDIT',
          description: `Affiliate commission — Order #${orderId}`,
          orderId,
        })
        announce(false)
      }
    }
  },

  /**
   * Called when a PAID order is cancelled before delivery.
   * Reverses CREDIT_PENDING entries so the seller's pending balance is correct.
   * Does NOT issue a Paystack refund — that must be handled separately or manually.
   */
  async reverseOrderCredit(orderId: number) {
    // Atomic claim-and-reverse — mirrors releaseFundsOnDelivery. Only the caller
    // whose conditional updateMany flips the CREDIT_PENDING rows decrements the
    // pending balance, so a cancel racing another cancel (or a delivery release)
    // can't double-reverse. Whichever of release/reverse commits first wins; the
    // other matches zero rows and no-ops.
    await prisma.$transaction(async (tx) => {
      const pendingCredits = await tx.transaction.findMany({
        where: { orderId, type: 'CREDIT_PENDING' },
      })
      if (!pendingCredits.length) return

      const { count } = await tx.transaction.updateMany({
        where: { orderId, type: 'CREDIT_PENDING' },
        data: {
          type: 'CREDIT_CANCELLED',
          description: `Order #${orderId} cancelled — pending credit reversed`,
        },
      })
      if (count === 0) return

      const totals = new Map<string, number>()
      for (const c of pendingCredits) {
        totals.set(c.walletId, (totals.get(c.walletId) ?? 0) + c.amount)
      }
      for (const [walletId, total] of totals) {
        if (total <= 0) continue
        await tx.sellerWallet.update({
          where: { id: walletId },
          data: { pending_balance: { decrement: total } },
        })
      }
    })
  },

  // ── Dispute holds ──────────────────────────────────────────────────────────
  //
  // reverseOrderCredit can only unwind CREDIT_PENDING rows. Once an order is
  // DELIVERED the money has moved to `balance` and there is nothing left to
  // reverse — so a buyer disputing a delivered order could not be made whole if
  // the seller withdrew first. A hold freezes that money while the dispute runs.

  /**
   * Freeze the released proceeds of a disputed order.
   *
   * Only CREDIT_RELEASED rows are held: if the order is still pre-delivery its
   * credit is CREDIT_PENDING, which reverseOrderCredit already handles, and
   * holding it too would double-count the same money.
   *
   * Idempotent by database constraint — the unique index on (ticketId, walletId)
   * means a repeated hook fires once, without a read-then-write check that two
   * concurrent callers could both pass.
   *
   * A hold cannot recover money already withdrawn. If the seller has less left
   * than the order was worth, only what remains is frozen; `amountRequested`
   * records the full claim so the shortfall is visible rather than silently
   * clamped away.
   */
  async holdForDispute(orderId: number, ticketId: string) {
    const released = await prisma.transaction.findMany({
      where: { orderId, type: 'CREDIT_RELEASED' },
      select: { walletId: true, amount: true },
    })
    if (!released.length) return { held: 0, holds: 0 }

    const byWallet = new Map<string, number>()
    for (const r of released) {
      byWallet.set(r.walletId, (byWallet.get(r.walletId) ?? 0) + r.amount)
    }

    let totalHeld = 0
    let holds = 0

    for (const [walletId, requested] of byWallet) {
      if (requested <= 0) continue
      try {
        const held = await prisma.$transaction(async (tx) => {
          // One statement decides and applies the cap, so a concurrent
          // withdrawal cannot slip between "how much is available" and
          // "freeze that much". GREATEST(0, ...) keeps the CHECK constraints
          // satisfied when the wallet is already fully held.
          const rows = await tx.$queryRaw<{ delta: number }[]>`
            WITH w AS (
              SELECT id, GREATEST(0, LEAST(${requested}::double precision,
                                           balance - held_balance)) AS delta
              FROM "SellerWallet" WHERE id = ${walletId}::uuid
            )
            UPDATE "SellerWallet" s
            SET held_balance = s.held_balance + w.delta
            FROM w WHERE s.id = w.id
            RETURNING w.delta AS delta
          `
          const delta = rows[0]?.delta ?? 0

          await tx.walletHold.create({
            data: {
              walletId,
              orderId,
              ticketId,
              amount: delta,
              amountRequested: requested,
              reason: `Dispute on order #${orderId}`,
            },
          })
          return delta
        })
        totalHeld += held
        holds++
      } catch (e: unknown) {
        // P2002 = the unique (ticketId, walletId) index fired: this dispute has
        // already frozen this wallet. Expected on a retry, not an error.
        if ((e as { code?: string })?.code === 'P2002') continue
        logger.logError('[wallet] holdForDispute', e, { orderId, ticketId, walletId })
        throw e
      }
    }

    return { held: totalHeld, holds }
  },

  /**
   * Dispute resolved in the seller's favour — unfreeze, funds usable again.
   */
  async releaseHold(ticketId: string) {
    const active = await prisma.walletHold.findMany({
      where: { ticketId, status: 'ACTIVE' },
      select: { id: true, walletId: true, amount: true },
    })
    if (!active.length) return { released: 0 }

    let released = 0
    for (const h of active) {
      await prisma.$transaction(async (tx) => {
        // Conditional claim: only the caller that flips ACTIVE → RELEASED moves
        // the balance, so two concurrent resolutions cannot both unfreeze.
        const { count } = await tx.walletHold.updateMany({
          where: { id: h.id, status: 'ACTIVE' },
          data: { status: 'RELEASED', resolved_at: new Date() },
        })
        if (count === 0) return
        if (h.amount > 0) {
          await tx.sellerWallet.update({
            where: { id: h.walletId },
            data: { held_balance: { decrement: h.amount } },
          })
        }
        released += h.amount
      })
    }
    return { released }
  },

  /**
   * Dispute resolved against the seller — take the frozen money back so the
   * buyer can be refunded. Debits `balance` and `held_balance` together, which
   * is what keeps held_balance <= balance true.
   *
   * `capAmount` supports PARTIAL_REFUND: capture up to that much and release the
   * remainder. Omitted means capture the whole hold.
   */
  async captureHold(ticketId: string, capAmount?: number) {
    const active = await prisma.walletHold.findMany({
      where: { ticketId, status: 'ACTIVE' },
      select: { id: true, walletId: true, amount: true, orderId: true },
    })
    if (!active.length) return { captured: 0 }

    let remaining = capAmount ?? Number.POSITIVE_INFINITY
    let captured = 0

    for (const h of active) {
      const take = Math.min(h.amount, Math.max(0, remaining))
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.walletHold.updateMany({
          where: { id: h.id, status: 'ACTIVE' },
          data: {
            status: take > 0 ? 'CAPTURED' : 'RELEASED',
            resolved_at: new Date(),
          },
        })
        if (count === 0) return

        if (h.amount > 0) {
          await tx.sellerWallet.update({
            where: { id: h.walletId },
            data: {
              // The captured part leaves the wallet; the whole hold is unfrozen
              // either way, so held_balance always drops by the full amount.
              balance: { decrement: take },
              held_balance: { decrement: h.amount },
            },
          })
        }
        if (take > 0) {
          await tx.transaction.create({
            data: {
              walletId: h.walletId,
              amount: take,
              type: 'DISPUTE_CAPTURE',
              description: `Dispute resolved for buyer — Order #${h.orderId} debited for refund`,
              orderId: h.orderId,
            },
          })
        }
        captured += take
        remaining -= take
      })
    }
    return { captured }
  },

  // ── Affiliate (buyer wallet) payouts ───────────────────────────────────────

  /**
   * Withdraw affiliate commission from a BuyerWallet.
   *
   * Affiliates who are not sellers earn real commission that, until now, had no
   * route out of the platform. This mirrors the seller path exactly — the gross
   * leaves the wallet, the payout row carries the net, one atomic conditional
   * decrement guards against two simultaneous requests.
   *
   * THE TALLY
   *
   * What can be withdrawn here can never exceed what was deducted from goods.
   * The chain holds end to end:
   *
   *   orderItem.affiliateCut  is clamped at order time to <= the line total
   *   Orders.affiliateCut     is the exact sum of its items' cuts
   *   AFFILIATE_CREDIT        credits that same figure, once (idempotency-guarded)
   *   balance                 only ever moves by those credits and these debits
   *
   * so:  goods line total = affiliate commission + association cut + seller amount
   *
   * `assertAffiliateTally` re-checks this against the ledger before the money
   * moves, so a bug anywhere upstream stops the payout rather than overpaying.
   */
  async withdrawAffiliateEarnings(
    profileId: string,
    amount: number,
    bankAccount: BankAccount,
    ipAddress: string,
    userAgent: string,
  ) {
    if (amount <= 0)
      throw new UserError('INVALID_AMOUNT', 'Amount must be greater than 0', 400)

    const { net, platformFee, transferFee } = calculatePayout(amount)
    if (net <= 0)
      throw new UserError(
        'AMOUNT_TOO_SMALL',
        'Amount does not exceed the withdrawal fees',
        400,
      )

    const wallet = await buyerWalletRepository.getOrCreate(profileId)

    // Independent check against the transaction ledger. The balance column is a
    // running total; this asks the source records whether that total is one this
    // wallet is actually entitled to. Cheap, and it fails closed.
    await this.assertAffiliateTally(wallet.id)

    const payout = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "BuyerWallet"
        SET balance = balance - ${amount}::double precision
        WHERE id = ${wallet.id}::uuid
          AND balance >= ${amount}::double precision
      `
      if (updated === 0)
        throw new UserError(
          'INSUFFICIENT_BALANCE',
          'Insufficient wallet balance',
          400,
        )

      const created = await tx.payout.create({
        data: {
          buyerWalletId: wallet.id,
          amount,
          amountGross: amount,
          amountNet: net,
          platformFee,
          transferFee,
          status: 'PENDING',
          bank_account: { ...bankAccount, netAmount: net, platformFee, transferFee },
        },
      })
      await tx.buyerTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          description: `Affiliate withdrawal request #${created.id.slice(0, 8)}`,
        },
      })
      return created
    })

    auditQueue.enqueue({
      userId: profileId,
      action: 'AFFILIATE_WITHDRAWAL',
      resource: 'BuyerWallet',
      resourceId: wallet.id,
      reason: 'Affiliate withdrawal requested',
      changes: { amount, net, platformFee, transferFee },
      ipAddress,
      userAgent,
    })

    return {
      payout,
      breakdown: { gross: amount, net, platformFee, transferFee },
    }
  },

  /**
   * Guard: a buyer wallet's balance must be explainable by its own ledger.
   *
   * credits (affiliate commission, refunds, other credits) minus debits must
   * equal the stored balance. If they disagree, something upstream has credited
   * money that was never deducted from an order — exactly the class of bug that
   * made association cuts inflate platform liabilities — and no payout should be
   * created until it is understood.
   */
  async assertAffiliateTally(buyerWalletId: string) {
    const [wallet, credits, debits] = await Promise.all([
      prisma.buyerWallet.findUniqueOrThrow({
        where: { id: buyerWalletId },
        select: { balance: true },
      }),
      prisma.buyerTransaction.aggregate({
        where: {
          walletId: buyerWalletId,
          type: { in: ['AFFILIATE_CREDIT', 'CREDIT', 'REFUND'] },
        },
        _sum: { amount: true },
      }),
      prisma.buyerTransaction.aggregate({
        where: { walletId: buyerWalletId, type: 'DEBIT' },
        _sum: { amount: true },
      }),
    ])

    const expected = (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0)
    // Tolerance of one minor unit absorbs float representation only — not a
    // genuine discrepancy, which will be orders of magnitude larger.
    if (Math.abs(expected - wallet.balance) > 1) {
      logger.logError(
        '[wallet] affiliate tally mismatch',
        new Error('Buyer wallet balance does not match its transaction ledger'),
        { buyerWalletId, balance: wallet.balance, expected },
      )
      throw new UserError(
        'LEDGER_MISMATCH',
        'This wallet is under review and cannot be withdrawn from right now.',
        409,
      )
    }
    return expected
  },

  async getWallet(sellerId: string) {
    const wallet = await walletRepository.getOrCreateWallet(sellerId)
    const stats = await walletRepository.getWalletStats(wallet.id)

    // `balance` alone is misleading once anything is held: a seller seeing
    // ₦50,000 and being refused a ₦50,000 withdrawal has no way to understand
    // why. Surface withdrawable and the held amount as first-class values, plus
    // the disputes responsible, so the UI can explain the difference.
    const held = wallet.held_balance ?? 0
    const holds = held > 0
      ? await prisma.walletHold.findMany({
          where: { walletId: wallet.id, status: 'ACTIVE' },
          select: { orderId: true, amount: true, reason: true, created_at: true },
          orderBy: { created_at: 'desc' },
        })
      : []

    return {
      wallet,
      stats,
      available: Math.max(0, wallet.balance - held),
      held,
      holds,
    }
  },

  async getTransactions(sellerId: string, limit = 20, offset = 0) {
    const wallet = await walletRepository.getOrCreateWallet(sellerId)
    const [transactions, total] = await Promise.all([
      walletRepository.getTransactions(wallet.id, limit, offset),
      walletRepository.countTransactions(wallet.id),
    ])
    return { transactions, total, limit, offset }
  },

  // NOTE: `addFunds` (seller wallet top-up) was REMOVED before launch — it credited
  // the withdrawable balance directly from a client-supplied amount with NO payment,
  // a free-money exploit. Its only purpose was POD pre-funding, and POD is paused at
  // launch. To re-introduce it for POD, see docs/PAYMENTS.md ("Seller wallet top-up
  // (removed)"): it MUST initialize a Paystack transaction and credit the wallet
  // exactly once from a signature-verified webhook keyed on the payment reference.

  async withdraw(
    sellerId: string,
    amount: number,
    bankAccount: BankAccount,
    ipAddress: string,
    userAgent: string,
  ) {
    if (amount <= 0)
      throw new UserError(
        'INVALID_AMOUNT',
        'Amount must be greater than 0',
        400,
      )

    // The fee split is computed HERE, not taken from the caller, so exactly one
    // place decides what gets persisted as owed. The endpoint runs the same
    // calculation for its preview and its below-fees guard, but what a future
    // payout executor transfers is whatever this line produced — a caller can no
    // longer influence the payable by shaping the bankAccount object it passes.
    const { net, platformFee, transferFee } = calculatePayout(amount)

    // Defence in depth: the endpoint already rejects a fee-consumed amount. If a
    // second caller ever appears, this stops a wallet being debited for a payout
    // that would send the seller nothing.
    if (net <= 0)
      throw new UserError(
        'AMOUNT_TOO_SMALL',
        'Amount does not exceed the withdrawal fees',
        400,
      )

    const wallet = await walletRepository.getOrCreateWallet(sellerId)

    // Atomic conditional decrement — eliminates the read-check-decrement race.
    // Two concurrent withdrawals can't both pass: the second updateMany matches
    // zero rows once the balance drops below the requested amount.
    const payout = await prisma.$transaction(async (tx) => {
      // Raw SQL because the guard compares two columns — Prisma's updateMany
      // cannot express `balance - held_balance >= amount`, and splitting it into
      // a read then a write reopens the race this statement exists to close.
      //
      // Withdrawable is balance MINUS money frozen by open disputes. Without the
      // held_balance term a seller could withdraw funds already earmarked to
      // refund a buyer, which is exactly the hole WalletHold was added to close.
      const updated = await tx.$executeRaw`
        UPDATE "SellerWallet"
        SET balance = balance - ${amount}::double precision
        WHERE id = ${wallet.id}::uuid
          AND balance - held_balance >= ${amount}::double precision
      `
      if (updated === 0) {
        // Distinguish the two causes: "you have no money" and "your money is
        // frozen pending a dispute" are very different messages to a seller.
        const current = await tx.sellerWallet.findUnique({
          where: { id: wallet.id },
          select: { balance: true, held_balance: true },
        })
        if ((current?.held_balance ?? 0) > 0) {
          throw new UserError(
            'FUNDS_ON_HOLD',
            `₦${(((current?.held_balance ?? 0)) / 100).toLocaleString('en-NG')} of your balance is on hold pending an open dispute and cannot be withdrawn yet.`,
            400,
          )
        }
        throw new UserError(
          'INSUFFICIENT_BALANCE',
          'Insufficient wallet balance',
          400,
        )
      }

      const created = await tx.payout.create({
        data: {
          walletId: wallet.id,
          // `amount` stays the gross for every existing reader; `amountGross`
          // is the same number under an unambiguous name. `amountNet` is the
          // only field a payout executor may transfer.
          amount,
          amountGross: amount,
          amountNet: net,
          platformFee,
          transferFee,
          status: 'PENDING',
          // Dual-write: the JSON keeps carrying netAmount so the admin screen's
          // existing fallback path stays correct until it reads the columns.
          bank_account: { ...bankAccount, netAmount: net, platformFee, transferFee },
        },
      })
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          description: `Withdrawal request #${created.id.slice(0, 8)}`,
        },
      })
      return created
    })

    auditQueue.enqueue({
      userId: sellerId,
      action: 'WALLET_WITHDRAWAL',
      resource: 'SellerWallet',
      resourceId: wallet.id,
      reason: 'Withdrawal requested',
      // Record the whole split, not just the debit: when a payout is queried
      // later the audit trail must show what the seller was owed, not only what
      // left the wallet.
      changes: { amount, net, platformFee, transferFee },
      ipAddress,
      userAgent,
    })

    return {
      payout,
      wallet: await walletRepository.getWalletBySellerId(sellerId),
    }
  },
}
