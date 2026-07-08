// POST /api/commerce/payments/webhook
// Paystack sends this after a transaction completes (even if user closes the tab).
// Set this URL in the Paystack dashboard: https://yourdomain.com/api/commerce/payments/webhook
import { paymentService } from '~~/layers/payments/server/services/payment.service'
import { podService } from '~~/layers/pod/server/services/pod.service'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { cartRepository } from '../../../repositories/cart.repository'
import { analyticsService } from '../../../services/analytics.service'
import { paymentConfirmationService } from '../../../services/paymentConfirmation.service'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

/** Notify every unique seller whose products are in this order (POD path). */
async function notifySellers(orderId: number) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: {
            include: { seller: { select: { profileId: true } } },
          },
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
      {
        userId: sellerId,
        type: 'ORDER',
        actorId: sellerId,
        message: `New order #${orderId} payment confirmed`,
      },
      { dedupeKey: `order-paid:${orderId}:seller:${sellerId}` },
    )
  }
}

export default defineEventHandler(async (event) => {
  // 1. Signature-verify + parse via the payment provider (throws on bad sig)
  const rawBody = await readRawBody(event)
  if (!rawBody)
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })

  let webhook
  try {
    webhook = await paymentService.parseWebhook(rawBody, {
      'x-paystack-signature': getHeader(event, 'x-paystack-signature'),
    })
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }
  if (!webhook) return { success: true } // event we don't handle

  const reference = webhook.reference
  const orders = await prisma.orders.findMany({
    where: { paymentRef: reference },
  })
  if (!orders.length) return { success: true }

  // 2. Money-gate: assert the signed amount covers what the group owes. POD
  // collects shipping only; card collects items + shipping. Recompute from DB.
  const isPod = orders[0]!.paymentMethod === 'pay_on_delivery'
  const expectedMinor = orders.reduce(
    (s, o) => s + (isPod ? 0 : o.totalAmount) + (o.shippingCost ?? 0),
    0,
  )
  if (!paymentService.amountCovers(expectedMinor, webhook.amountMinor)) {
    logger.logError(
      '[POST /api/commerce/payments/webhook] amount mismatch — not confirming',
      new Error(`expected ≥ ${expectedMinor} minor, got ${webhook.amountMinor}`),
      { reference },
    )
    return { success: true } // ack Paystack, but never confirm a short payment
  }
  if (webhook.amountMinor > expectedMinor) {
    logger.warn('[webhook] buyer overpaid — collected exceeds owed', {
      reference,
      expectedMinor,
      actualMinor: webhook.amountMinor,
    })
  }

  // 3. Confirm each per-seller order (atomic once-only vs the verify endpoint)
  let creditedAny = false
  const podConfirmedIds: number[] = []
  for (const order of orders) {
    if (order.paymentMethod === 'pay_on_delivery') {
      const { count } = await prisma.orders.updateMany({
        where: { id: order.id, paymentStatus: { in: ['UNPAID', 'PENDING'] } },
        data: { paymentStatus: 'SHIPPING_PAID', status: 'CONFIRMED' },
      })
      if (count > 0) {
        podConfirmedIds.push(order.id)
        notifySellers(order.id).catch((e) => logger.error('Webhook POD notify failed', { orderId: order.id, error: e?.message ?? e }))
        analyticsService.trackOrderSale(order.id).catch((e) => logger.error('Webhook POD sale tracking failed', { orderId: order.id, error: e?.message ?? e }))
      }
    } else {
      // Shared atomic confirm — runs the money side effects once, whether this
      // webhook, the verify endpoint, or the reconciliation cron gets here first.
      const confirmed = await paymentConfirmationService.confirmPaidCardOrder(
        order.id,
      )
      if (confirmed) creditedAny = true
    }
  }

  // Payment confirmed (card or POD shipping) → empty the buyer's cart. The
  // webhook can arrive before the buyer returns to verify, so clearing here too
  // is what actually guarantees the cart empties on abandoned-tab payments.
  if (creditedAny || podConfirmedIds.length) {
    await cartRepository.clearCart(orders[0]!.userId).catch(() => {})
  }

  // POD confirmed via webhook (buyer may never hit pod-verify): advance the POD
  // lifecycle + debit the platform fee. Idempotent with pod-verify.
  if (podConfirmedIds.length) {
    await prisma.podDelivery.updateMany({
      where: { orderId: { in: podConfirmedIds }, state: 'DEPOSIT_PENDING' },
      data: { state: 'DEPOSIT_PAID' },
    })
    await podService.debitSellerPodFees(podConfirmedIds)
  }

  // One buyer confirmation email for the whole purchase — fire-and-forget
  if (creditedAny) {
    prisma.profile
      .findUnique({ where: { id: orders[0]!.userId }, select: { email: true } })
      .then((buyer) => {
        if (!buyer?.email || buyer.email.includes('@checkout.marketx.')) return
        const { subject, html, text } = buildOrderStatusEmail(orders[0]!.id, 'CONFIRMED')
        emailQueue.enqueue(
          { to: buyer.email, subject, html, text, type: 'ORDER_CONFIRMATION' },
          { dedupeKey: `order-confirm:${reference}` },
        )
      })
      .catch(() => {})
  }

  // Always return 200 to Paystack
  return { success: true }
})
