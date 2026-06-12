// POST /api/squares/:slug/requests/:id/offers — seller responds with a product
import { ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const requestId = getRouterParam(event, 'id')
    if (!requestId) throw createError({ statusCode: 400, statusMessage: 'Request id required' })

    const body = await readBody(event)
    const data = await squareRequestService.createOffer(user.id, requestId, body)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: error.errors[0]?.message ?? 'Invalid offer' })
    logger.logError('[POST /api/squares/:slug/requests/:id/offers]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
