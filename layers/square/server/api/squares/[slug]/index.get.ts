// GET /api/squares/:slug — Square profile with officers and featured sellers
import { squareService } from '../../../services/square.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  // event.context.user is set by requireAuth; event.context.auth by the global middleware
  const userId = event.context.user?.id ?? event.context.auth?.user?.userId
  const data = await squareService.getSquareBySlug(slug, userId)
  return { success: true, data }
})
