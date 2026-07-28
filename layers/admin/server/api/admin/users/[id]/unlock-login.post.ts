// POST /api/admin/users/:id/unlock-login — clear a user's login rate-limit
// lockout (support_agent or admin). Does not touch bans/suspensions — those
// have their own unsuspend endpoint.
import { requireSupportAgent } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireSupportAgent(event)
    const userId = getRouterParam(event, 'id')!

    const { email } = await adminService.clearLoginLockout(userId)
    return { success: true, message: `Login lockout cleared for ${email}` }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/users/:id/unlock-login]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to clear login lockout' })
  }
})
