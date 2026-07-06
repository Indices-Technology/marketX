// GET /api/admin/categories — categories with product counts (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const items = await adminService.listCategories()
    return { success: true, items }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/categories]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch categories' })
  }
})
