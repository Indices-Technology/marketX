// GET /api/growth/assets/:id/post/tiktok/status?publishId=...
// Polls TikTok for a Direct Post's processing status. TikTok's Content Sharing
// Guidelines require the UX to surface post status after publishing rather than
// leaving the seller guessing whether it went through.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import {
  getUserActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { getPostStatus } from '~~/layers/growth/server/utils/tiktok.posting'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing asset id', 400)

    const query = getQuery(event)
    const publishId = typeof query.publishId === 'string' ? query.publishId : ''
    if (!publishId) throw new UserError('BAD_REQUEST', 'Missing publishId', 400)

    const asset = await prisma.growthAsset.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    })
    const owns =
      asset &&
      (await prisma.sellerProfile.findFirst({
        where: { id: asset.sellerId, profileId: user.id },
        select: { id: true },
      }))
    if (!asset || !owns) {
      throw new UserError('ASSET_NOT_FOUND', 'Growth asset not found', 404)
    }

    const conn = await getUserActiveConnection(user.id, 'TIKTOK')
    const accessToken = decryptAccessToken(conn)

    const status = await getPostStatus(accessToken, publishId)
    return { success: true, data: status }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/assets/:id/post/tiktok/status]', error, {
      requestId: event.context?.requestId,
    })
    const message = error instanceof Error && error.message ? error.message : 'Could not check TikTok post status'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})
