// DELETE /api/squares/:slug — platform admin deletes an (empty) Square
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareService } from '../../../services/square.service'
import { bust } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'admin')
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  const result = await squareService.deleteSquare(slug)
  // Deleting a PENDING square changes the dashboard's pending count.
  bust('admin:stats').catch(() => {})
  return { success: true, data: result }
})
