// GET /api/squares/:slug/requests — list buyer requests in a square
import { ZodError } from 'zod'
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'

export default defineEventHandler(async (event) => {
  try {
    await optionalAuth(event)
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 20, 50)
    const offset = Number(query.offset) || 0
    const status = (query.status as string | undefined) || 'OPEN'

    const data = await squareRequestService.listRequests(slug, { limit, offset }, status)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
    logger.logError('[GET /api/squares/:slug/requests]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
