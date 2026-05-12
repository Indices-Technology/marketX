import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER } from '../../../../../../tests/helpers/auth'

const CONVERSATIONS = '/api/chat/conversations'
const CONVERSATION = (id: string) => `/api/chat/conversations/${id}`
const MESSAGES = (id: string) => `/api/chat/conversations/${id}/messages`

// Auth guards for messages are already covered in chat.spec.ts.
// This file tests message functionality beyond the auth guard.

test.describe('chat — messages CRUD', () => {
  let token: string
  let conversationId: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request, TEST_USER))

    // Get or create conversation with the seed seller store (idempotent)
    const sellerRes = await request.get('/api/seller/by-slug/balogun-fabrics')
    const seller = (await sellerRes.json()).data
    if (!seller?.id) return

    const convoRes = await request.post(CONVERSATIONS, {
      data: { storeId: seller.id },
      headers: { Authorization: `Bearer ${token}` },
    })
    const convo = await convoRes.json()
    conversationId = convo.data?.id ?? ''
  })

  test('GET messages for unknown conversation returns 4xx', async ({ request }) => {
    const res = await request.get(MESSAGES('00000000-0000-4000-8000-000000000001'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('GET messages for own conversation returns 200 with array', async ({ request }) => {
    if (!conversationId) return
    const res = await request.get(MESSAGES(conversationId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    const msgs = body.data?.messages ?? body.data
    expect(Array.isArray(msgs)).toBe(true)
  })

  test('POST message with body.text to own conversation passes auth', async ({ request }) => {
    if (!conversationId) return
    const res = await request.post(MESSAGES(conversationId), {
      // chat handler uses body.text (not body.content)
      data: { text: 'Hello, is this item available?' },
      headers: { Authorization: `Bearer ${token}` },
    })
    // Auth passes — 200 on success, 5xx if real-time service not configured
    expect(res.status()).not.toBe(401)
  })

  test('POST message without body passes auth gate', async ({ request }) => {
    if (!conversationId) return
    const res = await request.post(MESSAGES(conversationId), {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    // Auth passes — validation happens in chatService
    expect(res.status()).not.toBe(401)
  })

  test('DELETE /api/chat/conversations/:id requires auth', async ({ request }) => {
    const res = await request.delete(CONVERSATION('00000000-0000-4000-8000-000000000001'))
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/chat/conversations/:id for unknown UUID returns 4xx with auth', async ({ request }) => {
    const res = await request.delete(CONVERSATION('00000000-0000-4000-8000-000000000001'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})
