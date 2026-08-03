// POST /api/growth/assets/share
// Get-or-create the CALLER's own tracked link for a product they don't own —
// an enrolled affiliate's AFFILIATE link, or any signed-in viewer's ORGANIC_SHARE
// link. Unlike /api/growth/assets (seller-only), this has no ownership check —
// the caller just needs to be signed in. Body: { productId, channel }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { growthAssetService } from '~~/layers/growth/server/services/growthAsset.service'

const ALLOWED_CHANNELS = ['ORGANIC_SHARE', 'AFFILIATE'] as const

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event)
    const productId = Number(body?.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new UserError('BAD_REQUEST', 'A valid productId is required', 400)
    }
    const channel = body?.channel
    if (!ALLOWED_CHANNELS.includes(channel)) {
      throw new UserError('BAD_REQUEST', 'A valid channel is required', 400)
    }

    const config = useRuntimeConfig()
    const baseUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)

    const asset = await growthAssetService.forSharer({
      productId,
      sharerProfileId: user.id,
      channel,
      baseUrl,
    })
    return { success: true, data: asset }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets/share]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to create share link' })
  }
})
