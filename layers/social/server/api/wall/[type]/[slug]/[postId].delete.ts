// DELETE /api/wall/:type/:slug/:postId
// Delete a wall post (shoutout). Allowed by: post author OR wall owner.

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    const type   = getRouterParam(event, 'type')?.toUpperCase()
    const slug   = getRouterParam(event, 'slug')
    const postId = getRouterParam(event, 'postId')

    if (!slug || !postId || (type !== 'USER' && type !== 'STORE')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid parameters' })
    }

    const user = await requireAuth(event)

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, wallTargetType: true, wallTargetSlug: true },
    })

    if (!post || post.wallTargetType !== type || post.wallTargetSlug !== slug) {
      throw createError({ statusCode: 404, statusMessage: 'Shoutout not found' })
    }

    // Check permission: author or wall owner
    let isWallOwner = false
    if (type === 'USER') {
      const profile = await prisma.profile.findFirst({
        where: { username: slug },
        select: { id: true },
      })
      isWallOwner = profile?.id === user.id
    } else {
      const seller = await prisma.sellerProfile.findFirst({
        where: { store_slug: slug, profileId: user.id },
        select: { id: true },
      })
      isWallOwner = !!seller
    }

    if (post.authorId !== user.id && !isWallOwner) {
      throw createError({ statusCode: 403, statusMessage: 'Not authorised to delete this post' })
    }

    await prisma.post.delete({ where: { id: postId } })

    return { success: true }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[DELETE /api/wall]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
