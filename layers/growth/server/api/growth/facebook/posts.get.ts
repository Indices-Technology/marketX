// GET /api/growth/facebook/posts
// Lists the seller's connected Facebook Page's recent photo posts, for the
// bulk-import picker (turn a past post into staged product rows). Text-only
// posts are already filtered out by getPagePosts — nothing to seed a row with.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import {
  getUserActiveConnection,
  decryptAccessToken,
} from '~~/layers/growth/server/services/socialConnection.service'
import { getPagePosts } from '~~/layers/growth/server/utils/facebook.import'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const conn = await getUserActiveConnection(user.id, 'META_FB')
    const pageAccessToken = decryptAccessToken(conn)
    const posts = await getPagePosts(conn.providerUserId, pageAccessToken)

    return { success: true, data: posts }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/growth/facebook/posts]', error, {
      requestId: event.context?.requestId,
    })
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to load Facebook posts'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})
