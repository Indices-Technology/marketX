// GET /api/squares/following — IDs of squares the current user follows.
// Per-user and NOT cached — used to seed follow state on the browse list
// (/api/squares), whose payload is shared-cached and user-agnostic.
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareService } from '../../services/square.service'

export default defineEventHandler(async (event) => {
  const user = await optionalAuth(event)
  if (!user) return { success: true, data: [] as string[] }

  const ids = await squareService.getFollowedSquareIds(user.id)
  return { success: true, data: ids }
})
