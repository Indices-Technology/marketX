// DELETE /api/squares/:slug/officers/:profileId — Chairman removes an officer
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareService } from '../../../../services/square.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const slug = getRouterParam(event, 'slug')
  const profileId = getRouterParam(event, 'profileId')
  if (!slug || !profileId)
    throw createError({ statusCode: 400, statusMessage: 'slug and profileId required' })

  const result = await squareService.removeOfficer(user.id, slug, profileId)
  return { success: true, data: result }
})
