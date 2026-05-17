// GET /api/seller/featured - Public list of sellers by follower count (paginated)

import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(Math.max(Number(query.limit) || 6, 1), 50)
    const offset = Math.max(Number(query.offset) || 0, 0)
    const search = String(query.search || '').trim()
    const categorySlug = String(query.categorySlug || '').trim()
    const page = Math.floor(offset / limit)

    const where: Prisma.SellerProfileWhereInput = {
      is_active: true,
      ...(search
        ? {
            OR: [
              { store_name: { contains: search, mode: 'insensitive' } },
              { store_slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      // Filter to sellers who have at least one published product in this category
      ...(categorySlug
        ? {
            products: {
              some: {
                status: 'PUBLISHED',
                category: { some: { category: { slug: categorySlug } } },
              },
            },
          }
        : {}),
    }

    // Don't cache search or category-filtered results
    const cacheKey = (search || categorySlug) ? null : `feed:sellers:featured:page:${page}:limit:${limit}`

    const fetchFresh = async () => {
      // +1 trick: eliminates the COUNT query
      const rows = await prisma.sellerProfile.findMany({
        where,
        select: {
          id: true,
          store_name: true,
          store_slug: true,
          store_logo: true,
          store_banner: true,
          store_description: true,
          is_verified: true,
          followers_count: true, // denormalized — no need for a follow.groupBy()
          _count: { select: { products: true } },
        },
        orderBy: { followers_count: 'desc' },
        take: limit + 1,
        skip: offset,
      })

      const hasMore = rows.length > limit
      const sellers = hasMore ? rows.slice(0, limit) : rows

      return {
        success: true,
        data: sellers,
        meta: { limit, offset, hasMore },
      }
    }

    if (!cacheKey) return fetchFresh()

    const result = await remember(cacheKey, 300, fetchFresh) // 5 min
    setHeader(
      event,
      'Cache-Control',
      'public, max-age=120, stale-while-revalidate=300',
    )
    return result
  } catch (error: unknown) {
    logger.logError('[GET /api/seller/featured]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch featured sellers' })
  }
})
