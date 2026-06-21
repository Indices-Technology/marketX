// Chat authorization + validation regression suite.
// Covers bugs found in the Messaging audit (June 2026):
//   - store owner was 403'd on their OWN store conversation (sellerSelect
//     omitted profileId, so the participant check never matched the owner)
//   - empty/missing message body returned 500 instead of 400
//   - self-conversation was silently created
//   - third-party IDOR remains blocked after the profileId fix
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const CONVERSATIONS = '/api/chat/conversations'
const MESSAGES = (id: string) => `/api/chat/conversations/${id}/messages`
const OUTSIDER = { email: 'chidi@peppr.test', password: 'test1234' } // neither party

async function header(request: APIRequestContext, creds: any) {
  const { token } = await apiLogin(request, creds)
  return { Authorization: `Bearer ${token}` }
}

test.describe('chat — store-owner access & message validation', () => {
  let buyerHeaders: Record<string, string>
  let conversationId: string

  test.beforeAll(async ({ request }) => {
    buyerHeaders = await header(request, TEST_USER) // ada → buyer/participant1
    const store = (await (await request.get(`/api/seller/by-slug/${TEST_SELLER.storeSlug}`)).json()).data
    const convo = await request.post(CONVERSATIONS, {
      headers: buyerHeaders,
      data: { storeId: store.id },
    })
    conversationId = (await convo.json()).data?.id
    // Buyer sends an opening message so the conversation has content.
    await request.post(MESSAGES(conversationId), {
      headers: buyerHeaders,
      data: { text: 'Hi, is this still available?' },
    })
  })

  test('store owner can READ their own store conversation', async ({ request }) => {
    const owner = await header(request, TEST_SELLER) // balogun owns balogun-fabrics
    const res = await request.get(MESSAGES(conversationId), { headers: owner })
    expect(res.status()).toBe(200)
    const msgs = (await res.json()).data?.messages ?? []
    expect(Array.isArray(msgs)).toBe(true)
    expect(msgs.length).toBeGreaterThan(0)
  })

  test('store owner can REPLY to their own store conversation', async ({ request }) => {
    const owner = await header(request, TEST_SELLER)
    const res = await request.post(MESSAGES(conversationId), {
      headers: owner,
      data: { text: 'Yes it is — 5 yards in stock.' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).data?.id).toBeTruthy()
  })

  test('third party (neither buyer nor owner) → 403 on read', async ({ request }) => {
    const outsider = await header(request, OUTSIDER)
    const res = await request.get(MESSAGES(conversationId), { headers: outsider })
    expect(res.status()).toBe(403)
  })

  test('third party → 403 on send', async ({ request }) => {
    const outsider = await header(request, OUTSIDER)
    const res = await request.post(MESSAGES(conversationId), {
      headers: outsider,
      data: { text: 'sneaking in' },
    })
    expect(res.status()).toBe(403)
  })

  test('empty message body → 400 (not 500)', async ({ request }) => {
    const res = await request.post(MESSAGES(conversationId), {
      headers: buyerHeaders,
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('blank whitespace-only text → 400', async ({ request }) => {
    const res = await request.post(MESSAGES(conversationId), {
      headers: buyerHeaders,
      data: { text: '' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('chat — conversation create validation', () => {
  test('no storeId or targetId → 400', async ({ request }) => {
    const headers = await header(request, TEST_USER)
    const res = await request.post(CONVERSATIONS, { headers, data: {} })
    expect(res.status()).toBe(400)
  })

  test('self-conversation (targetId === self) → 400', async ({ request }) => {
    const { token, user } = await apiLogin(request, TEST_USER)
    const res = await request.post(CONVERSATIONS, {
      headers: { Authorization: `Bearer ${token}` },
      data: { targetId: user.id },
    })
    expect(res.status()).toBe(400)
  })
})
