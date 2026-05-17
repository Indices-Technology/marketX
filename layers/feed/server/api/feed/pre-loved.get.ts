import { defineEventHandler, getQuery } from 'h3'
import { remember } from '~~/server/utils/cache'

/**
 * GET /api/feed/pre-loved
 * Thrift/pre-loved products, optionally filtered by condition.
 * condition: NEW_WITH_TAGS | LIKE_NEW | GOOD | FAIR | POOR
 */
export default defineEventHandler(async (event) => {
  const { limit = 20, offset = 0, condition } = getQuery(event) as Record<string, any>
  const take = Math.min(Number(limit) || 20, 50)
  const skip = Number(offset) || 0

  const conditionKey = condition ? `:cond:${condition}` : ''
  const cacheKey = `feed:pre-loved:offset:${skip}:limit:${take}${conditionKey}`

  try {
    const result = await remember(cacheKey, 120, async () => {
      const where: any = { status: 'PUBLISHED', isThrift: true }
      if (condition) where.condition = condition

      const productsPlusOne = await prisma.products.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: take + 1,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          discount: true,
          isThrift: true,
          condition: true,
          created_at: true,
          store_slug: true,
          sellerId: true,
          seller: {
            select: {
              store_name: true,
              store_slug: true,
              store_logo: true,
              locationLabel: true,
            },
          },
          media: {
            where: { isBgMusic: false },
            select: { id: true, url: true, type: true },
            take: 1,
            orderBy: { created_at: 'asc' },
          },
          _count: { select: { likes: true } },
        },
      })

      const products = productsPlusOne.slice(0, take)
      return {
        data: products,
        meta: {
          total: skip + products.length + (productsPlusOne.length > take ? 1 : 0),
          limit: take,
          offset: skip,
          hasMore: productsPlusOne.length > take,
        },
      }
    })

    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch pre-loved products' })
  }
})
