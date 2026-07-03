// POST /api/ai/search
//
// SEMANTIC search — the single read-path that uses the vector index.
// Embeds the natural-language `query`, then returns the nearest entities
// (products, sellers, squares) by cosine similarity. Results carry the
// enriched metadata stored at embed time, so Dassah can render cards or
// summarise without a second fetch.
//
// ┌─ EMBEDDINGS (this endpoint) ──────────────────────────────────────────┐
// │  meaning-based recall — "modest wear" → abaya/kaftan, "gym shoes"      │
// │  → trainers. Use for open-ended discovery across all entity types.    │
// └───────────────────────────────────────────────────────────────────────┘
// ┌─ RAW QUERY (/api/commerce/products?search=, /api/search) ─────────────┐
// │  exact keyword / attribute / price filters over columns (ILIKE).      │
// │  Use for precise title lookups and structured filtering.              │
// └───────────────────────────────────────────────────────────────────────┘
//
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { embedText } from '../../utils/openai-embedding'
import { aiDataService } from '../../services/ai-data.service'

const VALID_TYPES = new Set(['PRODUCT', 'SELLER', 'SQUARE'])

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const body = await readBody(event)
  const { query, entityType, limit, threshold } = body ?? {}

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'query (non-empty string) is required',
    })
  }
  if (entityType && !VALID_TYPES.has(String(entityType).toUpperCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityType must be PRODUCT | SELLER | SQUARE',
    })
  }

  const vector = await embedText(query.trim())

  const results = await aiDataService.searchEmbeddings({
    vector,
    entityType: entityType ? String(entityType).toUpperCase() : undefined,
    limit: typeof limit === 'number' ? Math.min(Math.max(limit, 1), 50) : 10,
    threshold: typeof threshold === 'number' ? threshold : 0.5,
  })

  return { success: true, data: results }
})
