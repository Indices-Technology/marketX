// GET /api/ai/context/seller/:id
// Returns full seller context for RAG embedding.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiContextService } from '../../../../services/ai-context.service'

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid seller id' })
  }

  const data = await aiContextService.getSeller(id)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Seller not found' })
  }

  return { success: true, data }
})
