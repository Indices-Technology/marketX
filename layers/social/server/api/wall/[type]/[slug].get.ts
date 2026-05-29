// GET /api/wall/:type/:slug
// Returns the unified wall timeline for a user or store profile.
// type: USER | STORE   slug: username | store_slug
// filter: all | posts | shoutouts   limit/offset pagination

import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'

const authorSelect = {
  id: true,
  username: true,
  avatar: true,
  role: true,
  sellerProfile: {
    select: { store_logo: true },
  },
} as const

const postShape = {
  id: true,
  caption: true,
  content: true,
  contentType: true,
  mentions: true,
  created_at: true,
  visibility: true,
  allowComments: true,
  viewCount: true,
  wallTargetType: true,
  wallTargetSlug: true,
  author: { select: authorSelect },
  media: {
    where: { isBgMusic: false },
    select: { id: true, url: true, type: true, altText: true },
  },
  _count: { select: { likes: true, comments: true } },
} as const

export default defineEventHandler(async (event) => {
  try {
    const type  = getRouterParam(event, 'type')?.toUpperCase()  // USER | STORE
    const slug  = getRouterParam(event, 'slug')
    const query = getQuery(event)
    const filter = (query.filter as string) || 'all'       // all | posts | shoutouts
    const limit  = Math.min(Number(query.limit)  || 20, 50)
    const offset = Math.max(Number(query.offset) || 0,  0)

    if (!slug || (type !== 'USER' && type !== 'STORE')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid wall type or slug' })
    }

    const viewer = await optionalAuth(event)

    // ── Resolve owner's profileId ──────────────────────────────────────────────
    let ownerProfileId: string | null = null

    if (type === 'USER') {
      const profile = await prisma.profile.findFirst({
        where: { username: slug },
        select: { id: true },
      })
      ownerProfileId = profile?.id ?? null
    } else {
      const seller = await prisma.sellerProfile.findFirst({
        where: { store_slug: slug },
        select: { profileId: true },
      })
      ownerProfileId = seller?.profileId ?? null
    }

    if (!ownerProfileId) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
    }

    // ── Build where clauses ────────────────────────────────────────────────────
    const ownerPostsWhere = {
      authorId: ownerProfileId,
      wallTargetType: null as null,
      isProductPost: false,
      visibility: 'PUBLIC' as const,
      moderationStatus: 'ACTIVE' as const,
    }

    const shoutoutsWhere = {
      wallTargetType: type,
      wallTargetSlug: slug,
      moderationStatus: 'ACTIVE' as const,
    }

    let items: any[] = []
    let total = 0

    if (filter === 'posts') {
      ;[items, total] = await prisma.$transaction([
        prisma.post.findMany({
          where: ownerPostsWhere,
          select: postShape,
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.post.count({ where: ownerPostsWhere }),
      ])
    } else if (filter === 'shoutouts') {
      ;[items, total] = await prisma.$transaction([
        prisma.post.findMany({
          where: shoutoutsWhere,
          select: postShape,
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.post.count({ where: shoutoutsWhere }),
      ])
    } else {
      // all — merge owner posts + shoutouts, sorted by date
      const combined = { OR: [ownerPostsWhere, shoutoutsWhere] } as const
      ;[items, total] = await prisma.$transaction([
        prisma.post.findMany({
          where: combined,
          select: postShape,
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.post.count({ where: combined }),
      ])
    }

    // Tag each item so the frontend can render the right card
    const enriched = items.map((p) => ({
      ...p,
      type: p.wallTargetType ? 'SHOUTOUT' : 'POST',
      viewerLiked: false,
      author: {
        id: p.author.id,
        username: p.author.username,
        avatar: p.author.avatar || p.author.sellerProfile?.[0]?.store_logo || null,
        role: p.author.role,
      },
    }))

    // Batch-check viewer likes if logged in
    if (viewer && enriched.length) {
      const postIds = enriched.map((p) => p.id)
      const liked = await prisma.postLike.findMany({
        where: { postId: { in: postIds }, profileId: viewer.id },
        select: { postId: true },
      })
      const likedSet = new Set(liked.map((l) => l.postId))
      enriched.forEach((p) => { p.viewerLiked = likedSet.has(p.id) })
    }

    return {
      data: enriched,
      meta: { total, hasMore: offset + limit < total, limit, offset },
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/wall]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
