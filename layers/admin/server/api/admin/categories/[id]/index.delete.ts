// DELETE /api/admin/categories/:id — delete a category (moderator+)
// Products keep — they just lose this tag (ProductCategories cascade).
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

    const result = await adminService.deleteCategory(id)
    return { success: true, data: result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[DELETE /api/admin/categories/:id]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete category' })
  }
})
