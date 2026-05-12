import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const SELLER = '/api/seller'

// ─── POST /api/seller/ping ─────────────────────────────────────────────────────

test.describe('seller — ping', () => {
  test('POST /api/seller/ping requires auth', async ({ request }) => {
    const res = await request.post(`${SELLER}/ping`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/seller/ping succeeds for authenticated seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(`${SELLER}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─── POST /api/seller/:id/activate and /deactivate ─────────────────────────────

test.describe('seller — activate / deactivate', () => {
  test('POST /api/seller/:id/activate requires auth', async ({ request }) => {
    const res = await request.post(`${SELLER}/fake-id/activate`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/seller/:id/deactivate requires auth', async ({ request }) => {
    const res = await request.post(`${SELLER}/fake-id/deactivate`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/seller/:id/activate with auth passes auth gate', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    // Fetch own seller ID via by-slug
    const slugRes = await request.get(`${SELLER}/by-slug/${TEST_SELLER.storeSlug}`)
    const sellerId = (await slugRes.json()).data?.id
    if (!sellerId) return

    const res = await request.post(`${SELLER}/${sellerId}/activate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Already active may return 200 or a SellerError — both are non-401
    expect(res.status()).not.toBe(401)
  })
})

// ─── GET /api/seller/:id/messages ─────────────────────────────────────────────

test.describe('seller — messages inbox', () => {
  test('GET /api/seller/:id/messages requires auth', async ({ request }) => {
    const res = await request.get(`${SELLER}/fake-id/messages`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/seller/:id/messages returns 4xx for unknown store', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${SELLER}/00000000-0000-4000-8000-000000000000/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('GET /api/seller/:id/messages returns 200 for own store', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const slugRes = await request.get(`${SELLER}/by-slug/${TEST_SELLER.storeSlug}`)
    const sellerId = (await slugRes.json()).data?.id
    if (!sellerId) return

    const res = await request.get(`${SELLER}/${sellerId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
