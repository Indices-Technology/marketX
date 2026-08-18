/**
 * POST /api/webhooks/whatsapp
 *
 * Receives WhatsApp Cloud API events (message delivery/read status, and later
 * inbound messages once sellers connect their own numbers). Meta signs every
 * event with the App Secret of the Meta app the WABA lives under
 * (WHATSAPP_APP_SECRET, "marketx-WA") — a DIFFERENT app from the one that
 * issues OAUTH_FACEBOOK_CLIENT_SECRET (consumer login), so that var alone
 * cannot verify these. Both are tried since dev setups may still only have
 * one configured.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function verify(rawBody: string, signature: string): boolean {
  const secrets = [
    process.env.WHATSAPP_APP_SECRET,
    process.env.OAUTH_FACEBOOK_CLIENT_SECRET,
  ].filter((s): s is string => !!s)
  if (secrets.length === 0) {
    // Fail closed in production — a missing secret must not disable verification
    if (!import.meta.dev) {
      logger.warn(
        '[webhook/whatsapp] no app secret configured — rejecting webhook',
      )
      return false
    }
    return true // dev only
  }
  return secrets.some((secret) => {
    const expected =
      'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
      return false
    }
  })
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
