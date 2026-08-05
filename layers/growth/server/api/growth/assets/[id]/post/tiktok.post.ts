// POST /api/growth/assets/:id/post/tiktok
// Direct-post a Growth Asset's card to the seller's connected TikTok. The card is
// pulled from our verified /growth/cards/:id URL; a TIKTOK distribution is minted
// so the caption link is attributable.
// Body: { privacyLevel, caption?, title?, allowComment?, brandOrganic?, brandContent? }.
// privacyLevel is required from the client — TikTok's Content Sharing Guidelines
// prohibit defaulting/auto-selecting it. Unaudited apps ⇒ privacy is forced
// SELF_ONLY by TikTok regardless of what's sent.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { resolveTikTokPostContext, buildTikTokCaption } from '~~/layers/growth/server/services/tiktokPost.service'
import { initPhotoPost } from '~~/layers/growth/server/utils/tiktok.posting'

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

    // No default — the seller must actively choose (Content Sharing Guidelines
    // prohibit auto-selecting privacy). Unaudited apps still get forced SELF_ONLY
    // by TikTok itself regardless of what we send.
    const privacyLevel = typeof body?.privacyLevel === 'string' ? body.privacyLevel : ''
    if (!privacyLevel) {
      throw new UserError('PRIVACY_REQUIRED', 'Choose who can see this post', 400)
    }

    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const allowComment = body?.allowComment === true
    const brandOrganic = body?.brandOrganic === true
    const brandContent = body?.brandContent === true
    const isPromotional = brandOrganic || brandContent

    if (body?.isPromotional === true && !isPromotional) {
      throw new UserError(
        'DISCLOSURE_REQUIRED',
        'Select "Your Brand" and/or "Branded Content" for promotional content',
        400,
      )
    }
    if (brandContent && privacyLevel === 'SELF_ONLY') {
      throw new UserError(
        'BRANDED_CONTENT_PRIVATE',
        "Branded content visibility can't be private — choose a public or friends option",
        400,
      )
    }

    const { publishId } = await initPhotoPost({
      accessToken,
      photoUrl,
      title,
      description: caption,
      privacyLevel,
      disableComment: !allowComment,
      brandOrganicToggle: brandOrganic,
      brandContentToggle: brandContent,
    })

    await prisma.assetDistribution.update({
      where: { id: minted.distributionId },
      data: { remotePostId: publishId, sharedAt: new Date() },
    })

    return {
      success: true,
      data: { publishId, trackedUrl: minted.trackedUrl, privacyLevel },
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets/:id/post/tiktok]', error, {
      requestId: event.context?.requestId,
    })
    const message = error instanceof Error && error.message ? error.message : 'TikTok post failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})
