// POST /api/growth/assets/embed
// Get-or-create the seller's EMBED distribution for a product they own — the
// tracked link the embeddable /embed/product/[slug] iframe's CTA points at.
// Seller-only, like /api/growth/assets (CARD); unlike /api/growth/assets/share,
// this isn't for other viewers — embedding is the seller publishing their own
// product on their own site. Body: { productId }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { growthAssetService } from '~~/layers/growth/server/services/growthAsset.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event)
    const productId = Number(body?.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new UserError('BAD_REQUEST', 'A valid productId is required', 400)
    }

    const config = useRuntimeConfig()
    const baseUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)

    const asset = await growthAssetService.forEmbed({
      productId,
      userId: user.id,
      baseUrl,
    })
    return { success: true, data: asset }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets/embed]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create embed link',
    })
  }
})
