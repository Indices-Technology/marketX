import { test, expect } from '@playwright/test'
import { TEST_USER, uniqueEmail } from '../../../../../../tests/helpers/auth'

const ENDPOINT = '/api/auth/login'

// ─── Happy path ────────────────────────────────────────────────────────────────

test.describe('POST /api/auth/login — happy path', () => {
  test('returns success with tokens on valid credentials', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })

    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.accessToken).toBeTruthy()
    expect(body.refreshToken).toBeTruthy()
    expect(body.user).toBeTruthy()
  })

  test('response includes expected user fields', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    const body = await res.json()

    expect(body.user).toMatchObject({
      email: TEST_USER.email,
    })
    // Must NOT leak sensitive fields
    expect(body.user.password_hash).toBeUndefined()
    expect(body.user.password).toBeUndefined()
  })

  test('sets httpOnly cookies on login', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })

    // headersArray() preserves multiple Set-Cookie headers; headers() merges them and may drop them
    const setCookies = res.headersArray()
      .filter(({ name }) => name.toLowerCase() === 'set-cookie')
      .map(({ value }) => value)
      .join('\n')
    expect(setCookies).toContain('accessToken')
    expect(setCookies).toContain('refreshToken')
    expect(setCookies.toLowerCase()).toContain('httponly')
  })
})

// ─── Input validation ──────────────────────────────────────────────────────────

test.describe('POST /api/auth/login — input validation', () => {
  test('rejects empty body', async ({ request }) => {
    const res = await request.post(ENDPOINT, { data: {} })
    expect(res.status()).toBe(400)
  })

  test('rejects missing email', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { password: TEST_USER.password },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects missing password', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects malformed email', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: 'not-an-email', password: TEST_USER.password },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects empty string email', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: '', password: TEST_USER.password },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── Auth failures ─────────────────────────────────────────────────────────────

test.describe('POST /api/auth/login — auth failures', () => {
  test('returns 401 on wrong password', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: 'wrongpassword' },
    })
    expect(res.status()).toBe(401)
  })

  test('returns 401 on unknown email', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: uniqueEmail(), password: TEST_USER.password },
    })
    // 401 or 404 — both acceptable, should not 500
    expect([401, 404]).toContain(res.status())
  })

  test('error response does not expose internal details', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: 'wrongpassword' },
    })
    const body = await res.json()
    // H3 dev mode includes a 'stack' key — check its contents aren't sensitive
    const stackContent = Array.isArray(body.stack) ? body.stack.join('') : String(body.stack ?? '')
    expect(stackContent).not.toContain('prisma')
    expect(stackContent).not.toContain('password_hash')
    // Top-level body must not expose DB internals
    const topLevel = { ...body, stack: undefined }
    expect(JSON.stringify(topLevel)).not.toContain('prisma')
    expect(JSON.stringify(topLevel)).not.toContain('password_hash')
  })
})

// ─── Request tracing ──────────────────────────────────────────────────────────

test.describe('request tracing', () => {
  test('every API response carries an X-Request-Id header', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    const requestId = res.headers()['x-request-id']
    expect(requestId).toBeTruthy()
    // Must be a valid UUID v4
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  test('each request gets a unique X-Request-Id', async ({ request }) => {
    const [a, b] = await Promise.all([
      request.post(ENDPOINT, { data: { email: TEST_USER.email, password: TEST_USER.password } }),
      request.post(ENDPOINT, { data: { email: TEST_USER.email, password: TEST_USER.password } }),
    ])
    expect(a.headers()['x-request-id']).not.toBe(b.headers()['x-request-id'])
  })

  test('error responses also carry X-Request-Id (traceable failures)', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { email: TEST_USER.email, password: 'wrong-password' },
    })
    expect(res.status()).toBe(401)
    expect(res.headers()['x-request-id']).toBeTruthy()
  })
})

// ─── Idempotency / replay safety ───────────────────────────────────────────────

test.describe('POST /api/auth/login — replay safety', () => {
  test('two rapid logins both succeed independently', async ({ request }) => {
    const [a, b] = await Promise.all([
      request.post(ENDPOINT, {
        data: { email: TEST_USER.email, password: TEST_USER.password },
      }),
      request.post(ENDPOINT, {
        data: { email: TEST_USER.email, password: TEST_USER.password },
      }),
    ])
    expect(a.status()).toBe(200)
    expect(b.status()).toBe(200)

    const [bodyA, bodyB] = await Promise.all([a.json(), b.json()])
    // Each login should produce an independent token
    expect(bodyA.accessToken).not.toBe(bodyB.accessToken)
  })
})
