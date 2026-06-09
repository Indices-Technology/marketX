// POST /api/commerce/orders/[id]/refuse-delivery
// Called by buyer or seller to flag a refused delivery.
// Order → RETURNED. Shipping fee stays with seller (non-refundable commitment).
// Product stock is restored.

import { z, ZodError } from 'zod'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { orderRepository } from '~~/layers/commerce/server/repositories/order.repository'

const schema = z.object({
  reason: z.string().max(300).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(id)) throw new UserError('INVALID_ID', 'Invalid order ID', 400)

    const body = schema.parse(await readBody(event))

    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    seller: { select: { profileId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) throw new UserError('NOT_FOUND', 'Order not found', 404)
    if (order.paymentMethod !== 'pay_on_delivery')
      throw new UserError('INVALID_METHOD', 'Only POD orders support delivery refusal', 400)

    const isBuyer = order.userId === user.id
    const isSeller = order.orderItem.some(
      (item) => item.variant?.product?.seller?.profileId === user.id,
    )
    if (!isBuyer && !isSeller)
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    if (order.status === 'RETURNED') {
      return { success: true, data: { message: 'Already marked as returned' } }
    }

    if (!['CONFIRMED', 'SHIPPED'].includes(order.status)) {
      throw new UserError(
        'INVALID_STATE',
        `Cannot refuse delivery for an order with status: ${order.status}`,
        400,
      )
    }

    // Mark returned — shipping fee stays (SHIPPING_PAID remains, product never paid)
    await prisma.orders.update({
      where: { id },
      data: { status: 'RETURNED' },
    })

    // Restore product stock
    await orderRepository.restoreStock(order.orderItem)

    // Refund the platform fee that was debited from seller wallet at order creation
    const feeDebits = await prisma.transaction.findMany({
      where: { orderId: id, type: 'PLATFORM_FEE_DEBIT' },
    })
    if (feeDebits.length) {
      await prisma.$transaction(async (tx) => {
        for (const debit of feeDebits) {
          await tx.sellerWallet.update({
            where: { id: debit.walletId },
            data: { balance: { increment: debit.amount } },
          })
          await tx.transaction.create({
            data: {
              walletId: debit.walletId,
              amount: debit.amount,
              type: 'PLATFORM_FEE_REFUND',
              description: `POD platform fee refunded — Order #${id} refused`,
              orderId: id,
            },
          })
        }
      })
    }

    const reasonNote = body.reason ? ` Reason: ${body.reason}` : ''

    // Notify the other party
    if (isBuyer) {
      // Buyer refused — notify sellers, shipping fee is their compensation
      const seen = new Set<string>()
      for (const item of order.orderItem) {
        const sellerId = item.variant?.product?.seller?.profileId
        if (!sellerId || seen.has(sellerId)) continue
        seen.add(sellerId)
        notificationQueue.enqueue({
          userId: sellerId,
          type: 'ORDER',
          actorId: user.id,
          orderId: id,
          message: `⚠️ Buyer refused delivery for order #${id}.${reasonNote} The shipping fee you received is yours to keep. Stock has been restored.`,
        })
      }
    } else {
      // Seller reported refusal — notify buyer
      notificationQueue.enqueue({
        userId: order.userId,
        type: 'ORDER',
        actorId: user.id,
        orderId: id,
        message: `⚠️ Your POD order #${id} was marked as delivery refused.${reasonNote} Note: the shipping fee you paid upfront is non-refundable.`,
      })
    }

    return {
      success: true,
      data: { message: 'Order marked as returned. Stock restored.' },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[orders/refuse-delivery]', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
