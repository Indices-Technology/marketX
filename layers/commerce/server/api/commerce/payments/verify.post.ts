// POST /api/commerce/payments/verify
// Called by the client after Paystack redirect to confirm payment.
import { z, ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import { walletService } from '../../../services/wallet.service'
import { orderRepository } from '../../../repositories/order.repository'
import { squareService } from '~~/layers/square/server/services/square.service'
import { buildOrderStatusEmail } from '~~/server/utils/email/emailService'

/** Notify every unique seller whose products are in this order */
async function notifySellers(orderId: number, buyerName: string) {
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
      message: `New order #${orderId} received from ${buyerName}`,
    })
  }
}

const schema = z.object({ reference: z.string().min(1) })

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { reference } = schema.parse(await readBody(event))

    // 1. Find all per-seller orders sharing this payment reference
    const orders = await orderRepository.getOrdersByPaymentRef(reference)
    if (!orders.length) throw new UserError('NOT_FOUND', 'Order not found for this reference', 404)
    if (orders.some((o) => o.userId !== user.id)) throw new UserError('FORBIDDEN', 'Access denied', 403)

    const orderIds = orders.map((o) => o.id)

    // 2. Already confirmed — idempotent early return
    if (orders.every((o) => o.paymentStatus === 'PAID')) {
      return { success: true, data: { status: 'already_paid', orderIds } }
    }

    // 3. Verify with Paystack (one transaction covers the whole purchase)
    const result = await paystack.verifyTransaction(reference)

    if (result.data.status === 'success') {
      // Per order: atomic flip — only the first caller (vs the webhook) gets
      // count > 0, so side effects run once per order (no double-crediting).
      for (const o of orders) {
        const { count } = await prisma.orders.updateMany({
          where: { id: o.id, paymentStatus: { notIn: ['PAID', 'FAILED'] } },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        })
        if (count > 0) {
          notifySellers(o.id, user.username || user.email || 'a customer')
            .catch((e) => logger.error('Verify: notify sellers failed', { orderId: o.id, error: e?.message ?? e }))
          walletService.creditSellersOnPayment(o.id)
            .catch((e) => logger.error('Verify: wallet credit failed', { orderId: o.id, error: e?.message ?? e }))
          squareService.creditAssociationsForOrder(o.id)
            .catch((e) => logger.error('Verify: association credit failed', { orderId: o.id, error: e?.message ?? e }))
        }
      }
      // One buyer confirmation email for the purchase
      if (user.email && !user.email.includes('@checkout.marketx.app')) {
        const { subject, html, text } = buildOrderStatusEmail(orderIds[0]!, 'CONFIRMED')
        emailQueue.enqueue({ to: user.email, subject, html, text, type: 'ORDER_CONFIRMATION' })
      }
      return { success: true, data: { status: 'paid', orderIds } }
    }

    // Payment failed or abandoned — fail every order in the group
    await Promise.all(orders.map((o) => orderRepository.updatePaymentStatus(o.id, 'FAILED')))
    return { success: true, data: { status: result.data.status, orderIds } }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[POST /api/commerce/payments/verify]', error, { requestId: event.context?.requestId })
    const msg = error instanceof Error ? (error as Error).message : 'Payment verification failed'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
