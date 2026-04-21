// GET /api/feed/reels — Product videos only.
// Post videos remain in the main feed; reels surface shoppable product content.
import { normalizeProduct } from '../../utils/feed.utils'

const MEDIA_SELECT = {
  id: true,
  url: true,
  type: true,
  isBgMusic: true,
  altText: true,
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const where = {
    status: 'PUBLISHED' as const,
    media: { some: { type: 'VIDEO' as const, isBgMusic: false } },
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            store_name: true,
            store_slug: true,
            store_logo: true,
          },
        },
        media: { select: MEDIA_SELECT },
        _count: { select: { likes: true, comments: true } },
        variants: {
          select: { id: true, size: true, stock: true, price: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.products.count({ where }),
  ])

  return {
    success: true,
    data: products.map(normalizeProduct),
    meta: { total, limit, offset, hasMore: offset + limit < total },
  }
})
