// GET /api/commerce/affiliate — affiliate status and earnings stats
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { affiliateService } from '../../../services/affiliate.service'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const data = await remember(`affiliate:stats:${user.id}`, 60, () =>
      affiliateService.getStats(user.id),
    )
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    logger.logError('[GET /api/commerce/affiliate]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
