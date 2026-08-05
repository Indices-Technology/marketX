// POST /api/growth/assets/:id/post/tiktok/draft
// Upload a Growth Asset's card to the seller's TikTok inbox as a DRAFT
// (MEDIA_UPLOAD, video.upload scope) — no audit required, nothing auto-
// publishes. The seller finishes it themselves in the TikTok app, where they
// can also add a Link Sticker (something the Content Posting API can't set).
// Body: { caption?, title? }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { resolveTikTokPostContext, buildTikTokCaption } from '~~/layers/growth/server/services/tiktokPost.service'
import { initPhotoDraft } from '~~/layers/growth/server/utils/tiktok.posting'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing asset id', 400)

    const body = await readBody(event).catch(() => ({}))

    const config = useRuntimeConfig()
    const base = resolveOAuthAppUrl(event, config.public.baseURL as string)
    const { accessToken, photoUrl, minted } = await resolveTikTokPostContext(id, user.id, base)
    const caption = buildTikTokCaption(body?.caption, minted.trackedUrl)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''

    const { publishId } = await initPhotoDraft({
      accessToken,
      photoUrl,
      title,
      description: caption,
    })

    await prisma.assetDistribution.update({
      where: { id: minted.distributionId },
      data: { remotePostId: publishId, sharedAt: new Date() },
    })

    return {
      success: true,
      data: { publishId, trackedUrl: minted.trackedUrl },
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets/:id/post/tiktok/draft]', error, {
      requestId: event.context?.requestId,
    })
    const message = error instanceof Error && error.message ? error.message : 'TikTok draft upload failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})
