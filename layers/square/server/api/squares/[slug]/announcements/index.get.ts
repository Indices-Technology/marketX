// GET /api/squares/:slug/announcements
// Public — pinned first, then newest
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug)
    throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0

  const square = await prisma.square.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })
  if (!square || square.status !== 'ACTIVE')
    throw createError({ statusCode: 404, statusMessage: 'Square not found' })

  const [announcements, total] = await Promise.all([
    prisma.squareAnnouncement.findMany({
      where: { squareId: square.id },
      orderBy: [{ isPinned: 'desc' }, { created_at: 'desc' }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        body: true,
        isPinned: true,
        created_at: true,
        author: { select: { id: true, username: true, avatar: true } },
      },
    }),
    prisma.squareAnnouncement.count({ where: { squareId: square.id } }),
  ])

  return { success: true, data: { announcements, total, limit, offset } }
})
