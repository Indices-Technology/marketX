// PUT /api/ai/profile/:userId
// Upserts the user's persistent AI profile. Partial updates are fine — only
// fields present in the body are overwritten; missing fields keep their current value.
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }

  const body = await readBody(event)
  const { measurements, preferences, signals, rawContext } = body ?? {}

  const updated = await aiDataService.upsertProfile(userId, {
    measurements: measurements ?? undefined,
    preferences:  preferences  ?? undefined,
    signals:      signals       ?? undefined,
    rawContext:   rawContext    ?? undefined,
  })

  return { success: true, data: updated }
})
