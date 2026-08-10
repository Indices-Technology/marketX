// GET /api/growth/connect/facebook/pages
// Lists the Facebook Pages awaiting a pick after callback.get.ts stashed them
// (only reached when the seller administers more than one Page). Returns
// display info only — never the Page access tokens.

import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { decryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import type { FacebookPageConnection } from '~~/layers/growth/server/utils/facebook.oauth'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const seller = await getAuthSellerProfile(event)
    if (!seller) {
      throw new UserError(
        'SELLER_REQUIRED',
        'A seller profile is required',
        403,
      )
    }

    const pending = getCookie(event, 'growth_fb_pending')
    if (!pending) {
      throw new UserError(
        'NO_PENDING_SELECTION',
        'No pending Facebook Pages to choose from',
        404,
      )
    }

    const { sellerId, pages } = JSON.parse(decryptApiKey(pending)) as {
      sellerId: string
      pages: FacebookPageConnection[]
    }
    if (sellerId !== seller.id) {
      throw new UserError(
        'FORBIDDEN',
        'This selection belongs to a different seller',
        403,
      )
    }

    return {
      success: true,
      data: pages.map((p) => ({
        pageId: p.pageId,
        displayName: p.displayName ?? null,
        category: p.category ?? null,
      })),
    }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/connect/facebook/pages]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load Facebook Pages',
    })
  }
})
