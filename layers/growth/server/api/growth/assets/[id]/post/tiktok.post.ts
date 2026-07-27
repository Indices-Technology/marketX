// POST /api/growth/assets/:id/post/tiktok
// Direct-post a Growth Asset's card to the seller's connected TikTok. The card is
// pulled from our verified /growth/cards/:id URL; a TIKTOK distribution is minted
// so the caption link is attributable. Body: { privacyLevel?, caption? }.
// Unaudited apps ⇒ privacy is forced SELF_ONLY by TikTok regardless.

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import {
  getActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { mintDistribution } from '~~/layers/growth/server/services/shortlink.service'
import { initPhotoPost } from '~~/layers/growth/server/utils/tiktok.posting'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) throw new UserError('SELLER_REQUIRED', 'A seller profile is required', 403)

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing asset id', 400)

    const body = await readBody(event).catch(() => ({}))

    const asset = await prisma.growthAsset.findFirst({
      where: { id, sellerId: seller.id },
      select: { id: true, content: true },
    })
    if (!asset) throw new UserError('ASSET_NOT_FOUND', 'Growth asset not found', 404)
    const cardImageUrl = ((asset.content ?? {}) as { cardImageUrl?: string }).cardImageUrl
    if (!cardImageUrl) {
      throw new UserError('NO_CARD', 'Generate the card image before posting', 400)
    }

    const conn = await getActiveConnection(seller.id, 'TIKTOK')
    const accessToken = decryptAccessToken(conn)

    const config = useRuntimeConfig()
    const base = resolveOAuthAppUrl(event, config.public.baseURL as string)
    // TikTok pulls the photo from OUR verified domain (redirects are disallowed).
    const photoUrl = `${base.replace(/\/$/, '')}/growth/cards/${asset.id}`

    // Mint the channel distribution so the caption link is attributable to TikTok.
    const minted = await mintDistribution({ assetId: asset.id, channel: 'TIKTOK', baseUrl: base })
    // Always append the attributable tracked link so the caption is measurable.
    const userCaption = typeof body?.caption === 'string' ? body.caption.trim() : ''
    const caption = userCaption
      ? `${userCaption}\n\n${minted.trackedUrl}`
      : minted.trackedUrl

    // Sandbox / unaudited apps are limited to SELF_ONLY; honour an explicit choice.
    const privacyLevel =
      typeof body?.privacyLevel === 'string' ? body.privacyLevel : 'SELF_ONLY'

    const { publishId } = await initPhotoPost({
      accessToken,
      photoUrl,
      description: caption,
      privacyLevel,
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
    throw createError({ statusCode: 502, statusMessage: 'TikTok post failed' })
  }
})
