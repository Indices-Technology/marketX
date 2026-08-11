// POST /api/growth/assets/:id/post/facebook
// Publish a Growth Asset's card directly to the seller's connected Facebook
// Page. Simpler than the TikTok posting vertical: no privacy picker (Page
// posts are public by definition), no domain-verification step, and the
// Graph API publishes synchronously (no polling needed). A META_FB
// distribution is minted so the caption link is attributable.
// Body: { caption? }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import {
  resolveFacebookPostContext,
  buildFacebookCaption,
} from '~~/layers/growth/server/services/facebookPost.service'
import { postPhotoToPage } from '~~/layers/growth/server/utils/facebook.posting'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing asset id', 400)

    const body = await readBody(event).catch(() => ({}))

    const config = useRuntimeConfig()
    const base = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const { pageId, pageAccessToken, photoUrl, minted } =
      await resolveFacebookPostContext(id, user.id, base)
    const caption = buildFacebookCaption(body?.caption, minted.trackedUrl)

    const { postId } = await postPhotoToPage({
      pageId,
      pageAccessToken,
      photoUrl,
      caption,
    })

    await prisma.assetDistribution.update({
      where: { id: minted.distributionId },
      data: { remotePostId: postId, sharedAt: new Date() },
    })

    return {
      success: true,
      data: { postId, trackedUrl: minted.trackedUrl },
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets/:id/post/facebook]', error, {
      requestId: event.context?.requestId,
    })
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Facebook post failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})
