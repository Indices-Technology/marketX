// GET /api/commerce/orders/buyer-active-count
// Lightweight count of the buyer's orders still in flight — drives the "orders"
// tile on the mobile home panel. Deliberately a count, not a list: the tile
// needs one number, and GET /api/commerce/orders returns whole order objects
// with their items and media.
//
// Mirrors seller-pending-count.get.ts (same shape, same auth, one query).
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

/**
 * "In flight" = the buyer has paid and is waiting on something.
 *
 * PENDING is excluded on purpose: those are abandoned/unpaid checkout attempts,
 * and telling someone they have an order arriving when no money moved is the
 * kind of wrong count that makes the whole panel untrustworthy. Terminal states
 * (DELIVERED / CANCELLED / RETURNED) are done, not pending.
 */
const IN_FLIGHT = ['CONFIRMED', 'PAID', 'SHIPPED', 'READY_FOR_PICKUP'] as const

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const count = await prisma.orders.count({
      where: { userId: user.id, status: { in: [...IN_FLIGHT] } },
    })

    return { success: true, data: { count } }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/commerce/orders/buyer-active-count]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
