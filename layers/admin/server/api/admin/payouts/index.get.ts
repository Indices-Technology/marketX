// GET /api/admin/payouts — seller withdrawal queue (admin only — real money)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 100)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const statusRaw = String(q.status || '').trim().toUpperCase()
    const status = ['PENDING', 'PAID', 'REJECTED'].includes(statusRaw)
      ? statusRaw
      : undefined

    const result = await adminService.listPayouts({ status, limit, offset })
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/payouts]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch payouts' })
  }
})
