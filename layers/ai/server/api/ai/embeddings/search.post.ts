// POST /api/ai/embeddings/search
// Called by Dassah at query time — returns the nearest entities by cosine similarity.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

const VALID_TYPES = new Set(['PRODUCT', 'SELLER', 'SQUARE'])

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const body = await readBody(event)
  const { vector, entityType, limit, threshold } = body ?? {}

  if (!Array.isArray(vector) || vector.length !== 1536) {
    throw createError({
      statusCode: 400,
      statusMessage: 'vector must be a number[1536]',
    })
  }
  if (entityType && !VALID_TYPES.has(String(entityType).toUpperCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityType must be PRODUCT | SELLER | SQUARE',
    })
  }

  const results = await aiDataService.searchEmbeddings({
    vector,
    entityType: entityType ? String(entityType).toUpperCase() : undefined,
    limit: typeof limit === 'number' ? Math.min(Math.max(limit, 1), 50) : 10,
    threshold: typeof threshold === 'number' ? threshold : 0.5,
  })

  return { success: true, data: results }
})
