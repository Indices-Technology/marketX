import { UserError } from '~~/layers/profile/server/types/user.types'
import { auditQueue } from '~~/server/queues/audit.queue'
import { walletRepository } from '../repositories/wallet.repository'
import { buyerWalletRepository } from '../repositories/buyer-wallet.repository'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { buildFundsReleasedEmail } from '~~/server/utils/email/emailService'

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
  },

  /**
   * Called when order status moves to DELIVERED.
   * Finds the CREDIT_PENDING transactions for this order and releases the
   * exact same amounts — no recalculation, no floating-point drift.
   * Also credits the affiliate wallet if this order had a referral.
   */
  async releaseFundsOnDelivery(orderId: number) {
    // Idempotency guard — skip if already released
    const alreadyReleased = await prisma.transaction.findFirst({
      where: { orderId, type: 'CREDIT_RELEASED' },
    })
    if (alreadyReleased) return

    // Find the pending credits that were created at payment time
    const pendingCredits = await prisma.transaction.findMany({
      where: { orderId, type: 'CREDIT_PENDING' },
    })

    if (!pendingCredits.length) {
      logger.warn(
        `[wallet] No CREDIT_PENDING transactions found for order #${orderId} — skipping release`,
      )
      return
    }

    // Group by wallet
    const byWallet = new Map<string, { total: number; ids: string[] }>()
    for (const tx of pendingCredits) {
      const entry = byWallet.get(tx.walletId) ?? { total: 0, ids: [] }
      entry.total += tx.amount
      entry.ids.push(tx.id)
      byWallet.set(tx.walletId, entry)
    }

    for (const [walletId, { total, ids }] of byWallet) {
      if (total <= 0) continue
      // Move exact amount from pending → available
      await walletRepository.releasePendingToBalance(walletId, total)
      // Promote the transactions from CREDIT_PENDING → CREDIT_RELEASED
      // so they show as earned in stats and history
      await prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: {
          type: 'CREDIT_RELEASED',
          description: `Order #${orderId} — delivered, funds released to balance`,
        },
      })
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
        const amount = byWallet.get(row.id)?.total ?? 0
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

    // Credit affiliate wallet if this order had a referral
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { affiliateUserId: true, affiliateCut: true },
    })

    if (order?.affiliateUserId && order.affiliateCut > 0) {
      // Affiliate must have a seller profile to receive a wallet credit
      const sellerProfile = await prisma.sellerProfile.findFirst({
        where: { profileId: order.affiliateUserId },
        select: { id: true },
      })

      if (sellerProfile) {
        const wallet = await walletRepository.getOrCreateWallet(
          sellerProfile.id,
        )
        // Idempotency: don't double-credit if called again
        const existingAffiliate = await prisma.transaction.findFirst({
          where: { walletId: wallet.id, orderId, type: 'AFFILIATE_CREDIT' },
        })
        if (!existingAffiliate) {
          await walletRepository.incrementBalance(wallet.id, order.affiliateCut)
          await walletRepository.createTransaction(wallet.id, {
            amount: order.affiliateCut,
            type: 'AFFILIATE_CREDIT',
            description: `Affiliate commission — Order #${orderId}`,
            orderId,
          })
          notificationQueue.enqueue({
            userId: order.affiliateUserId,
            type: 'ORDER',
            message: `You earned ₦${(order.affiliateCut / 100).toLocaleString('en-NG')} affiliate commission from Order #${orderId}`,
            orderId,
          })
        }
      } else {
        // Non-seller affiliate — credit their BuyerWallet
        const buyerWallet = await buyerWalletRepository.getOrCreate(order.affiliateUserId)
        const existingBuyerCredit = await buyerWalletRepository.findExistingCredit(
          buyerWallet.id,
          orderId,
          'AFFILIATE_CREDIT',
        )
        if (!existingBuyerCredit) {
          await buyerWalletRepository.incrementBalance(buyerWallet.id, order.affiliateCut)
          await buyerWalletRepository.createTransaction(buyerWallet.id, {
            amount: order.affiliateCut,
            type: 'AFFILIATE_CREDIT',
            description: `Affiliate commission — Order #${orderId}`,
            orderId,
          })
          notificationQueue.enqueue({
            userId: order.affiliateUserId,
            type: 'ORDER',
            message: `You earned ₦${(order.affiliateCut / 100).toLocaleString('en-NG')} affiliate commission from Order #${orderId}`,
            orderId,
          })
        }
      }
    }
  },

  /**
   * Called when a PAID order is cancelled before delivery.
   * Reverses CREDIT_PENDING entries so the seller's pending balance is correct.
   * Does NOT issue a Paystack refund — that must be handled separately or manually.
   */
  async reverseOrderCredit(orderId: number) {
    const pendingCredits = await prisma.transaction.findMany({
      where: { orderId, type: 'CREDIT_PENDING' },
    })
    if (!pendingCredits.length) return

    await prisma.$transaction(async (tx) => {
      for (const credit of pendingCredits) {
        await tx.sellerWallet.update({
          where: { id: credit.walletId },
          data: { pending_balance: { decrement: credit.amount } },
        })
        await tx.transaction.update({
          where: { id: credit.id },
          data: {
            type: 'CREDIT_CANCELLED',
            description: `Order #${orderId} cancelled — pending credit reversed`,
          },
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

  async addFunds(
    sellerId: string,
    amount: number,
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
    await walletRepository.incrementBalance(wallet.id, amount)
    await walletRepository.createTransaction(wallet.id, {
      amount,
      type: 'CREDIT',
      description: 'Funds added to wallet',
    })

    auditQueue.enqueue({
      userId: sellerId,
      action: 'WALLET_FUNDED',
      resource: 'SellerWallet',
      resourceId: wallet.id,
      reason: 'Added funds',
      changes: { amount },
      ipAddress,
      userAgent,
    })

    return walletRepository.getWalletBySellerId(sellerId)
  },

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
