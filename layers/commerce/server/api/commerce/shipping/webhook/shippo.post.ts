/**
 * POST /api/commerce/shipping/webhook/shippo
 * Receives tracking update events from Shippo.
 * Register this URL in your Shippo dashboard → Webhooks.
 *
 * Shippo signs requests with a X-Shippo-Signature header (HMAC-SHA256).
 * Verify with SHIPPO_WEBHOOK_SECRET.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '~~/server/utils/db'
import { sseConnections } from '~~/server/utils/connections'
import { applyCarrierStatus } from '~~/server/services/carrierProgress'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'

// Shippo tracking_status.status → our normalized TrackingStatus. Interim/unknown
// values (UNKNOWN, PRE_TRANSIT) return null so no transition is applied.
function mapShippoStatus(raw: string): TrackingStatus | null {
  switch (raw) {
    case 'DELIVERED':
      return 'DELIVERED'
    case 'TRANSIT':
      return 'IN_TRANSIT'
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY'
    case 'RETURNED':
      return 'RETURNED'
    case 'FAILURE':
      return 'FAILURE'
    default:
      return null
  }
}

function verify(rawBody: string, signature: string): boolean {
  const secret = useRuntimeConfig().shippoWebhookSecret
  if (!secret) {
    // Fail closed in production — a missing secret must not disable verification
    if (!import.meta.dev) {
      logger.warn('[webhook/shippo] SHIPPO_WEBHOOK_SECRET not set — rejecting webhook')
      return false
    }
    return true // dev only
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? ''
  const signature = getHeader(event, 'x-shippo-signature') ?? ''

  if (!verify(rawBody, signature)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  // Shippo webhook shape:
  // { event: "track_updated", data: { tracking_number, carrier, tracking_status: { status } } }
  interface ShippoWebhookPayload {
    data?: {
      tracking_number?: string
      carrier?: string
      tracking_status?: { status?: string; status_details?: string }
    }
  }
  let payload: ShippoWebhookPayload
  try {
    payload = JSON.parse(rawBody) as ShippoWebhookPayload
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  const trackingNumber = payload?.data?.tracking_number
  const carrier = payload?.data?.carrier ?? ''
  const rawStatus = payload?.data?.tracking_status?.status?.toUpperCase()
  const description: string =
    payload?.data?.tracking_status?.status_details ?? rawStatus ?? 'Update'

  if (!trackingNumber || !rawStatus) {
    return { received: true }
  }

  const order = await prisma.orders.findFirst({
    where: { trackingNumber },
    select: { id: true, userId: true },
  })

  if (order) {
    // Route through the shared carrier-progress service — the SAME path GIG's
    // poller and the scan simulator use. It applies monotonic transitions,
    // dispute-aware fund release, buyer/seller notifications + emails, and the
    // reputation signal. (The old inline logic released funds even during an open
    // dispute and mislabelled RETURNED/FAILURE scans as SHIPPED.)
    const mapped = mapShippoStatus(rawStatus)
    if (mapped) {
      await applyCarrierStatus(order.id, mapped).catch((e) =>
        logger.logError('[webhook/shippo applyCarrierStatus]', e, {
          orderId: order.id,
        }),
      )
    }

    // Ephemeral live update for an open buyer tab, on top of the persisted
    // notification/email applyCarrierStatus emits.
    sseConnections.send(order.userId, 'shipping_update', {
      orderId: order.id,
      trackingNumber,
      carrier,
      status: rawStatus,
      description,
    })
  }

  return { received: true }
})
