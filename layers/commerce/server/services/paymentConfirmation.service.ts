/**
 * Shared order-confirmation side effects.
 *
 * The single source of truth for "a verified payment arrived — confirm this order
 * exactly once." Used by the card verify endpoint, the Paystack webhook, and the
 * expiry-cron reconciliation path so their logic can never drift apart.
 *
 * The confirmation flip is an atomic conditional write: only the first caller
 * whose `updateMany` changes a row runs the (idempotent) money side effects, so
 * verify racing the webhook — or the cron racing both — can't double-credit.
 */
import { notificationQueue } from '~~/server/queues/notification.queue'
import { walletService } from './wallet.service'
import { analyticsService } from './analytics.service'
import { squareService } from '~~/layers/square/server/services/square.service'

/** Notify every unique seller whose products are in this order (deduped). */
async function notifySellers(orderId: number, message: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: { include: { seller: { select: { profileId: true } } } },
        },
      },
    },
  })

  const seen = new Set<string>()
  for (const item of items) {
    const sellerId = item.variant?.product?.seller?.profileId
    if (!sellerId || seen.has(sellerId)) continue
    seen.add(sellerId)
    notificationQueue.enqueue(
      { userId: sellerId, type: 'ORDER', actorId: sellerId, message },
      { dedupeKey: `order-paid:${orderId}:seller:${sellerId}` },
    )
  }
}

/**
 * Re-decrement stock for an order that was resurrected after the expiry cron had
 * already restored it. Money was collected, so the order MUST be fulfilled; we
 * allow stock to go negative here because a negative count is an honest, visible
 * oversell signal for a human to reconcile — far better than silently keeping the
 * buyer's money with no fulfilment.
 */
async function reDecrementStock(orderId: number) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true },
  })
  await Promise.all(
    items
      .filter((i) => i.variantId != null)
      .map((i) =>
        prisma.productVariant.update({
          where: { id: i.variantId! },
          data: { stock: { decrement: i.quantity } },
        }),
      ),
  )
}

export const paymentConfirmationService = {
  /**
   * Confirm a card order as PAID and fire the money side effects exactly once.
   * Returns true only for the caller that actually flipped the order.
   *
   * Callers MUST have already passed the provider money-gate (verify /
   * signature-verified webhook / cron re-verify) before calling this. Because the
   * payment is known-good, the flip is guarded only by `paymentStatus != 'PAID'`,
   * which deliberately allows resurrecting an order the expiry cron marked FAILED —
   * a collected payment must never be left unfulfilled.
   */
  async confirmPaidCardOrder(
    orderId: number,
    opts: { sellerMessage?: string } = {},
  ): Promise<boolean> {
    const before = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true, status: true, userId: true },
    })

    // Advance status forward only. Normally PENDING → CONFIRMED on payment, but an
    // order can be marked SHIPPED/DELIVERED BEFORE its payment webhook lands (fast
    // local delivery + a delayed/late webhook). In that case we must NOT downgrade
    // it back to CONFIRMED — keep the further-along status, and release funds below.
    const alreadyFulfilled = before
      ? ['SHIPPED', 'DELIVERED'].includes(before.status)
      : false
    const { count } = await prisma.orders.updateMany({
      where: { id: orderId, paymentStatus: { not: 'PAID' } },
      data: alreadyFulfilled
        ? { paymentStatus: 'PAID' }
        : { paymentStatus: 'PAID', status: 'CONFIRMED' },
    })
    if (count === 0) return false

    // Notify the buyer their order is confirmed (in-app, clickable to the order).
    if (before?.userId) {
      notificationQueue.enqueue(
        {
          userId: before.userId,
          type: 'ORDER',
          orderId,
          message: `Your order #${orderId} is confirmed — the seller is preparing it.`,
        },
        { dedupeKey: `order-confirmed-buyer:${orderId}` },
      )
    }

    // If the expiry cron had already failed/cancelled this order, it restored the
    // stock — put it back now that we know the buyer really paid.
    const wasReclaimed =
      before?.paymentStatus === 'FAILED' || before?.status === 'CANCELLED'
    if (wasReclaimed) {
      logger.logError(
        '[payment] verified payment confirmed an order the expiry cron had cancelled — re-decrementing stock',
        new Error(
          `order #${orderId} was ${before?.status}/${before?.paymentStatus} before confirmation`,
        ),
        { orderId },
      )
      await reDecrementStock(orderId).catch((e) =>
        logger.error('confirmPaidCardOrder: stock re-decrement failed', {
          orderId,
          error: e?.message ?? e,
        }),
      )
    }

    const msg = opts.sellerMessage ?? `New order #${orderId} payment confirmed`
    notifySellers(orderId, msg).catch((e) =>
      logger.error('confirm: notify sellers failed', {
        orderId,
        error: e?.message ?? e,
      }),
    )
    // Credit the seller's pending balance. If the order was ALREADY delivered when
    // payment landed (delivered-before-paid), the delivery transition that normally
    // triggers the release has already passed — so release immediately once the
    // pending credit exists, otherwise the funds sit pending forever.
    const credit = walletService.creditSellersOnPayment(orderId)
    if (before?.status === 'DELIVERED') {
      credit
        .then(() => walletService.releaseFundsOnDelivery(orderId))
        .catch((e) =>
          logger.error('confirm: delivered-before-paid release failed', {
            orderId,
            error: e?.message ?? e,
          }),
        )
    } else {
      credit.catch((e) =>
        logger.error('confirm: wallet credit failed', {
          orderId,
          error: e?.message ?? e,
        }),
      )
    }
    squareService.creditAssociationsForOrder(orderId).catch((e) =>
      logger.error('confirm: association credit failed', {
        orderId,
        error: e?.message ?? e,
      }),
    )
    analyticsService.trackOrderSale(orderId).catch((e) =>
      logger.error('confirm: sale tracking failed', {
        orderId,
        error: e?.message ?? e,
      }),
    )
    return true
  },

  /**
   * Confirm a Pay-on-Delivery order's SHIPPING fee as paid (product amount is
   * collected later at cash-confirmation). Atomic + idempotent. Used by the expiry
   * cron when it finds a POD order whose shipping was actually paid late.
   */
  async confirmPodShippingOrder(
    orderId: number,
    opts: { sellerMessage?: string } = {},
  ): Promise<boolean> {
    const buyer = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true },
    })

    const { count } = await prisma.orders.updateMany({
      where: {
        id: orderId,
        paymentStatus: { notIn: ['SHIPPING_PAID', 'PAID', 'FAILED'] },
      },
      data: { paymentStatus: 'SHIPPING_PAID', status: 'CONFIRMED' },
    })
    if (count === 0) return false

    if (buyer?.userId) {
      notificationQueue.enqueue(
        {
          userId: buyer.userId,
          type: 'ORDER',
          orderId,
          message: `Your order #${orderId} is confirmed — pay the balance on delivery.`,
        },
        { dedupeKey: `order-confirmed-buyer:${orderId}` },
      )
    }

    const msg =
      opts.sellerMessage ?? `POD order #${orderId} — shipping fee confirmed`
    notifySellers(orderId, msg).catch((e) =>
      logger.error('confirm pod: notify sellers failed', {
        orderId,
        error: e?.message ?? e,
      }),
    )
    analyticsService.trackOrderSale(orderId).catch((e) =>
      logger.error('confirm pod: sale tracking failed', {
        orderId,
        error: e?.message ?? e,
      }),
    )
    return true
  },
}
