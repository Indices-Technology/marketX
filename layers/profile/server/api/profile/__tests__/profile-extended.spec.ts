import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const PROFILE = '/api/profile'

test.describe('profile — extended endpoints', () => {
  let token: string
  let sellerToken: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request, TEST_USER))
    ;({ token: sellerToken } = await apiLogin(request, TEST_SELLER))
  })

  // ─── Suggestions ──────────────────────────────────────────────────────────────

  test('GET /api/profile/suggestions requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/suggestions`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/suggestions returns suggestions when authenticated', async ({ request }) => {
    const res = await request.get(`${PROFILE}/suggestions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  // ─── Check-following ──────────────────────────────────────────────────────────

  test('POST /api/profile/check-following requires auth', async ({ request }) => {
    const res = await request.post(`${PROFILE}/check-following`, {
      data: { targetIds: [] },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/profile/check-following returns 200 when authenticated', async ({ request }) => {
    const res = await request.post(`${PROFILE}/check-following`, {
      data: { targetIds: [] },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  // ─── Stats ────────────────────────────────────────────────────────────────────

  test('GET /api/profile/:username/stats is public', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/stats`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  test('GET /api/profile/:username/stats returns 404 for unknown user', async ({ request }) => {
    const res = await request.get(`${PROFILE}/definitely-not-a-user-99999/stats`)
    expect(res.status()).toBe(404)
  })

  // ─── Status ───────────────────────────────────────────────────────────────────

  test('GET /api/profile/:username/status requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_SELLER.username}/status`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/:username/status returns status when authenticated', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_SELLER.username}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  // ─── Media ────────────────────────────────────────────────────────────────────

  test('GET /api/profile/media requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/media`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/media returns media list when authenticated', async ({ request }) => {
    const res = await request.get(`${PROFILE}/media`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  // ─── Likes ────────────────────────────────────────────────────────────────────

  test('GET /api/profile/:username/likes requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/likes`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/:username/likes returns own liked products', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/profile/:username/likes returns 403 when accessing another user', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/likes`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(res.status()).toBe(403)
  })

  // ─── Posts ────────────────────────────────────────────────────────────────────

  test('GET /api/profile/:username/posts is public', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/posts`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/profile/:username/posts returns pagination meta', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/posts?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.meta).toHaveProperty('total')
    expect(body.meta).toHaveProperty('limit')
    expect(body.meta).toHaveProperty('hasMore')
  })

  test('GET /api/profile/:username/posts for unknown user returns 500 or 404', async ({ request }) => {
    const res = await request.get(`${PROFILE}/definitely-not-a-user-99999/posts`)
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})
