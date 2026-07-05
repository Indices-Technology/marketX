// GET /api/feed/reels — Product videos only.
// Post videos remain in the main feed; reels surface shoppable product content.
import { normalizeProduct } from '../../utils/feed.utils'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Math.max(Number(query.offset) || 0, 0)
  const cacheKey = `feed:reels:offset:${offset}:limit:${limit}`

  try {
    const result = await remember(cacheKey, 120, async () => {
      const where = {
        status: 'PUBLISHED' as const,
        media: { some: { type: 'VIDEO' as const, isBgMusic: false } },
      }

      const productsPlusOne = await prisma.products.findMany({
        where,
        select: {
          id: true,
          title: true,
          price: true,
          discount: true,
          slug: true,
          isThrift: true,
          isDeal: true,
          dealEndsAt: true,
          created_at: true,
          sellerId: true,
          viewCount: true,
          affiliateCommission: true,
          seller: {
            select: {
              id: true,
              store_name: true,
              store_slug: true,
              store_logo: true,
              watermark_enabled: true,
              watermark_text: true,
            },
          },
          media: {
            where: { isBgMusic: false },
            select: { id: true, url: true, type: true, isBgMusic: true, altText: true },
          },
          variants: {
            select: { id: true, size: true, stock: true, price: true },
            take: 3,
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { created_at: 'desc' },
        take: limit + 1,
        skip: offset,
      })

      const products = productsPlusOne.slice(0, limit)
      return {
        data: products.map(normalizeProduct),
        meta: {
          total: offset + products.length + (productsPlusOne.length > limit ? 1 : 0),
          limit,
          offset,
          hasMore: productsPlusOne.length > limit,
        },
      }
    })

    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reels' })
  }
})
