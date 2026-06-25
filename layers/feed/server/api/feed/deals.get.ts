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
 * Active flash deals — products with isDeal=true and dealEndsAt in the future
 * (or dealEndsAt null = evergreen deal).
 */
export default defineEventHandler(async (event) => {
  const { limit = 20, offset = 0 } = getQuery(event) as Record<string, unknown>
  const take = Math.min(Number(limit) || 20, 50)
  const skip = Number(offset) || 0
  const now = new Date()

  const cacheKey = `feed:deals:offset:${skip}:limit:${take}`

  try {
    const result = await remember(cacheKey, 120, async () => {
      const productsPlusOne = await prisma.products.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            // Explicit flash deals — live or evergreen (dealEndsAt null/future)
            { isDeal: true, OR: [{ dealEndsAt: null }, { dealEndsAt: { gte: now } }] },
            // Any discounted product — this is what users perceive as "on deal" and what
            // the Discover grid surfaces; without it, marked-down items that weren't
            // toggled as flash deals showed on Discover but vanished from the home Deals rail.
            { discount: { gt: 0 } },
          ],
        },
        orderBy: [
          { dealEndsAt: { sort: 'asc', nulls: 'last' } },
          { discount: 'desc' },
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
