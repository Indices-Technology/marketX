// PATCH /api/squares/:slug/requests/:id/offers/:offerId — buyer accepts/declines
import { ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'
import { offerActionSchema } from '~~/layers/square/server/schemas/squareRequest.schema'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const offerId = getRouterParam(event, 'offerId')
    if (!offerId) throw createError({ statusCode: 400, statusMessage: 'Offer id required' })

    const { action } = offerActionSchema.parse(await readBody(event))
    const data = await squareRequestService.actOnOffer(user.id, offerId, action)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
    logger.logError('[PATCH /api/squares/:slug/requests/:id/offers/:offerId]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
