import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const LIST = '/api/shared/notifications'
const READ_ALL = '/api/shared/notifications/read-all'
const ONE = (id: number | string) => `/api/shared/notifications/${id}`

// ─── GET /api/notifications/stream ────────────────────────────────────────────
// SSE endpoint — auth is via ?token= query param, not Authorization header.

test.describe('notifications — SSE stream', () => {
  test('GET /api/notifications/stream requires token query param', async ({ request }) => {
    const res = await request.get('/api/notifications/stream')
    expect(res.status()).toBe(401)
  })

  test('GET /api/notifications/stream with invalid token returns 401', async ({ request }) => {
    const res = await request.get('/api/notifications/stream?token=invalid-token-xyz')
    expect(res.status()).toBe(401)
  })
})

// ─── /api/shared/notifications — auth + IDOR ──────────────────────────────────

test.describe('notifications — CRUD auth guards', () => {
  test('GET list requires auth → 401', async ({ request }) => {
    expect((await request.get(LIST)).status()).toBe(401)
  })
  test('PATCH read-all requires auth → 401', async ({ request }) => {
    expect((await request.patch(READ_ALL)).status()).toBe(401)
  })
  test('PATCH mark-read requires auth → 401', async ({ request }) => {
    expect((await request.patch(ONE(1))).status()).toBe(401)
  })
  test('DELETE requires auth → 401', async ({ request }) => {
    expect((await request.delete(ONE(1))).status()).toBe(401)
  })
})

test.describe('notifications — mark-read validation + IDOR', () => {
  test('non-numeric id → 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.patch(ONE('abc'), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('unknown id → 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.patch(ONE(999999999), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(404)
  })

  test("cannot mark another user's notification read → 403/404", async ({ request }) => {
    // Find a notification owned by TEST_USER
    const owner = await apiLogin(request, TEST_USER)
    const listRes = await request.get(`${LIST}?limit=20`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    })
    const body = await listRes.json()
    const list = body?.data?.notifications ?? body?.data ?? body?.notifications ?? []
    const target = Array.isArray(list) ? list[0] : null
    test.skip(!target?.id, 'TEST_USER has no notifications to test IDOR with')

    // A different user must not be able to mark it read
    const other = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(ONE(target.id), {
      headers: { Authorization: `Bearer ${other.token}` },
    })
    expect([403, 404]).toContain(res.status())
  })
})
