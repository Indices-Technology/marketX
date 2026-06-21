// Auth — seller registration + refresh-token guards (gap coverage)
import { test, expect } from '@playwright/test'
import { resetRateLimits, uniqueEmail, uniqueUsername, TEST_USER } from '../../../../../../tests/helpers/auth'

const REGISTER_SELLER = '/api/auth/register-seller'
const REFRESH = '/api/auth/refresh-token'

const STRONG = 'ValidPass123!'

// A complete, valid seller-registration payload — individual tests override one
// field to trigger the specific rejection under test.
function sellerPayload(over: Record<string, unknown> = {}) {
  return {
    email: uniqueEmail(),
    username: uniqueUsername(),
    password: STRONG,
    confirmPassword: STRONG,
    store_name: 'Test Store',
    store_slug: `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...over,
  }
}

test.beforeEach(async ({ request }) => {
  await resetRateLimits(request).catch(() => {})
})

// ─── register-seller — rejection paths (no data created) ──────────────────────

test.describe('POST /api/auth/register-seller', () => {
  test('duplicate store slug → 409', async ({ request }) => {
    // balogun-fabrics is a seeded store slug
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ store_slug: 'balogun-fabrics' }),
    })
    expect(res.status()).toBe(409)
  })

  test('reserved slug → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ store_slug: 'admin' }),
    })
    expect(res.status()).toBe(400)
  })

  test('invalid slug format → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ store_slug: 'Bad Slug!' }),
    })
    expect(res.status()).toBe(400)
  })

  test('password mismatch → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ confirmPassword: 'Different123!' }),
    })
    expect(res.status()).toBe(400)
  })

  test('store name too short → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ store_name: 'X' }),
    })
    expect(res.status()).toBe(400)
  })

  test('duplicate account email → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: sellerPayload({ email: TEST_USER.email }),
    })
    expect(res.status()).toBe(400)
  })

  test('missing account fields → 400', async ({ request }) => {
    const res = await request.post(REGISTER_SELLER, {
      data: { store_name: 'Test Store', store_slug: 'whatever-store' },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── refresh-token — guards ───────────────────────────────────────────────────

test.describe('POST /api/auth/refresh-token', () => {
  test('no refresh cookie → 401', async ({ request }) => {
    const res = await request.post(REFRESH)
    expect(res.status()).toBe(401)
  })

  test('garbage refresh cookie → 401 (no valid session)', async ({ request }) => {
    const res = await request.post(REFRESH, {
      headers: { Cookie: 'refreshToken=not-a-real-token' },
    })
    expect(res.status()).toBe(401)
  })

  // Native transport (no cookie): token arrives via X-Refresh-Token header or body.
  test('garbage X-Refresh-Token header → 401 (native transport wired)', async ({ request }) => {
    const res = await request.post(REFRESH, {
      headers: { 'X-Refresh-Token': 'not-a-real-token' },
    })
    expect(res.status()).toBe(401)
  })

  test('garbage refreshToken body → 401 (native transport wired)', async ({ request }) => {
    const res = await request.post(REFRESH, {
      data: { refreshToken: 'not-a-real-token' },
    })
    expect(res.status()).toBe(401)
  })
})
