/**
 * POST /api/shipping/book-dropoff  { orderId }
 * Seller books a GIG DROP-OFF for a paid, confirmed order — they take the parcel
 * to a GIG service centre instead of waiting for a pickup rider. Idempotent.
 * Returns the TempCode + the centre to drop at. The order is NOT marked SHIPPED
 * here; the seller adds the Waybill after drop-off, and the poller advances it.
 */
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { bookingService } from '~~/layers/shipping/server/services/booking.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ orderId?: number; dropoffCentreId?: number }>(
    event,
  )
  const orderId = Number(body?.orderId)
  if (!orderId || Number.isNaN(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }
  const dropoffCentreId = body?.dropoffCentreId
    ? Number(body.dropoffCentreId)
    : undefined

  try {
    const result = await bookingService.bookDropoff(
      orderId,
      user.id,
      dropoffCentreId,
    )
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/shipping/book-dropoff]', error, {
      requestId: event.context?.requestId,
      orderId,
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not book the drop-off — please try again',
    })
  }
})
