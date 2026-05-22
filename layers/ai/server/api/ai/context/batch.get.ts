// GET /api/ai/context/batch
//
// Paginated batch endpoint for Dassah's indexing worker.
// Returns full context items ready for embedding — no secondary calls needed.
//
// Query params:
//   type         PRODUCT | SELLER | SQUARE  (required)
//   limit        1–100, default 50
//   offset       default 0
//   updatedSince ISO 8601 timestamp — when set, only returns entities
//                updated after this time (used for incremental re-indexing)
//
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiContextService } from '../../../services/ai-context.service'
import type { EntityType } from '../../../types/ai-context.types'

const VALID_ENTITY_TYPES = new Set<string>(['PRODUCT', 'SELLER', 'SQUARE'])

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const query = getQuery(event)

  // ── Validate entity type ──────────────────────────────────────────────────
  const type = String(query.type ?? '').toUpperCase()
  if (!VALID_ENTITY_TYPES.has(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `type must be one of: ${[...VALID_ENTITY_TYPES].join(', ')}`,
    })
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const limit = Math.min(Math.max(parseInt(String(query.limit ?? '50'), 10) || 50, 1), 100)
  const offset = Math.max(parseInt(String(query.offset ?? '0'), 10) || 0, 0)

  // ── Optional incremental filter ───────────────────────────────────────────
  let updatedSince: Date | undefined
  if (query.updatedSince) {
    const parsed = new Date(String(query.updatedSince))
    if (isNaN(parsed.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'updatedSince must be a valid ISO 8601 timestamp',
      })
    }
    updatedSince = parsed
  }

  const data = await aiContextService.getBatch(
    type as EntityType,
    limit,
    offset,
    updatedSince,
  )

  return { success: true, data }
})
