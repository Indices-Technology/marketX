// server/api/social/suggestions.get.ts

import { socialService } from '~~/layers/profile/server/services/social.service'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = await requireAuth(event)

    const query = getQuery(event)
    const limit = Number(query.limit) || 10

    // Get suggested users
    const suggestions = await socialService.getSuggestedUsers(user.id, limit)

    return {
      success: true,
      data: suggestions,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/profile/suggestions]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch suggestions' })
  }
})
