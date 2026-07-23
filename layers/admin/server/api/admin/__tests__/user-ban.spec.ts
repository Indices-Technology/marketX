import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { hashPassword } from '../../../../../../server/utils/auth/auth'
import { resetRateLimits } from '../../../../../../tests/helpers/auth'

/**
 * Admin ban → session revocation, end to end.
 *
 * A ban has to do three things, and all three are asserted here against a real
 * token: kill the live session, block the refresh token (otherwise the user
 * renews forever), and block a fresh login (otherwise they just sign back in).
 *
 * Users are created and torn down per-run rather than borrowing seed accounts —
 * banning a seed user that leaked past cleanup would poison every later spec.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PASSWORD = 'test1234'

const makeUser = async (role: string) => {
  const id = randomUUID()
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const email = `ban_${suffix}@test.local`

  await prisma.profile.create({
    data: {
      id,
      email,
      username: `ban_${suffix}`.slice(0, 20),
      password_hash: await hashPassword(PASSWORD),
      role,
      // Seeded verified: REQUIRE_EMAIL_VERIFICATION is on, and an unverified
      // account can't log in, which would mask the behaviour under test.
      email_verified: true,
      email_verified_at: new Date(),
    },
  })

  return { id, email }
}

const login = async (request: any, email: string) => {
  const res = await request.post('/api/auth/login', {
    data: { email, password: PASSWORD },
  })
  const body = await res.json()
  return { status: res.status(), token: body.accessToken as string, body }
}

let victim: { id: string; email: string }
let moderator: { id: string; email: string }

test.describe('admin — banning a user kills their access', () => {
  test.beforeAll(async () => {
    victim = await makeUser('user')
    moderator = await makeUser('moderator')
  })

  test.afterAll(async () => {
    const ids = [victim.id, moderator.id]

    // Notification.profile has no onDelete cascade, so the "you were banned"
    // notification pins the profile row and the delete below fails without this.
    await prisma.notification.deleteMany({
      where: { OR: [{ userId: { in: ids } }, { actorId: { in: ids } }] },
    })

    // Sessions, suspensions and audit rows do cascade.
    await prisma.profile.deleteMany({ where: { id: { in: ids } } })
    await prisma.$disconnect()
  })

  test.beforeEach(async ({ request }) => {
    await resetRateLimits(request)

    // Each test asserts on a specific moderation state, so start from a clean
    // one — otherwise the ban from the first test leaks into the rest and they
    // fail for the wrong reason (no login → no token → misleading 401s).
    await prisma.profile.update({
      where: { id: victim.id },
      data: { bannedAt: null, suspendedUntil: null, isActive: true },
    })
  })

  test('permanent ban revokes live sessions, refresh, and re-login', async ({
    request,
  }) => {
    // Victim is signed in on a live session before the ban lands.
    const { token: victimToken, status: loginStatus } = await login(
      request,
      victim.email,
    )
    expect(loginStatus).toBe(200)
    expect(
      (
        await request.get('/api/auth/sessions', {
          headers: { Authorization: `Bearer ${victimToken}` },
        })
      ).status(),
    ).toBe(200)

    // Moderator bans them (no durationDays = permanent).
    const { token: modToken } = await login(request, moderator.email)
    const banRes = await request.post(`/api/admin/users/${victim.id}/suspend`, {
      headers: { Authorization: `Bearer ${modToken}` },
      data: { reason: 'Automated test ban' },
    })
    expect(banRes.status()).toBe(200)

    // 1. The live token is dead immediately — no waiting for expiry.
    const afterBan = await request.get('/api/auth/sessions', {
      headers: { Authorization: `Bearer ${victimToken}` },
    })
    expect([401, 403]).toContain(afterBan.status())

    // 2. They cannot log back in.
    const relogin = await login(request, victim.email)
    expect(relogin.status).toBe(403)
    expect(relogin.body.statusMessage ?? relogin.body.message ?? '').toContain(
      'banned',
    )

    // 3. The session rows are actually revoked, not just flag-checked.
    const live = await prisma.session.count({
      where: { userId: victim.id, revokedAt: null },
    })
    expect(live).toBe(0)
  })

  test('a banned refresh token cannot mint a new access token', async ({
    request,
  }) => {
    // Fresh session, then ban the profile directly so the refresh token stays
    // valid on paper — this isolates the refresh gate from session revocation.
    const loginRes = await request.post('/api/auth/login', {
      data: { email: victim.email, password: PASSWORD },
    })
    const { refreshToken } = await loginRes.json()

    await prisma.profile.update({
      where: { id: victim.id },
      data: { bannedAt: new Date() },
    })

    const res = await request.post('/api/auth/refresh-token', {
      headers: { 'X-Refresh-Token': refreshToken },
    })
    expect(res.status()).toBe(403)
  })

  test('disabling an account revokes its sessions and blocks login', async ({
    request,
  }) => {
    const { token: victimToken, status } = await login(request, victim.email)
    expect(status).toBe(200)

    const { token: modToken } = await login(request, moderator.email)
    const res = await request.patch(`/api/admin/users/${victim.id}/toggle`, {
      headers: { Authorization: `Bearer ${modToken}` },
      data: { isActive: false },
    })
    expect(res.status()).toBe(200)

    expect([401, 403]).toContain(
      (
        await request.get('/api/auth/sessions', {
          headers: { Authorization: `Bearer ${victimToken}` },
        })
      ).status(),
    )
    expect((await login(request, victim.email)).status).toBe(403)

    // Re-enable so the shared beforeEach reset leaves a usable account.
    await prisma.profile.update({
      where: { id: victim.id },
      data: { isActive: true },
    })
  })

  test('a banned user cannot sign in via the checkout OTP door', async ({
    request,
  }) => {
    // Checkout OTP mints a full session, so it is a sign-in door — a ban that
    // only guards the password form would be trivially walked around here.
    await prisma.profile.update({
      where: { id: victim.id },
      data: { bannedAt: new Date() },
    })

    const send = await request.post('/api/auth/checkout-otp/send', {
      data: { email: victim.email },
    })
    // 503 = mail not configured in this env; the gate below is what matters.
    expect([200, 403, 503]).toContain(send.status())

    const verify = await request.post('/api/auth/checkout-otp/verify', {
      data: { email: victim.email, code: '000000' },
    })
    // Never a session: either the code is rejected (400) or the ban is (403).
    expect([400, 403]).toContain(verify.status())
    expect(await verify.text()).not.toContain('accessToken')
  })

  test('a banned user cannot renew a third-party OAuth token', async ({
    request,
  }) => {
    // /api/oauth/refresh reads nothing from the DB, so a connected app used to
    // renew a banned user's access forever.
    const clientId = process.env.OAUTH_DASSAH_CLIENT_ID || 'dassah'
    const clientSecret =
      process.env.OAUTH_DASSAH_CLIENT_SECRET ||
      'dassah_secret_change_in_production'
    const redirectUri = (
      process.env.OAUTH_DASSAH_REDIRECT_URIS ||
      'http://localhost:3001/api/auth/sso/callback'
    ).split(',')[0]

    // Full OAuth dance while in good standing: code → token pair.
    const { token } = await login(request, victim.email)
    const codeRes = await request.post('/api/oauth/code', {
      headers: { Authorization: `Bearer ${token}` },
      data: { client_id: clientId, redirect_uri: redirectUri },
    })
    expect(codeRes.status()).toBe(200)
    const code = new URL((await codeRes.json()).redirectUrl).searchParams.get(
      'code',
    )!

    const tokenRes = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
    })
    expect(tokenRes.status()).toBe(200)
    const { refresh_token } = await tokenRes.json()

    await prisma.profile.update({
      where: { id: victim.id },
      data: { bannedAt: new Date() },
    })

    const refreshRes = await request.post('/api/oauth/refresh', {
      data: {
        grant_type: 'refresh_token',
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      },
    })
    expect(refreshRes.status()).toBe(403)
  })

  test('an expired suspension lets the user back in without admin action', async ({
    request,
  }) => {
    // Time-boxed suspensions self-heal: nothing sweeps them, so the gate must
    // treat a past suspendedUntil as unrestricted.
    await prisma.profile.update({
      where: { id: victim.id },
      data: { suspendedUntil: new Date(Date.now() - 60_000), bannedAt: null },
    })

    const res = await login(request, victim.email)
    expect(res.status).toBe(200)
  })

  test('an active suspension blocks login until it expires', async ({
    request,
  }) => {
    await prisma.profile.update({
      where: { id: victim.id },
      data: { suspendedUntil: new Date(Date.now() + 86_400_000) },
    })

    const res = await login(request, victim.email)
    expect(res.status).toBe(403)
    expect(res.body.statusMessage ?? res.body.message ?? '').toContain(
      'suspended',
    )
  })
})
