// GET /api/admin/finance — revenue overview (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const days = Math.min(Math.max(Number(q.days) || 30, 1), 365)

    // Aggregates over all paid orders — cache briefly so a dashboard refresh
    // doesn't re-scan every time.
    const data = await remember(`admin:finance:${days}`, 60, () =>
      adminService.getFinanceOverview(days),
    )
    return { success: true, data }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/finance]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch finance overview' })
  }
})
