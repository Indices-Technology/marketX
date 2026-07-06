// GET /api/admin/squares — all squares incl. PENDING/SUSPENDED (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 100)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const search = String(q.search || '').trim() || undefined

    const statusRaw = String(q.status || '').trim().toUpperCase()
    const status = ['PENDING', 'ACTIVE', 'SUSPENDED'].includes(statusRaw)
      ? statusRaw
      : undefined

    const typeRaw = String(q.type || '').trim().toUpperCase()
    const type = ['GEOGRAPHIC', 'CATEGORY'].includes(typeRaw) ? typeRaw : undefined

    const result = await adminService.listSquares({ status, type, search, limit, offset })
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/squares]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch squares' })
  }
})
