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
import { walletService } from '~~/layers/commerce/server/services/wallet.service'

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

  let payload: Record<string, any>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  // Shippo webhook shape:
  // { event: "track_updated", data: { tracking_number, carrier, tracking_status: { status } } }
  const trackingNumber: string = payload?.data?.tracking_number
  const carrier: string = payload?.data?.carrier
  const rawStatus: string | undefined =
    payload?.data?.tracking_status?.status?.toUpperCase()
  const description: string =
    payload?.data?.tracking_status?.status_details ?? rawStatus ?? 'Update'

  if (!trackingNumber || !rawStatus) {
    return { received: true }
  }

  const order = await prisma.orders.findFirst({
    where: { trackingNumber },
    select: { id: true, userId: true, status: true, paymentStatus: true },
  })

  if (order) {
    const orderStatus = rawStatus === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED'

    // Never downgrade a terminal state — late/duplicate SHIPPED events must not
    // pull a DELIVERED/CANCELLED/RETURNED order backward
    const terminal = ['DELIVERED', 'CANCELLED', 'RETURNED']
    if (!terminal.includes(order.status)) {
      await prisma.orders.update({
        where: { id: order.id },
        data: { status: orderStatus as 'DELIVERED' | 'SHIPPED' },
      })

      // Release held funds — same as the seller status PATCH path
      if (orderStatus === 'DELIVERED' && order.paymentStatus === 'PAID') {
        walletService
          .releaseFundsOnDelivery(order.id)
          .catch((e) => logger.logError('[webhook/shippo wallet release]', e))
      }
    }

    // Push real-time notification to buyer via SSE
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
