// POST /api/support/tickets/:id/close — requester closes their ticket
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { supportService } from '~~/layers/support/server/services/support.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id') || ''
    const ticket = await supportService.closeByRequester(id, user.id)
    return { success: true, data: ticket }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/tickets:close]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
