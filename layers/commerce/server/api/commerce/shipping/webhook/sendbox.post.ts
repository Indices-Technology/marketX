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
import { walletService } from '~~/layers/commerce/server/services/wallet.service'

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

  let payload: Record<string, any>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  // Sendbox event shape: { event, data: { tracking_number, status, ... } }
  const trackingNumber: string = payload?.data?.tracking_number
  const newStatus: string | undefined = payload?.data?.status?.toUpperCase()

  if (!trackingNumber || !newStatus) {
    return { received: true }
  }

  const order = await prisma.orders.findFirst({
    where: { trackingNumber },
    select: { id: true, userId: true, status: true, paymentStatus: true },
  })

  if (order) {
    const orderStatus = newStatus === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED'

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
          .catch((e) => logger.logError('[webhook/sendbox wallet release]', e))
      }
    }

    // Push real-time notification to buyer via SSE
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
