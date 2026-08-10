// POST /api/growth/connect/facebook/select
// Finalizes the Page picker: body { pageId }. Reads the encrypted candidate
// list stashed by callback.get.ts, verifies it belongs to the requesting
// seller, connects the chosen Page (replacing any other META_FB connection
// this seller has), and clears the pending cookie.

import { z } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { decryptApiKey } from '~~/layers/core/server/services/aiConfig.service'
import type { FacebookPageConnection } from '~~/layers/growth/server/utils/facebook.oauth'
import { connectFacebookPage } from '~~/layers/growth/server/services/facebookConnection.service'

const schema = z.object({ pageId: z.string().min(1) })

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

    const { pageId } = schema.parse(await readBody(event))

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

    const page = pages.find((p) => p.pageId === pageId)
    if (!page) {
      throw new UserError(
        'PAGE_NOT_FOUND',
        'That Page was not in the candidate list',
        404,
      )
    }

    await connectFacebookPage(seller.id, page)
    deleteCookie(event, 'growth_fb_pending', { path: '/' })

    return { success: true }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/growth/connect/facebook/select]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to connect Facebook Page',
    })
  }
})
