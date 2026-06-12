// POST /api/squares/:slug/requests — buyer (square follower) posts a request
import { ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareRequestService } from '~~/layers/square/server/services/squareRequest.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

    const body = await readBody(event)
    const data = await squareRequestService.createRequest(user.id, slug, body)
    return { success: true, data }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: error.errors[0]?.message ?? 'Invalid request' })
    logger.logError('[POST /api/squares/:slug/requests]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
