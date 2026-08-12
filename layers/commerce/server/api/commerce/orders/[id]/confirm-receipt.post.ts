// POST /api/commerce/orders/[id]/confirm-receipt
// Called by the buyer to confirm they received their order.
// Moves status to DELIVERED and releases seller funds immediately.
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { notificationService } from '~~/layers/profile/server/services/notification.service'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { emitOrderCompleted } from '~~/layers/reputation/server/utils/emitOrderSignal'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(id)) throw new UserError('INVALID_ID', 'Invalid order ID', 400)

    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    seller: { select: { profileId: true, store_name: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) throw new UserError('NOT_FOUND', 'Order not found', 404)
    if (order.userId !== user.id)
      throw new UserError(
        'FORBIDDEN',
        'Only the buyer can confirm receipt',
        403,
      )
    if (order.status === 'DELIVERED')
      return { success: true, data: { message: 'Already delivered' } }
    // Allow SHIPPED, READY_FOR_PICKUP (the pickup-order equivalent — the buyer
    // collects in person, so they are the only party who can confirm it
    // happened), or CONFIRMED (seller may have skipped the SHIPPED step).
    if (!['SHIPPED', 'READY_FOR_PICKUP', 'CONFIRMED'].includes(order.status))
      throw new UserError(
        'INVALID_STATE',
        `Cannot confirm receipt for an order with status: ${order.status}`,
        400,
      )

    // Stamp deliveredAt too: it was previously written only by carrier scans,
    // so a buyer-confirmed order — and every pickup order, which has no carrier
    // at all — sat at status DELIVERED with a null deliveredAt. Reputation reads
    // that field for the "delivered as described" count, and the signal it emits
    // below is idempotent, so leaving it null would permanently record the sale
    // as undelivered. Buyer confirmation is the strongest delivery evidence we
    // have; it belongs in the same field.
    await prisma.orders.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    })

    // Release funds non-blocking — wallet errors must not fail the receipt confirmation
    if (order.paymentStatus === 'PAID') {
      walletService
        .releaseFundsOnDelivery(id)
        .catch((e) => logger.logError('[confirm-receipt wallet release]', e))
    }

    // Reputation ledger — buyer-confirmed delivery is a completed sale.
    emitOrderCompleted(id)

    // Notify each unique seller (non-blocking)
    const seen = new Set<string>()
    for (const item of order.orderItem) {
      const sellerId = item.variant?.product?.seller?.profileId
      if (!sellerId || seen.has(sellerId)) continue
      seen.add(sellerId)
      notificationService
        .createNotification({
          userId: sellerId,
          type: 'ORDER',
          actorId: user.id,
          message: order.isPickup
            ? `Buyer confirmed they collected order #${id}. Funds have been released to your wallet.`
            : `Buyer confirmed receipt of order #${id}. Funds have been released to your wallet.`,
        })
        .catch((e) => logger.logError('[notify seller receipt]', e))
    }

    return {
      success: true,
      data: { message: 'Receipt confirmed. Funds released to seller.' },
    }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/commerce/orders/:id/confirm-receipt]', error, { requestId: event.context?.requestId })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
