/**
 * POST /api/commerce/shipping/webhook/sendbox
 * Receives status update events from Sendbox.
 * Register this URL in your Sendbox dashboard → Webhooks.
 *
 * Sendbox signs requests with a HMAC-SHA256 signature in the
 * X-Sendbox-Signature header. Verify with SENDBOX_WEBHOOK_SECRET.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '~~/server/utils/db'
import { sseConnections } from '~~/server/utils/connections'
import { applyCarrierStatus } from '~~/server/services/carrierProgress'
import type { TrackingStatus } from '~~/layers/shipping/server/utils/types'

// Sendbox status → our normalized TrackingStatus. Unknown values return null so
// no transition is applied.
function mapSendboxStatus(raw: string): TrackingStatus | null {
  switch (raw) {
    case 'DELIVERED':
      return 'DELIVERED'
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return 'IN_TRANSIT'
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY'
    case 'RETURNED':
      return 'RETURNED'
    case 'FAILED':
    case 'CANCELLED':
      return 'FAILURE'
    default:
      return null
  }
}

function verify(rawBody: string, signature: string): boolean {
  const secret = useRuntimeConfig().sendboxWebhookSecret
  if (!secret) {
    // Fail closed in production — a missing secret must not disable verification
    if (!import.meta.dev) {
      logger.warn('[webhook/sendbox] SENDBOX_WEBHOOK_SECRET not set — rejecting webhook')
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
  const signature = getHeader(event, 'x-sendbox-signature') ?? ''

  if (!verify(rawBody, signature)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  // Sendbox event shape: { event, data: { tracking_number, status, ... } }
  interface SendboxWebhookPayload {
    data?: { tracking_number?: string; status?: string; description?: string }
  }
  let payload: SendboxWebhookPayload
  try {
    payload = JSON.parse(rawBody) as SendboxWebhookPayload
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  const trackingNumber = payload?.data?.tracking_number
  const newStatus = payload?.data?.status?.toUpperCase()

  if (!trackingNumber || !newStatus) {
    return { received: true }
  }

  const order = await prisma.orders.findFirst({
    where: { trackingNumber },
    select: { id: true, userId: true },
  })

  if (order) {
    // Route through the shared carrier-progress service — the SAME path GIG's
    // poller and the scan simulator use (monotonic transitions, dispute-aware
    // fund release, notifications + emails, reputation signal). The old inline
    // logic released funds even during an open dispute and mislabelled
    // RETURNED/FAILED scans as SHIPPED.
    const mapped = mapSendboxStatus(newStatus)
    if (mapped) {
      await applyCarrierStatus(order.id, mapped).catch((e) =>
        logger.logError('[webhook/sendbox applyCarrierStatus]', e, {
          orderId: order.id,
        }),
      )
    }

    // Ephemeral live update for an open buyer tab, on top of the persisted
    // notification/email applyCarrierStatus emits.
    sseConnections.send(order.userId, 'shipping_update', {
      orderId: order.id,
      trackingNumber,
      status: newStatus,
      description:
        payload?.data?.description ?? `Package ${newStatus.toLowerCase()}`,
    })
  }

  return { received: true }
})
