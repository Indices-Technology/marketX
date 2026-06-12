// GET /api/squares/:slug/requests/:id — a single request with its offers
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'

export default defineEventHandler(async (event) => {
  try {
    await optionalAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Request id required' })

    const data = await squareRequestService.getRequest(id)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/squares/:slug/requests/:id]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
