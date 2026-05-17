// POST /api/admin/users/:id/suspend — suspend or ban a user (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { suspendUserSchema } from '~~/layers/admin/server/schemas/admin.schemas'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  try {
    const mod = await requireModerator(event)
    const userId = getRouterParam(event, 'id')!
    if (userId === mod.id) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot suspend yourself' })
    }
    const body = await readBody(event)
    const { reason, durationDays } = suspendUserSchema.parse(body)

    await adminService.suspendUser(userId, mod.id, reason, durationDays)
    const action = durationDays ? `suspended for ${durationDays} days` : 'permanently banned'
    return { success: true, message: `User ${action}` }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: error.errors })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/admin/users/:id/suspend]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to suspend user' })
  }
})
