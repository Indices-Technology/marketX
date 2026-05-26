// POST /api/wall/:type/:slug
// Post a shoutout on a user or store wall.

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { z } from 'zod'

const shoutoutSchema = z.object({
  body: z.string().min(1).max(1000).trim(),
})

export default defineEventHandler(async (event) => {
  try {
    const type = getRouterParam(event, 'type')?.toUpperCase()
    const slug = getRouterParam(event, 'slug')

    if (!slug || (type !== 'USER' && type !== 'STORE')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid wall type or slug' })
    }

    const user = await requireAuth(event)
    const raw = await readBody(event)
    const parsed = shoutoutSchema.safeParse(raw)
    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
    }

    // Resolve wall owner — needed to notify them
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

    // Don't allow posting on your own wall (you can just make a regular post)
    if (type === 'USER' && ownerProfileId === user.id) {
      throw createError({ statusCode: 400, statusMessage: 'Post to your feed instead of your own wall' })
    }

    const shoutout = await prisma.post.create({
      data: {
        authorId: user.id,
        caption: parsed.data.body,
        content: parsed.data.body,
        contentType: 'TEXT',
        visibility: 'PUBLIC',
        allowComments: true,
        wallTargetType: type,
        wallTargetSlug: slug,
      },
      select: {
        id: true,
        caption: true,
        created_at: true,
        wallTargetType: true,
        wallTargetSlug: true,
        author: { select: { id: true, username: true, avatar: true, role: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    // Notify the wall owner
    if (ownerProfileId !== user.id) {
      notificationQueue.enqueue({
        userId: ownerProfileId,
        type: 'WALL_SHOUTOUT',
        actorId: user.id,
        message: `left a shoutout on your wall`,
        postId: shoutout.id,
      })
    }

    return { data: { ...shoutout, type: 'SHOUTOUT', viewerLiked: false } }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/wall]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
