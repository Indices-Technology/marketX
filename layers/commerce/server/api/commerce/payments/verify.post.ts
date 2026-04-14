// POST /api/commerce/payments/verify
// Called by the client after Paystack redirect to confirm payment.
import { z } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { walletService } from '../../../services/wallet.service'
import { orderRepository } from '../../../repositories/order.repository'

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

    // 1. Find the order by payment reference
    const order = await orderRepository.getOrderByPaymentRef(reference)
    if (!order) throw new UserError('NOT_FOUND', 'Order not found for this reference', 404)
    if (order.userId !== user.id) throw new UserError('FORBIDDEN', 'Access denied', 403)

    // 2. Already confirmed — idempotent
    if (order.paymentStatus === 'PAID') {
      return { success: true, data: { status: 'already_paid', orderId: order.id } }
    }

    // 3. Verify with Paystack
    const result = await paystack.verifyTransaction(reference)

    if (result.data.status === 'success') {
      await orderRepository.updatePaymentStatus(order.id, 'PAID', 'CONFIRMED')
      // Non-blocking — notify sellers and credit wallets in background
      notifySellers(order.id, user.username || user.email || 'a customer')
        .catch((e) => console.error('[notify sellers]', e))
      walletService.creditSellersOnPayment(order.id)
        .catch((e) => console.error('[wallet credit]', e))
      return { success: true, data: { status: 'paid', orderId: order.id } }
    }

    // Payment failed or abandoned
    await orderRepository.updatePaymentStatus(order.id, 'FAILED')
    return { success: true, data: { status: result.data.status, orderId: order.id } }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    const msg = error instanceof Error ? error.message : 'Payment verification failed'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
