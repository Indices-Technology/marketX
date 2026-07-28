// GET /api/growth/tiktok/creator-info
// Fetch the connected creator's info (nickname + allowed privacy levels). TikTok
// requires this before posting, and it drives the mandatory privacy-picker UX.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import {
  getUserActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { queryCreatorInfo } from '~~/layers/growth/server/utils/tiktok.posting'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const conn = await getUserActiveConnection(user.id, 'TIKTOK')
    const info = await queryCreatorInfo(decryptAccessToken(conn))
    return { success: true, data: info }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/tiktok/creator-info]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 502, statusMessage: 'Could not reach TikTok' })
  }
})
