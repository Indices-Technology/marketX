// POST /api/ai/embeddings/upsert
// Called by Dassah's indexer to store a vector embedding for an entity.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

const VALID_TYPES = new Set(['PRODUCT', 'SELLER', 'SQUARE'])

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const body = await readBody(event)

  const { entityType, entityId, metadata, contentHash, vector } = body ?? {}

  if (!entityType || !VALID_TYPES.has(String(entityType).toUpperCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityType must be PRODUCT | SELLER | SQUARE',
    })
  }
  if (!entityId || typeof entityId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityId is required',
    })
  }
  if (!contentHash || typeof contentHash !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'contentHash is required',
    })
  }
  if (!Array.isArray(vector) || vector.length !== 1536) {
    throw createError({
      statusCode: 400,
      statusMessage: 'vector must be a number[1536]',
    })
  }
  if (!metadata || typeof metadata !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'metadata is required',
    })
  }

  await aiDataService.upsertEmbedding({
    entityType: String(entityType).toUpperCase(),
    entityId,
    metadata,
    contentHash,
    vector,
  })

  return { success: true }
})
