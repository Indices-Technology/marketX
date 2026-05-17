// POST /api/admin/users/:id/unsuspend — lift a suspension or ban (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const userId = getRouterParam(event, 'id')!

    await adminService.liftSuspension(userId, admin.id)
    return { success: true, message: 'Suspension lifted' }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/users/:id/unsuspend]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to lift suspension' })
  }
})
