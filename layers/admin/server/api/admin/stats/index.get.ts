// GET /api/admin/stats — dashboard summary counts (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const stats = await remember('admin:stats', 60, adminService.getDashboardStats)
    return { success: true, data: stats }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/stats]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stats' })
  }
})
