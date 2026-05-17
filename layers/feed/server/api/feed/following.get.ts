import { normalizePost } from '~~/layers/feed/server/utils/feed.utils'
import type { IFeedResponse } from '~~/layers/feed/app/types/feed.types'
import { remember } from '~~/server/utils/cache'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event): Promise<IFeedResponse> => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const limit = Number(query.limit) || 20
  const offset = Number(query.offset) || 0
  const page = Math.floor(offset / limit)

  // Per-user cache key — busted only when this user creates content
  const cacheKey = `feed:following:user:${user.id}:page:${page}`

  try {
    return await remember(cacheKey, 120, async () => {
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      })

      if (follows.length === 0) {
        return { items: [], meta: { total: 0, limit, offset, hasMore: false } }
      }

      const followingIds = follows.map((f) => f.followingId)

      // +1 trick: eliminates the COUNT query
      const postsPlusOne = await prisma.post.findMany({
        where: { authorId: { in: followingIds }, moderationStatus: 'ACTIVE' },
        take: limit + 1,
        skip: offset,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          authorId: true,
          caption: true,
          content: true,
          contentType: true,
          created_at: true,
          visibility: true,
          isProductPost: true,
          viewCount: true,
          author: { select: { id: true, username: true, avatar: true, role: true } },
          media: {
            where: { isBgMusic: false },
            select: { id: true, url: true, type: true, isBgMusic: true, altText: true,
              musicTitle: true, musicArtist: true },
            take: 4,
            orderBy: { created_at: 'asc' },
          },
          _count: { select: { likes: true, comments: true, shares: true } },
          taggedProducts: {
            select: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  discount: true,
                  slug: true,
                  media: {
                    take: 1,
                    where: { isBgMusic: false },
                    select: { url: true, type: true },
                  },
                },
              },
            },
          },
        },
      })

      const hasMore = postsPlusOne.length > limit
      const posts = hasMore ? postsPlusOne.slice(0, limit) : postsPlusOne

      return {
        items: posts.map(normalizePost),
        meta: { limit, offset, hasMore },
      }
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/feed/following]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch following feed' })
  }
})
