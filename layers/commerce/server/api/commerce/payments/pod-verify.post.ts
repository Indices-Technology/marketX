// POST /api/commerce/payments/pod-verify
// Called by the client after Paystack redirects back from the shipping fee payment.
// Sets paymentStatus → SHIPPING_PAID, status → CONFIRMED, then notifies sellers.

import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { orderRepository } from '../../../repositories/order.repository'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

const schema = z.object({ reference: z.string().min(1) })

/** Notify each unique seller that shipping is secured and order is ready to ship */
async function notifySellersPODConfirmed(orderId: number, buyerName: string) {
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
      orderId,
      message: `✅ POD order #${orderId} from ${buyerName} — shipping fee confirmed. Please pack and ship. Collect payment on delivery.`,
    })
  }
}

/** Notify buyer that their POD order is confirmed */
async function notifyBuyerPODConfirmed(order: { id: number; userId: string }) {
  notificationQueue.enqueue({
    userId: order.userId,
    type: 'ORDER',
    actorId: order.userId,
    orderId: order.id,
    message: `🛍️ Your Pay-on-Delivery order #${order.id} is confirmed! The seller will ship soon. You'll pay the product amount when it arrives.`,
  })
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { reference } = schema.parse(await readBody(event))

    // 1. Find all per-seller orders sharing this reference
    const orders = await orderRepository.getOrdersByPaymentRef(reference)
    if (!orders.length) throw new UserError('NOT_FOUND', 'Order not found for this reference', 404)
    if (orders.some((o) => o.userId !== user.id)) throw new UserError('FORBIDDEN', 'Access denied', 403)
    if (orders.some((o) => o.paymentMethod !== 'pay_on_delivery'))
      throw new UserError('INVALID_METHOD', 'Not a POD order', 400)

    const orderIds = orders.map((o) => o.id)

    // 2. Idempotent
    if (orders.every((o) => o.paymentStatus === 'SHIPPING_PAID')) {
      return { success: true, data: { status: 'already_confirmed', orderIds } }
    }

    // 3. Verify shipping payment with Paystack (one transaction for the purchase)
    const result = await paystack.verifyTransaction(reference)

    if (result.data.status !== 'success') {
      await Promise.all(orders.map((o) => orderRepository.updatePaymentStatus(o.id, 'FAILED')))
      return { success: true, data: { status: result.data.status, orderIds } }
    }

    // 4 & 5. Per order: atomic flip, then notify (once per order, vs webhook race)
    const buyerName = user.username || user.email || 'a customer'
    for (const order of orders) {
      const { count } = await prisma.orders.updateMany({
        where: { id: order.id, paymentStatus: { notIn: ['SHIPPING_PAID', 'PAID', 'FAILED'] } },
        data: { paymentStatus: 'SHIPPING_PAID', status: 'CONFIRMED' },
      })
      if (count > 0) {
        notifySellersPODConfirmed(order.id, buyerName).catch((e) =>
          logger.error('POD verify: notify sellers failed', { orderId: order.id, error: e?.message ?? e }),
        )
        notifyBuyerPODConfirmed(order).catch((e) =>
          logger.error('POD verify: notify buyer failed', { orderId: order.id, error: e?.message ?? e }),
        )
      }
    }
    // One buyer confirmation email for the purchase
    if (user.email && !user.email.includes('@checkout.marketx.app')) {
      const { subject, html, text } = buildOrderStatusEmail(orderIds[0]!, 'CONFIRMED')
      emailQueue.enqueue({ to: user.email, subject, html, text, type: 'ORDER_CONFIRMATION' })
    }

    return { success: true, data: { status: 'shipping_paid', orderIds } }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/payments/pod-verify]', error, { requestId: event.context?.requestId })
    const msg = error instanceof Error ? (error as Error).message : 'POD verification failed'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
