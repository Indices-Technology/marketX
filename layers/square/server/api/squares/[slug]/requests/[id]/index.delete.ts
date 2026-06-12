// DELETE /api/squares/:slug/requests/:id — buyer closes their own request
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const requestId = getRouterParam(event, 'id')
    if (!requestId) throw createError({ statusCode: 400, statusMessage: 'Request id required' })

    const data = await squareRequestService.closeRequest(user.id, requestId)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[DELETE /api/squares/:slug/requests/:id]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
