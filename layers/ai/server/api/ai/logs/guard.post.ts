// POST /api/ai/logs/guard
// Records a guard rail trigger (prompt injection, PII, unauthorised tool, rate limit).
// Fire-and-forget — does not block the response.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

const VALID_TYPES = new Set(['PROMPT_INJECTION', 'PII_DETECTED', 'UNAUTHORIZED_TOOL', 'RATE_LIMIT'])

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const body = await readBody(event)
  const { userId, type, inputFragment } = body ?? {}

  if (!userId || typeof userId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }
  if (!type || !VALID_TYPES.has(String(type).toUpperCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: `type must be one of: ${[...VALID_TYPES].join(', ')}`,
    })
  }

  aiDataService.logGuardEvent({
    userId,
    type:          String(type).toUpperCase(),
    inputFragment: typeof inputFragment === 'string' ? inputFragment : undefined,
  })

  return { success: true }
})
