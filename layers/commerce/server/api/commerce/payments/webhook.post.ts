// POST /api/commerce/payments/webhook
// Paystack sends this after a transaction completes (even if user closes the tab).
// Set this URL in the Paystack dashboard: https://yourdomain.com/api/commerce/payments/webhook
import crypto from 'crypto'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { walletService } from '../../../services/wallet.service'
import { squareService } from '~~/layers/square/server/services/square.service'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

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
    notificationQueue.enqueue({
      userId: sellerId,
      type: 'ORDER',
      actorId: sellerId,
      message: `New order #${orderId} payment confirmed`,
    })
  }
}

export default defineEventHandler(async (event) => {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret)
    throw createError({
      statusCode: 500,
      statusMessage: 'Server misconfigured',
    })

  // 1. Validate Paystack signature
  const signature = getHeader(event, 'x-paystack-signature')
  const rawBody = await readRawBody(event)
  if (!rawBody || !signature)
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })

  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (hash !== signature)
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  // 2. Parse event
  const payload = JSON.parse(rawBody)
  const { event: eventType, data } = payload

  if (eventType === 'charge.success') {
    const reference: string = data?.reference
    if (!reference) return { success: true }

    // One reference is shared across all per-seller orders of a purchase.
    const orders = await prisma.orders.findMany({ where: { paymentRef: reference } })
    if (!orders.length) return { success: true }

    let creditedAny = false
    for (const order of orders) {
      if (order.paymentMethod === 'pay_on_delivery') {
        // POD: shipping fee payment — atomic update guards against duplicate delivery
        const { count } = await prisma.orders.updateMany({
          where: { id: order.id, paymentStatus: { in: ['UNPAID', 'PENDING'] } },
          data: { paymentStatus: 'SHIPPING_PAID', status: 'CONFIRMED' },
        })
        if (count > 0) {
          notifySellers(order.id).catch((e) => logger.error('Webhook POD notify failed', { orderId: order.id, error: e?.message ?? e }))
        }
      } else {
        // Online payment: full amount paid — atomic update guards against duplicate delivery
        const { count } = await prisma.orders.updateMany({
          where: { id: order.id, paymentStatus: { notIn: ['PAID', 'FAILED'] } },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        })
        if (count > 0) {
          creditedAny = true
          notifySellers(order.id).catch((e) => logger.error('Webhook notify failed', { orderId: order.id, error: e?.message ?? e }))
          walletService
            .creditSellersOnPayment(order.id)
            .catch((e) => logger.error('Webhook wallet credit failed', { orderId: order.id, error: e?.message ?? e }))
          squareService
            .creditAssociationsForOrder(order.id)
            .catch((e) => logger.error('Webhook association credit failed', { orderId: order.id, error: e?.message ?? e }))
        }
      }
    }

    // One buyer confirmation email for the whole purchase — fire-and-forget
    if (creditedAny) {
      prisma.profile
        .findUnique({ where: { id: orders[0]!.userId }, select: { email: true } })
        .then((buyer) => {
          if (!buyer?.email || buyer.email.includes('@checkout.marketx.app')) return
          const { subject, html, text } = buildOrderStatusEmail(orders[0]!.id, 'CONFIRMED')
          emailQueue.enqueue({ to: buyer.email, subject, html, text, type: 'ORDER_CONFIRMATION' })
        })
        .catch(() => {})
    }
  }

  // Always return 200 to Paystack
  return { success: true }
})
