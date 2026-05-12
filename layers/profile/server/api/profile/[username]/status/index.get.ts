// server/api/profile/[username]/status.get.ts

import { socialService } from '~~/layers/profile/server/services/social.service'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

export default defineEventHandler(async (event) => {
  try {
    const username = getRouterParam(event, 'username')
    const query = getQuery(event)
    const followingType = (query.type as 'USER' | 'SELLER') || 'USER'

    if (!username) {
      throw createError({
        statusCode: 400,
        message: 'Username is required',
      })
    }

    // Get authenticated user
    const currentUser = await requireAuth(event)

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    // Check follow status
    const status = await socialService.getFollowStatus(
      currentUser.id,
      username,
      followingType,
    )

    return {
      success: true,
      data: status,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/profile/:username/status]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to check follow status' })
  }
})
