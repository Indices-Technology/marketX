// GET /api/admin/payouts — seller withdrawal queue (admin only — real money)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 100)
    const offset = Math.max(Number(q.offset) || 0, 0)
    // Validated against the PayoutStatus enum rather than a hand-kept list —
    // a filter value the database has no concept of returns an empty queue,
    // which reads as "nothing to pay" rather than as a bad request.
    const PAYOUT_STATUSES = [
      'PENDING',
      'APPROVED',
      'PROCESSING',
      'PAID',
      'FAILED',
      'REVERSED',
      'REJECTED',
    ] as const
    const statusRaw = String(q.status || '').trim().toUpperCase()
    const status = (PAYOUT_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as (typeof PAYOUT_STATUSES)[number])
      : undefined

    const result = await adminService.listPayouts({ status, limit, offset })
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/payouts]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch payouts' })
  }
})
