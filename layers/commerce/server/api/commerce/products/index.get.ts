// GET /api/commerce/products
import { productService } from '~~/layers/commerce/server/services/product.service'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
export default defineEventHandler(async (event) => {
  try {
    const currentUser = await optionalAuth(event)
    const query = getQuery(event)
    const minDiscount = query.minDiscount ? Number(query.minDiscount) : undefined
    const minPrice    = query.minPrice    ? Number(query.minPrice)    : undefined
    const maxPrice    = query.maxPrice    ? Number(query.maxPrice)    : undefined
    const sortBy      = query.sortBy as 'newest' | 'price_asc' | 'price_desc' | 'popular' | undefined

    // Public listing only exposes PUBLISHED products. A seller may request
    // DRAFT/ARCHIVED, but the query is force-scoped to their own store.
    const requestedStatus = (query.status as string) || 'PUBLISHED'
    let status = 'PUBLISHED'
    let sellerId = query.sellerId as string | undefined
    if (requestedStatus !== 'PUBLISHED') {
      const ownSellerId = currentUser?.sellerProfile?.id
      if (ownSellerId) {
        status = requestedStatus
        sellerId = ownSellerId
      }
    }

    const result = await productService.getProducts(
      {
        status,
        search: query.search as string,
        sellerId,
        isThrift: query.isThrift,
        categorySlug: query.categorySlug as string,
        minDiscount,
        minPrice,
        maxPrice,
        sortBy,
      },
      { limit: query.limit, offset: query.offset },
    )
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[GET /api/commerce/products]', error, { requestId: event.context?.requestId })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
