// GET /api/squares/:slug/sellers
// Public — active member sellers, primary members first
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 24, 48)
  const offset = Number(query.offset) || 0

  const square = await prisma.square.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })
  if (!square || square.status !== 'ACTIVE')
    throw createError({ statusCode: 404, statusMessage: 'Square not found' })

  const [memberships, total] = await Promise.all([
    prisma.squareMembership.findMany({
      where: { squareId: square.id, status: 'ACTIVE' },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
      take: limit,
      skip: offset,
      select: {
        isPrimary: true,
        joinedAt: true,
        seller: {
          select: {
            id: true,
            store_name: true,
            store_slug: true,
            store_logo: true,
            store_description: true,
            is_verified: true,
            isPremium: true,
            followers_count: true,
            _count: { select: { products: true } },
          },
        },
      },
    }),
    prisma.squareMembership.count({
      where: { squareId: square.id, status: 'ACTIVE' },
    }),
  ])

  const sellers = memberships.map((m) => ({
    ...m.seller,
    isPrimary: m.isPrimary,
    joinedAt: m.joinedAt,
  }))

  return { success: true, data: { sellers, total, limit, offset } }
})
