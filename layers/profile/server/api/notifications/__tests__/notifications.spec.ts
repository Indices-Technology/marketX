import { test, expect } from '@playwright/test'

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
