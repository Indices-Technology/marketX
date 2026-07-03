import { defineEventHandler, getQuery } from 'h3'
import { remember } from '~~/server/utils/cache'

const isTransientDbConnectionError = (error: unknown) => {
  // Walk the full error chain — pg-pool wraps the real cause one level deep
  const messages: string[] = []
  let e: unknown = error
  while (e instanceof Error) {
    messages.push(e.message)
    e = (e as any).cause
  }
  return /connection (terminated|timeout)|timeout|ECONNRESET|ETIMEDOUT/i.test(
    messages.join(' '),
  )
}
/**
 * GET /api/feed/deals
 * Today's flash deals — isDeal=true with dealEndsAt within the next 48 hours
 * (live, not expired, not evergreen, not long-running). The home Deals rail is
 * hidden entirely when this returns nothing.
 */
export default defineEventHandler(async (event) => {
  const { limit = 20, offset = 0 } = getQuery(event) as Record<string, unknown>
  const take = Math.min(Number(limit) || 20, 50)
  const skip = Number(offset) || 0
  const now = new Date()
  // "Today" deals only: flash deals ending within the next 48h. Anything ending
  // later — or evergreen / no end date — is not an urgent deal and is excluded.
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const cacheKey = `feed:deals:offset:${skip}:limit:${take}`

  try {
    const result = await remember(cacheKey, 120, async () => {
      const productsPlusOne = await prisma.products.findMany({
        where: {
          status: 'PUBLISHED',
          isDeal: true,
          // Live AND ending within 48h — excludes expired, evergreen (no end date),
          // and long-running "deals" so the rail only shows genuine today/flash deals.
          dealEndsAt: { gte: now, lte: horizon },
        },
        orderBy: [
          { dealEndsAt: 'asc' }, // soonest-ending (most urgent) first
          { created_at: 'desc' },
        ],
        take: take + 1,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          discount: true,
          averageRating: true,
          totalReviews: true,
          isDeal: true,
          dealEndsAt: true,
          created_at: true,
          store_slug: true,
          sellerId: true,
          seller: {
            select: {
              store_name: true,
              store_slug: true,
              store_logo: true,
              locationLabel: true,
              is_verified: true,
            },
          },
          square: { select: { name: true, slug: true } },
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
    if (isTransientDbConnectionError(error)) {
      console.warn(
        '[GET /api/feed/deals] transient database connection failure:',
        error instanceof Error ? error.message : error,
      )

      return {
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: take,
          offset: skip,
          hasMore: false,
        },
      }
    }

    throw error
  }
})
