// GET /api/commerce/orders/seller-pending-count?storeSlug=xxx
// Lightweight count of orders awaiting the seller's action (paid, not yet shipped)
// — drives the badge on the store nav "Orders" link. Ownership-checked.
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const storeSlug = getQuery(event).storeSlug as string
    if (!storeSlug) throw new UserError('INVALID', 'storeSlug is required', 400)

    const seller = await prisma.sellerProfile.findUnique({
      where: { store_slug: storeSlug },
      select: { id: true, profileId: true },
    })
    if (!seller) throw new UserError('NOT_FOUND', 'Store not found', 404)
    if (seller.profileId !== user.id)
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    // "Needs action" = the order is paid/confirmed but the seller hasn't shipped
    // it yet. SHIPPED/DELIVERED are already handled; PENDING/CANCELLED aren't real.
    const count = await prisma.orders.count({
      where: {
        status: { in: ['CONFIRMED', 'PAID'] },
        orderItem: { some: { variant: { product: { sellerId: seller.id } } } },
      },
    })

    return { success: true, data: { count } }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/commerce/orders/seller-pending-count]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
