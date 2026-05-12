import { test, expect } from '@playwright/test'

// ─── GET /api/auth/session ─────────────────────────────────────────────────────

test.describe('auth — session', () => {
  test('GET /api/auth/session is public (no auth required)', async ({ request }) => {
    const res = await request.get('/api/auth/session')
    expect(res.status()).toBe(200)
  })

  test('GET /api/auth/session returns token fields (null when no cookies)', async ({ request }) => {
    const res = await request.get('/api/auth/session')
    const body = await res.json()
    expect(body).toHaveProperty('accessToken')
    expect(body).toHaveProperty('refreshToken')
  })
})

// ─── POST /api/auth/checkout-otp/send ─────────────────────────────────────────

test.describe('auth — checkout OTP', () => {
  test('POST /api/auth/checkout-otp/send is public (no auth required)', async ({ request }) => {
    const res = await request.post('/api/auth/checkout-otp/send', {
      data: { email: 'guest@example.com', name: 'Guest' },
    })
    // 200 = OTP queued; 503 = mail not configured in test env — both non-401
    expect(res.status()).not.toBe(401)
  })

  test('POST /api/auth/checkout-otp/send rejects invalid email format', async ({ request }) => {
    const res = await request.post('/api/auth/checkout-otp/send', {
      data: { email: 'not-an-email' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/checkout-otp/send rejects missing email', async ({ request }) => {
    const res = await request.post('/api/auth/checkout-otp/send', {
      data: { name: 'Guest User' },
    })
    expect(res.status()).toBe(400)
  })
})
