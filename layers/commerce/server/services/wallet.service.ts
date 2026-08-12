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
        // Move the exact held amount from pending → available.
        await tx.sellerWallet.update({
          where: { id: walletId },
          data: {
            pending_balance: { decrement: total },
            balance: { increment: total },
          },
        })
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

  async getWallet(sellerId: string) {
    const wallet = await walletRepository.getOrCreateWallet(sellerId)
    const stats = await walletRepository.getWalletStats(wallet.id)
    return { wallet, stats }
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

    const wallet = await walletRepository.getOrCreateWallet(sellerId)

    // Atomic conditional decrement — eliminates the read-check-decrement race.
    // Two concurrent withdrawals can't both pass: the second updateMany matches
    // zero rows once the balance drops below the requested amount.
    const payout = await prisma.$transaction(async (tx) => {
      const result = await tx.sellerWallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      })
      if (result.count === 0) {
        throw new UserError(
          'INSUFFICIENT_BALANCE',
          'Insufficient wallet balance',
          400,
        )
      }

      const created = await tx.payout.create({
        data: {
          walletId: wallet.id,
          amount,
          status: 'PENDING',
          bank_account: bankAccount,
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
      changes: { amount },
      ipAddress,
      userAgent,
    })

    return {
      payout,
      wallet: await walletRepository.getWalletBySellerId(sellerId),
    }
  },
}
