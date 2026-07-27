// POST /api/growth/assets
// Get-or-create the Growth Asset for a product and return its tracked CARD link
// (what the QR encodes). Body: { productId }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { resolveOAuthAppUrl } from '~~/server/utils/auth/oauth'
import { growthAssetService } from '~~/layers/growth/server/services/growthAsset.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) throw new UserError('SELLER_REQUIRED', 'A seller profile is required', 403)

    const body = await readBody(event)
    const productId = Number(body?.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new UserError('BAD_REQUEST', 'A valid productId is required', 400)
    }

    const config = useRuntimeConfig()
    const baseUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)

    const asset = await growthAssetService.fromProduct({
      productId,
      sellerId: seller.id,
      baseUrl,
    })
    return { success: true, data: asset }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/assets]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to create growth asset' })
  }
})
