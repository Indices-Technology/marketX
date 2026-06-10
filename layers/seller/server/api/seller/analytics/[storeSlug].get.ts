import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { analyticsService } from '~~/layers/commerce/server/services/analytics.service'

// GET /api/seller/analytics/[storeSlug]?days=30
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const storeSlug = getRouterParam(event, 'storeSlug')
    if (!storeSlug)
      throw createError({
        statusCode: 400,
        statusMessage: 'storeSlug required',
      })

    // Verify the requesting user owns this store
    const seller = await prisma.sellerProfile.findUnique({
      where: { store_slug: storeSlug },
      select: { profileId: true },
    })
    if (!seller)
      throw createError({ statusCode: 404, statusMessage: 'Store not found' })
    if (seller.profileId !== user.id)
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const query = getQuery(event)
    const days = Math.min(Math.max(Number(query.days) || 30, 7), 90)

    const data = await analyticsService.getStoreAnalytics(storeSlug, days)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/seller/analytics/[storeSlug]]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
