/**
 * POST /api/shipping/book  { orderId }
 * Seller books the carrier shipment for a paid, confirmed order ("ready to ship").
 * Idempotent — a re-submit returns the existing waybill. The order is NOT marked
 * SHIPPED here; the tracking poller does that on a real handover scan.
 */
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { bookingService } from '~~/layers/shipping/server/services/booking.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ orderId?: number }>(event)
  const orderId = Number(body?.orderId)
  if (!orderId || Number.isNaN(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }

  try {
    const result = await bookingService.bookOrder(orderId, user.id)
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/shipping/book]', error, {
      requestId: event.context?.requestId,
      orderId,
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not book the shipment — please try again',
    })
  }
})
