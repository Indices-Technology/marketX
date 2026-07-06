// GET /api/admin/broadcast — audience sizes for the compose form (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const data = await adminService.broadcastAudience()
    return { success: true, data }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/broadcast]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to load audience' })
  }
})
