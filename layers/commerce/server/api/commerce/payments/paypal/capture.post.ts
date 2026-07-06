// POST /api/commerce/payments/paypal/capture
// Called after buyer approves the PayPal payment.
// Captures funds and marks the internal order as PAID.
import { z, ZodError } from 'zod'
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { orderRepository } from '~~/layers/commerce/server/repositories/order.repository'
import { cartRepository } from '~~/layers/commerce/server/repositories/cart.repository'
import { analyticsService } from '~~/layers/commerce/server/services/analytics.service'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

const schema = z.object({
  // The PayPal order id is the shared payment reference across the purchase group.
  paypalOrderId: z.string().min(1),
  orderId: z.number().int().positive().optional(), // legacy, ignored
})

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
      message: `New order #${orderId} paid via PayPal`,
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { paypalOrderId } = schema.parse(await readBody(event))

    // 1. Load all per-seller orders sharing this PayPal reference + verify ownership
    const orders = await orderRepository.getOrdersByPaymentRef(paypalOrderId)
    if (!orders.length) throw new UserError('NOT_FOUND', 'Order not found', 404)
    if (orders.some((o) => o.userId !== user.id))
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    const orderIds = orders.map((o) => o.id)

    // 2. Idempotent — already paid
    if (orders.every((o) => o.paymentStatus === 'PAID')) {
      return { success: true, data: { status: 'already_paid', orderIds } }
    }

    // 3. Capture PayPal payment (one capture for the whole purchase)
    const result = await paypal.captureOrder(paypalOrderId)

    if (result.status === 'COMPLETED') {
      for (const order of orders) {
        // Atomic update — guards against duplicate captures or a racing webhook
        const { count } = await prisma.orders.updateMany({
          where: { id: order.id, paymentStatus: { notIn: ['PAID', 'FAILED'] } },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        })
        if (count > 0) {
          notifySellers(order.id).catch((e) =>
            logger.error('PayPal: notify sellers failed', { orderId: order.id, error: e?.message ?? e }),
          )
          walletService.creditSellersOnPayment(order.id).catch((e) =>
            logger.error('PayPal: wallet credit failed', { orderId: order.id, error: e?.message ?? e }),
          )
          analyticsService.trackOrderSale(order.id).catch((e) =>
            logger.error('PayPal: sale tracking failed', { orderId: order.id, error: e?.message ?? e }),
          )
        }
      }
      // Payment captured → empty the buyer's cart (idempotent).
      await cartRepository.clearCart(user.id).catch(() => {})

      // One buyer confirmation email for the purchase
      if (user.email && !user.email.includes('@checkout.marketx.')) {
        const { subject, html, text } = buildOrderStatusEmail(orderIds[0]!, 'CONFIRMED')
        emailQueue.enqueue({ to: user.email, subject, html, text, type: 'ORDER_CONFIRMATION' })
      }
      return { success: true, data: { status: 'paid', orderIds } }
    }

    // Capture failed or pending — fail every order in the group
    await Promise.all(
      orders.map((o) =>
        prisma.orders.update({ where: { id: o.id }, data: { paymentStatus: 'FAILED' } }),
      ),
    )
    return {
      success: true,
      data: { status: result.status.toLowerCase(), orderIds },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[POST /api/commerce/payments/paypal/capture]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'PayPal capture failed',
    })
  }
})
