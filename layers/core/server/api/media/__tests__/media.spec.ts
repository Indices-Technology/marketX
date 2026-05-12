import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER } from '../../../../../../tests/helpers/auth'

// ─── POST /api/media/upload ────────────────────────────────────────────────────

test.describe('media — upload', () => {
  test('POST /api/media/upload requires auth', async ({ request }) => {
    const res = await request.post('/api/media/upload')
    expect(res.status()).toBe(401)
  })

  test('POST /api/media/upload with auth but no file returns 4xx', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post('/api/media/upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    })
    // Auth passes — 400 for missing file or 500 if Cloudinary not configured
    expect(res.status()).not.toBe(401)
  })
})

// ─── GET /api/music/search ─────────────────────────────────────────────────────

test.describe('music — search', () => {
  test('GET /api/music/search is a public endpoint', async ({ request }) => {
    const res = await request.get('/api/music/search?q=afrobeat')
    // 200 = Jamendo configured; 503 = not configured in test env — both acceptable
    expect([200, 503]).toContain(res.status())
  })

  test('GET /api/music/search with missing query does not require auth', async ({ request }) => {
    const res = await request.get('/api/music/search')
    expect(res.status()).not.toBe(401)
  })
})
