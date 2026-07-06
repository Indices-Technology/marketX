// GET /api/admin/sellers/:id/documents — a seller's verification (KYC) docs (moderator+)
import { requireModerator } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireModerator(event)
    const id = getRouterParam(event, 'id')!
    const items = await adminService.getSellerDocuments(id)
    return { success: true, items }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/sellers/:id/documents]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch documents' })
  }
})
