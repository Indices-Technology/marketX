// Auth — OAuth redirect + callback (state CSRF protection)
import { test, expect } from '@playwright/test'

const CALLBACK = (p: string) => `/api/auth/oauth/${p}/callback`
const START = (p: string) => `/api/auth/oauth/${p}`

test.describe('OAuth — provider whitelist', () => {
  test('unknown provider on callback → 404', async ({ request }) => {
    const res = await request.get(`${CALLBACK('myspace')}?code=x&state=y`, { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test('unknown provider on start → 404', async ({ request }) => {
    const res = await request.get(START('myspace'), { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })
})

test.describe('OAuth callback — state CSRF', () => {
  // A forged callback has no matching httpOnly oauth_state cookie, so the
  // cookieState !== state check rejects it. This is the login-CSRF guard.
  test('callback with state but no matching cookie → 400', async ({ request }) => {
    const res = await request.get(`${CALLBACK('google')}?code=abc&state=attacker-supplied`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(400)
  })

  test('callback with code but no state → 400', async ({ request }) => {
    const res = await request.get(`${CALLBACK('google')}?code=abc`, { maxRedirects: 0 })
    expect(res.status()).toBe(400)
  })

  test('provider-reported error redirects to login (not a 500)', async ({ request }) => {
    const res = await request.get(`${CALLBACK('google')}?error=access_denied`, {
      maxRedirects: 0,
    })
    // 3xx redirect back to /user-login with an oauth_error param
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect(res.headers()['location']).toContain('oauth_error')
  })
})
