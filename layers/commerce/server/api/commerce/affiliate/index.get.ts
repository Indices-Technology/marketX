// GET /api/commerce/affiliate — affiliate status and earnings stats
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { affiliateService } from '../../../services/affiliate.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const data = await affiliateService.getStats(user.id)
    return { success: true, data }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
