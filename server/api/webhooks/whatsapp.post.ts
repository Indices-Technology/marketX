/**
 * POST /api/webhooks/whatsapp
 *
 * Receives WhatsApp Cloud API events (message delivery/read status, and later
 * inbound messages once sellers connect their own numbers). Meta signs every
 * event with the SAME App Secret used for the FB signed_request checks
 * (OAUTH_FACEBOOK_CLIENT_SECRET) — this is one Meta App with multiple products.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function verify(rawBody: string, signature: string): boolean {
  const secret = process.env.OAUTH_FACEBOOK_CLIENT_SECRET
  if (!secret) {
    // Fail closed in production — a missing secret must not disable verification
    if (!import.meta.dev) {
      logger.warn(
        '[webhook/whatsapp] OAUTH_FACEBOOK_CLIENT_SECRET not set — rejecting webhook',
      )
      return false
    }
    return true // dev only
  }
  const expected =
    'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: WhatsAppStatus[]
        messages?: unknown[]
      }
    }>
  }>
}

export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? ''
  const signature = getHeader(event, 'x-hub-signature-256') ?? ''

  if (!verify(rawBody, signature)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  // Meta batches multiple entries/changes per delivery; walk all of them rather
  // than assuming entry[0]/changes[0] like a single-event webhook.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        if (status.status === 'failed') {
          logger.warn('[webhook/whatsapp] send failed', {
            messageId: status.id,
            to: status.recipient_id,
            errors: status.errors,
          })
        } else {
          logger.info('[webhook/whatsapp] status update', {
            messageId: status.id,
            to: status.recipient_id,
            status: status.status,
          })
        }
        // No WhatsAppMessage tracking table yet — this is log-only until
        // delivery status needs to be correlated back to a send record.
      }
    }
  }

  return { received: true }
})
