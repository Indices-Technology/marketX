/**
 * GET /api/commerce/orders/:id/tracking
 * Live carrier tracking timeline for an order. Readable by the buyer or any
 * seller with items in the order. Pulls fresh scans from the carrier (GIG is
 * pull-only) and returns the normalized event list + last known status.
 */
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { getProvider } from '~~/layers/shipping/server/providers/registry'
import { RANK } from '~~/layers/shipping/server/utils/trackingTransition'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'

/** Human note for a status surfaced from the order's stored carrierStatus. */
const STORED_STATUS_NOTE: Record<string, string> = {
  PRE_TRANSIT: 'Awaiting pickup',
  IN_TRANSIT: 'In transit with the carrier',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned to sender',
  FAILURE: 'Delivery failed',
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const order = await prisma.orders.findUnique({
    where: { id },
    select: {
      userId: true,
      waybill: true,
      shipper: true,
      carrierStatus: true,
      carrierStatusAt: true,
      shippingProvider: true,
      orderItem: {
        select: {
          variant: {
            select: { product: { select: { seller: { select: { profileId: true } } } } },
          },
        },
      },
    },
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  const isBuyer = order.userId === user.id
  const isSeller = order.orderItem.some(
    (i) => i.variant?.product?.seller?.profileId === user.id,
  )
  if (!isBuyer && !isSeller) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const base = {
    carrierStatus: order.carrierStatus,
    waybill: order.waybill,
    shipper: order.shipper,
    events: [] as Array<{
      timestamp: string
      status: string
      description: string
      location?: string
    }>,
  }

  // Not booked yet, or carrier can't track → return the shell (status only).
  const provider = order.shippingProvider ? getProvider(order.shippingProvider) : undefined
  if (!order.waybill || !provider?.track) {
    return { success: true, data: base }
  }

  try {
    const tracking = await provider.track(order.waybill)
    const events = [...tracking.events]
    let current = tracking.currentStatus
    const stored = order.carrierStatus as TrackingStatus | null
    // The order's known status (advanced by the poller or the admin simulator) can
    // sit AHEAD of the carrier's public scan feed — sandbox waybills never move past
    // "created", and live feeds lag. Surface the known status as the current step so
    // the timeline matches the order's real state (and the status badge).
    if (stored && (RANK[stored] ?? 0) > (RANK[current] ?? 0)) {
      current = stored
      events.push({
        timestamp: (order.carrierStatusAt ?? new Date()).toISOString(),
        status: stored,
        description: STORED_STATUS_NOTE[stored] ?? '',
      })
    }
    return {
      success: true,
      data: { ...base, carrierStatus: current, events },
    }
  } catch (e) {
    // Carrier hiccup — degrade to the last known status rather than error the page.
    logger.logError('[orders/tracking] carrier lookup failed', e, {
      requestId: event.context?.requestId,
      orderId: id,
    })
    return { success: true, data: base }
  }
})
