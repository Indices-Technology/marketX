// GET /api/ai/context/product/:id
// Returns full product context for RAG embedding.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiContextService } from '../../../../services/ai-context.service'

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const raw = getRouterParam(event, 'id')
  const id = parseInt(raw ?? '', 10)
  if (!raw || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product id' })
  }

  const data = await aiContextService.getProduct(id)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return { success: true, data }
})
