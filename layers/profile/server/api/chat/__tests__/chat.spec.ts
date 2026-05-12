import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const CONVERSATIONS = '/api/chat/conversations'
const CONVERSATION = (id: string) => `/api/chat/conversations/${id}`
const MESSAGES = (id: string) => `/api/chat/conversations/${id}/messages`

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('chat — auth guards', () => {
  test('GET /api/chat/conversations requires auth', async ({ request }) => {
    const res = await request.get(CONVERSATIONS)
    expect(res.status()).toBe(401)
  })

  test('POST /api/chat/conversations requires auth', async ({ request }) => {
    const res = await request.post(CONVERSATIONS, { data: { targetId: 'anyone' } })
    expect(res.status()).toBe(401)
  })

  test('GET /api/chat/conversations/:id requires auth', async ({ request }) => {
    const res = await request.get(CONVERSATION('00000000-0000-4000-8000-000000000000'))
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/chat/conversations/:id requires auth', async ({ request }) => {
    const res = await request.delete(CONVERSATION('00000000-0000-4000-8000-000000000000'))
    expect(res.status()).toBe(401)
  })

  test('GET /api/chat/conversations/:id/messages requires auth', async ({ request }) => {
    const res = await request.get(MESSAGES('00000000-0000-4000-8000-000000000000'))
    expect(res.status()).toBe(401)
  })

  test('POST /api/chat/conversations/:id/messages requires auth', async ({ request }) => {
    const res = await request.post(MESSAGES('00000000-0000-4000-8000-000000000000'), {
      data: { content: 'hello' },
    })
    expect(res.status()).toBe(401)
  })
})

// ─── Authenticated: conversations ─────────────────────────────────────────────

test.describe('chat — conversations', () => {
  test('GET /api/chat/conversations returns list', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(CONVERSATIONS, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  test('GET /api/chat/conversations supports pagination', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${CONVERSATIONS}?limit=5&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/chat/conversations/:id returns 4xx for unknown id', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(CONVERSATION('00000000-0000-4000-8000-000000000000'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('POST /api/chat/conversations creates or returns existing conversation', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    // Message the seller store
    const sellerRes = await request.get('/api/seller/by-slug/balogun-fabrics')
    const seller = (await sellerRes.json()).data
    if (!seller?.id) return // skip if seed not found

    const res = await request.post(CONVERSATIONS, {
      data: { storeId: seller.id },
      headers: { Authorization: `Bearer ${token}` },
    })
    // Idempotent: returns 200 or 201 with conversation data
    expect(res.status()).toBeLessThan(300)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
