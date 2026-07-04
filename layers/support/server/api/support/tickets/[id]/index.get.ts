// GET /api/support/tickets/:id — a single ticket thread (authorized viewer)
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { supportService } from '~~/layers/support/server/services/support.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id') || ''
    const ticket = await supportService.getTicketForViewer(id, {
      id: user.id,
      role: user.role,
    })
    return { success: true, data: ticket }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/tickets:get]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
