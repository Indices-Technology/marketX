import 'dotenv/config'
import { test, expect } from '@playwright/test'
import {
  apiLogin,
  resetRateLimits,
  TEST_USER,
  TEST_SELLER,
} from '../../../../../../tests/helpers/auth'

/**
 * Session management — GET /api/auth/sessions,
 * DELETE /api/auth/sessions/:id, POST /api/auth/sessions/revoke-all
 *
 * The point of these endpoints is that revoking a session kills its access
 * token *immediately*, so every test here asserts on a real token going 401
 * rather than just on the list shrinking.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

// A request that only succeeds with a live, non-revoked session.
const probe = (token: string) => ({ headers: auth(token) })

test.describe('auth — session management', () => {
  test.beforeEach(async ({ request }) => {
    await resetRateLimits(request)
  })

  test('GET /api/auth/sessions requires auth', async ({ request }) => {
    const res = await request.get('/api/auth/sessions')
    expect(res.status()).toBe(401)
  })

  test('GET /api/auth/sessions lists the caller session and flags it current', async ({
    request,
  }) => {
    const { token } = await apiLogin(request)

    const res = await request.get('/api/auth/sessions', probe(token))
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.sessions)).toBe(true)

    const current = body.sessions.filter((s: any) => s.isCurrent)
    expect(current).toHaveLength(1)
    expect(current[0]).toMatchObject({
      id: expect.any(String),
      device: expect.any(String),
      deviceType: expect.any(String),
    })
  })

  test('revoking another device kills that device token immediately', async ({
    request,
  }) => {
    // Two independent logins = two sessions on one account.
    const { token: tokenA } = await apiLogin(request)
    const { token: tokenB } = await apiLogin(request)

    // B is live before revocation.
    expect(
      (await request.get('/api/auth/sessions', probe(tokenB))).status(),
    ).toBe(200)

    // From A, find B's session and revoke it.
    const listRes = await request.get('/api/auth/sessions', probe(tokenA))
    const { sessions } = await listRes.json()
    expect(sessions.length).toBeGreaterThanOrEqual(2)

    const other = sessions.find((s: any) => !s.isCurrent)
    expect(other).toBeTruthy()

    const delRes = await request.delete(
      `/api/auth/sessions/${other.id}`,
      probe(tokenA),
    )
    expect(delRes.status()).toBe(200)
    expect((await delRes.json()).wasCurrent).toBe(false)

    // The revoked device is now locked out, and A still works.
    expect(
      (await request.get('/api/auth/sessions', probe(tokenB))).status(),
    ).toBe(401)
    expect(
      (await request.get('/api/auth/sessions', probe(tokenA))).status(),
    ).toBe(200)
  })

  test('revoking a session you do not own returns 404', async ({ request }) => {
    const { token: victimToken } = await apiLogin(request, TEST_USER)
    const { token: attackerToken } = await apiLogin(request, TEST_SELLER)

    const victimList = await request.get(
      '/api/auth/sessions',
      probe(victimToken),
    )
    const victimSessionId = (await victimList.json()).sessions[0].id

    const res = await request.delete(
      `/api/auth/sessions/${victimSessionId}`,
      probe(attackerToken),
    )
    expect(res.status()).toBe(404)

    // The victim session must still be alive — the attacker changed nothing.
    expect(
      (await request.get('/api/auth/sessions', probe(victimToken))).status(),
    ).toBe(200)
  })

  test('revoke-all signs out other devices but keeps the caller signed in', async ({
    request,
  }) => {
    const { token: tokenA } = await apiLogin(request)
    const { token: tokenB } = await apiLogin(request)

    const res = await request.post(
      '/api/auth/sessions/revoke-all',
      probe(tokenA),
    )
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.count).toBeGreaterThanOrEqual(1)
    expect(body.signedOutCurrent).toBe(false)

    expect(
      (await request.get('/api/auth/sessions', probe(tokenB))).status(),
    ).toBe(401)
    expect(
      (await request.get('/api/auth/sessions', probe(tokenA))).status(),
    ).toBe(200)

    // Only the caller is left standing.
    const { sessions } = await (
      await request.get('/api/auth/sessions', probe(tokenA))
    ).json()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].isCurrent).toBe(true)
  })

  test('revoke-all with includeCurrent signs out every device', async ({
    request,
  }) => {
    const { token: tokenA } = await apiLogin(request)
    const { token: tokenB } = await apiLogin(request)

    const res = await request.post('/api/auth/sessions/revoke-all', {
      headers: auth(tokenA),
      data: { includeCurrent: true },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).signedOutCurrent).toBe(true)

    expect(
      (await request.get('/api/auth/sessions', probe(tokenA))).status(),
    ).toBe(401)
    expect(
      (await request.get('/api/auth/sessions', probe(tokenB))).status(),
    ).toBe(401)
  })

  test('a revoked session cannot mint an OAuth authorization code', async ({
    request,
  }) => {
    // /api/oauth/code hands out a code that a third party trades for an access
    // token, so it must respect revocation. It used to read the decoded JWT
    // straight off the request context, which outlives both revocation and bans.
    const clientId = process.env.OAUTH_DASSAH_CLIENT_ID || 'dassah'
    const redirectUri = (
      process.env.OAUTH_DASSAH_REDIRECT_URIS ||
      'http://localhost:3001/api/auth/sso/callback'
    ).split(',')[0]

    const { token } = await apiLogin(request)
    const codeRequest = () =>
      request.post('/api/oauth/code', {
        headers: auth(token),
        data: { client_id: clientId, redirect_uri: redirectUri },
      })

    // Sanity: a live session really can mint a code, so the assertion below
    // fails for the right reason rather than a misconfigured client.
    expect((await codeRequest()).status()).toBe(200)

    await request.post('/api/auth/sessions/revoke-all', {
      headers: auth(token),
      data: { includeCurrent: true },
    })

    expect((await codeRequest()).status()).toBe(401)
  })

  test('revoking your own session logs you out', async ({ request }) => {
    const { token } = await apiLogin(request)

    const { sessions } = await (
      await request.get('/api/auth/sessions', probe(token))
    ).json()
    const current = sessions.find((s: any) => s.isCurrent)

    const res = await request.delete(
      `/api/auth/sessions/${current.id}`,
      probe(token),
    )
    expect(res.status()).toBe(200)
    expect((await res.json()).wasCurrent).toBe(true)

    expect(
      (await request.get('/api/auth/sessions', probe(token))).status(),
    ).toBe(401)
  })
})
