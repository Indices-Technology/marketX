// GET /api/support/tickets — the current user's tickets
import { ZodError } from 'zod'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { supportService } from '~~/layers/support/server/services/support.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 50)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const status = typeof q.status === 'string' ? q.status : undefined

    return {
      success: true,
      ...(await supportService.listMyTickets(user.id, {
        status,
        limit,
        offset,
      })),
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    logger.logError('[support/tickets:list]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
