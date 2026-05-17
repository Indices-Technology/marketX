// GET /api/stories - Get active stories

import { UserError } from '~~/layers/profile/server/types/user.types'
import { storyService } from '~~/layers/social/server/services/story.service'
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const user = await optionalAuth(event)
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 20, 50)

    // Cache per-user stories for 60s (anonymous stories for 120s)
    const cacheKey = user?.id
      ? `feed:stories:user:${user.id}:limit:${limit}`
      : `feed:stories:public:limit:${limit}`

    const stories = await remember(cacheKey, user?.id ? 60 : 120, () =>
      storyService.getStories(user?.id, limit),
    )

    setHeader(event, 'Cache-Control', 'private, max-age=30')
    return { success: true, data: stories }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/stories]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
