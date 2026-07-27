// GET /api/growth/assets — list the authenticated seller's growth assets.

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { growthAssetService } from '~~/layers/growth/server/services/growthAsset.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) throw new UserError('SELLER_REQUIRED', 'A seller profile is required', 403)

    const data = await growthAssetService.listForSeller(seller.id)
    return { success: true, data }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/assets]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to load growth assets' })
  }
})
