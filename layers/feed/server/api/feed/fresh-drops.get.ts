import { defineEventHandler, getQuery } from 'h3'
import { remember } from '~~/server/utils/cache'

/**
 * GET /api/feed/fresh-drops
 * Products created in the last 7 days, PUBLISHED, ordered newest first.
 */
export default defineEventHandler(async (event) => {
  const { limit = 20, offset = 0 } = getQuery(event) as Record<string, unknown>
  const take = Math.min(Number(limit) || 20, 50)
  const skip = Number(offset) || 0

  const cacheKey = `feed:fresh-drops:offset:${skip}:limit:${take}`

  try {
    const result = await remember(cacheKey, 120, async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const productSelect = {
        id: true,
        title: true,
        slug: true,
        price: true,
        discount: true,
        averageRating: true,
        totalReviews: true,
        isDeal: true,
        dealEndsAt: true,
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
            city: true,
            is_verified: true,
          },
        },
        media: {
          where: { isBgMusic: false },
          select: { id: true, url: true, type: true },
          take: 1,
          orderBy: { created_at: 'asc' as const },
        },
        _count: { select: { likes: true } },
      }

      const fresh = await prisma.products.findMany({
        where: { status: 'PUBLISHED', created_at: { gte: sevenDaysAgo } },
        orderBy: { created_at: 'desc' },
        take: take + 1,
        skip,
        select: productSelect,
      })

      // If we have enough fresh drops, return them directly
      if (fresh.length > take || skip > 0) {
        const products = fresh.slice(0, take)
        return {
          data: products,
          meta: {
            total: skip + products.length + (fresh.length > take ? 1 : 0),
            limit: take,
            offset: skip,
            hasMore: fresh.length > take,
          },
        }
      }

      // Fallback: pad with latest published products older than 7 days
      const needed = take - fresh.length
      const older = needed > 0
        ? await prisma.products.findMany({
            where: {
              status: 'PUBLISHED',
              created_at: { lt: sevenDaysAgo },
              id: { notIn: fresh.map((p) => p.id) },
            },
            orderBy: { created_at: 'desc' },
            take: needed,
            select: productSelect,
          })
        : []

      const products = [...fresh, ...older]
      return {
        data: products,
        meta: {
          total: products.length,
          limit: take,
          offset: skip,
          hasMore: false,
        },
      }
    })

    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch fresh drops' })
  }
})
