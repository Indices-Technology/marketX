/**
 * GET /api/webhooks/whatsapp
 *
 * Meta's one-time webhook verification handshake. Register this exact URL in
 * WhatsApp Manager → Configuration → Webhook, along with WHATSAPP_WEBHOOK_VERIFY_TOKEN
 * (any string you choose — must match here and there).
 */

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    setResponseStatus(event, 200)
    return challenge
  }

  throw createError({ statusCode: 403, message: 'Webhook verification failed' })
})
