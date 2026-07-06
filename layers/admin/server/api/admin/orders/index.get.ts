// GET /api/admin/orders — platform-wide order list (admin only)
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { adminService } from '~~/layers/admin/server/services/admin.service'

const VALID_PAYMENT_STATUS = [
  'UNPAID',
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'SHIPPING_PAID',
]

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const q = getQuery(event)
    const limit = Math.min(Number(q.limit) || 20, 100)
    const offset = Math.max(Number(q.offset) || 0, 0)
    const search = String(q.search || '').trim() || undefined
    const psRaw = String(q.paymentStatus || '').trim().toUpperCase()
    const paymentStatus = VALID_PAYMENT_STATUS.includes(psRaw) ? psRaw : undefined

    const result = await adminService.listOrders({
      paymentStatus,
      search,
      limit,
      offset,
    })
    return { success: true, ...result }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/admin/orders]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch orders' })
  }
})
