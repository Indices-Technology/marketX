// GET /api/seller/:slug/reviews?limit=10&offset=0
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 50)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const seller = await prisma.sellerProfile.findUnique({
    where: { store_slug: slug },
    select: { id: true, averageRating: true, totalReviews: true },
  })
  if (!seller) throw createError({ statusCode: 404, statusMessage: 'Seller not found' })

  const [reviews, grouped] = await Promise.all([
    prisma.sellerReview.findMany({
      where: { sellerId: seller.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        verified: true,
        created_at: true,
        author: { select: { username: true, avatar: true } },
      },
    }),
    prisma.sellerReview.groupBy({
      by: ['rating'],
      where: { sellerId: seller.id },
      _count: { rating: true },
    }),
  ])

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const g of grouped) distribution[g.rating] = g._count.rating

  return {
    success: true,
    data: reviews,
    meta: {
      total: seller.totalReviews,
      averageRating: seller.averageRating,
      distribution,
      limit,
      offset,
      hasMore: offset + limit < seller.totalReviews,
    },
  }
})
