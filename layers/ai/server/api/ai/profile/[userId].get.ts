// GET /api/ai/profile/:userId
// Returns the user's persistent AI profile (measurements, preferences, signals).
// Internal-only — requires X-Dassah-Internal header.
import { requireDassahInternal } from '~~/server/layers/shared/middleware/requireDassahInternal'
import { aiDataService } from '../../../services/ai-data.service'

export default defineEventHandler(async (event) => {
  requireDassahInternal(event)

  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }

  const profile = await aiDataService.getProfile(userId)

  // Return empty profile shape when no record exists yet — not a 404
  return { success: true, data: profile ?? null }
})
