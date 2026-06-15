// Auth — password reset + email verification (June/July audit)
// API-testable behaviors: no user enumeration, invalid/garbage token rejection,
// validation. The single-use + expiry guarantees are proven end-to-end by the
// Prisma-backed script tests/scripts/verify-reset-token.cjs (tokens are emailed,
// not returned by the API, so they can't be exercised from here).
import { test, expect } from '@playwright/test'
import { resetRateLimits, uniqueEmail, TEST_USER } from '../../../../../../tests/helpers/auth'

const FORGOT = '/api/auth/forgot-password'
const RESET = '/api/auth/reset-password'
const VERIFY = '/api/auth/verify-email'

const STRONG = 'NewValidPass123!'

test.beforeEach(async ({ request }) => {
  await resetRateLimits(request).catch(() => {})
})

// ─── forgot-password — no user enumeration ────────────────────────────────────

test.describe('POST /api/auth/forgot-password', () => {
  test('existing email → 200 with generic message', async ({ request }) => {
    const res = await request.post(FORGOT, { data: { email: TEST_USER.email } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.message).toMatch(/if email exists/i)
  })

  test('non-existent email → 200 with the SAME generic message (no enumeration)', async ({ request }) => {
    const res = await request.post(FORGOT, { data: { email: uniqueEmail() } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    // Identical response shape/message — response must not reveal account existence
    expect(body.message).toMatch(/if email exists/i)
  })

  test('invalid email format → 400', async ({ request }) => {
    const res = await request.post(FORGOT, { data: { email: 'not-an-email' } })
    expect(res.status()).toBe(400)
  })
})

// ─── reset-password — token + validation ──────────────────────────────────────

test.describe('POST /api/auth/reset-password', () => {
  test('garbage token → 400 (invalid/expired)', async ({ request }) => {
    const res = await request.post(RESET, {
      data: { token: 'totally-invalid-token', password: STRONG, confirmPassword: STRONG },
    })
    expect(res.status()).toBe(400)
  })

  test('missing token → 400', async ({ request }) => {
    const res = await request.post(RESET, {
      data: { password: STRONG, confirmPassword: STRONG },
    })
    expect(res.status()).toBe(400)
  })

  test('weak password → 400', async ({ request }) => {
    const res = await request.post(RESET, {
      data: { token: 'x'.repeat(64), password: 'weak', confirmPassword: 'weak' },
    })
    expect(res.status()).toBe(400)
  })

  test('mismatched confirmPassword → 400', async ({ request }) => {
    const res = await request.post(RESET, {
      data: { token: 'x'.repeat(64), password: STRONG, confirmPassword: 'Different123!' },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── verify-email — token ─────────────────────────────────────────────────────

test.describe('POST /api/auth/verify-email', () => {
  test('garbage token → 400', async ({ request }) => {
    const res = await request.post(VERIFY, { data: { token: 'garbage-token' } })
    expect(res.status()).toBe(400)
  })

  test('missing token → 400', async ({ request }) => {
    const res = await request.post(VERIFY, { data: {} })
    expect(res.status()).toBe(400)
  })
})
