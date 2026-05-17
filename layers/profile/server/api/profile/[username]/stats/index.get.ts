import { profileRepository } from '~~/layers/profile/server/repositories/profile.repository'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { profileService } from '~~/layers/profile/server/services/profile.service'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const username = getRouterParam(event, 'username')
    if (!username) throw new UserError('INVALID_REQUEST', 'Username is required', 400)

    const user = await profileRepository.findByUsername(username)
    if (!user) throw new UserError('USER_NOT_FOUND', `User @${username} not found`, 404)

    const stats = await remember(`profile:stats:${user.id}`, 60, () =>
      profileService.getProfileStats(user.id),
    )

    return { success: true, data: stats }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/profile/:username/stats]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user stats' })
  }
})
