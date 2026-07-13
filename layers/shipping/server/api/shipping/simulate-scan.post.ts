/**
 * POST /api/shipping/simulate-scan  { orderId, status }   (admin only)
 *
 * TEST TOOL. Injects a carrier tracking status for an order and runs the exact
 * same transition path a real GIG scan takes (applyCarrierStatus) — so you can
 * drive an order CONFIRMED → SHIPPED → DELIVERED (and watch notifications + fund
 * release) without waiting on a physical scan.
 *
 * ⚠ Simulating DELIVERED releases real escrow to the seller. Admin-gated, and
 * every call is logged. Use on test orders.
 */
import { requireAdmin } from '~~/server/layers/shared/middleware/requireRole'
import { applyCarrierStatus } from '~~/server/services/carrierProgress'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'

const ALLOWED: TrackingStatus[] = [
  'PRE_TRANSIT',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'FAILURE',
]

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<{ orderId?: number; status?: string }>(event)
  const orderId = Number(body?.orderId)
  const status = body?.status as TrackingStatus

  if (!orderId || Number.isNaN(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }
  if (!ALLOWED.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `status must be one of: ${ALLOWED.join(', ')}`,
    })
  }

  logger.warn(
    `[simulate-scan] admin ${admin.id} injected ${status} for order #${orderId}`,
  )
  const result = await applyCarrierStatus(orderId, status)
  return { success: true, data: result }
})
