// POST /api/auth/checkout-otp/verify
// Step 2 of inline checkout auth.
// Verifies the OTP, auto-creates an account for new users, generates JWT tokens,
// sets httpOnly cookies and returns the user — identical cookie shape to /api/auth/login.

import { z } from 'zod'
import { getRequestIP, getRequestHeader, setCookie } from 'h3'
import { randomBytes } from 'crypto'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
})

const normalizeUsername = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)

const createUniqueUsername = async (seed: string): Promise<string> => {
  const fallback = `user_${Math.random().toString(36).slice(2, 8)}`
  let base = normalizeUsername(seed) || fallback
  if (base.length < 3) base = `${base}${Math.random().toString(36).slice(2, 5)}`
  base = base.slice(0, 20)

  let candidate = base
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.profile.findFirst({ where: { username: candidate }, select: { id: true } })
    if (!exists) return candidate
    const suffix = Math.random().toString(36).slice(2, 5)
    candidate = `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`
  }
  return `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = schema.parse(await readBody(event))
    const email = body.email.toLowerCase()
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    // Verify OTP — consumes the entry (one-time use)
    const entry = otpStore.verify(email, body.code)
    if (!entry) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid or expired verification code' })
    }

    // ── Resolve user ─────────────────────────────────────────────────────────
    let user = await prisma.profile.findUnique({ where: { email } })

    if (!user) {
      // Auto-register: name from OTP entry (sent in step 1) or body fallback
      const displayName = entry.name || body.name || email.split('@')[0]!
      const username = await createUniqueUsername(displayName.split(' ')[0] || email.split('@')[0]!)
      const passwordHash = await hashPassword(crypto.randomUUID() + crypto.randomUUID())

      user = await prisma.profile.create({
        data: {
          id: crypto.randomUUID(),
          email,
          username,
          password_hash: passwordHash,
          role: 'user',
          email_verified: true,           // proven via OTP
          email_verified_at: new Date(),
        },
      })

      // Send password setup link so they can set a real password later (7-day window)
      const resetToken = randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          user_id: user.id,
          token: resetToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
      const config = useRuntimeConfig()
      const appUrl = (config.public.baseURL as string) || 'http://localhost:3000'
      const appName = (config.public.appName as string) || 'MarketX'

      sendPasswordResetEmail(email, resetToken, appUrl).catch(() => {})
      sendWelcomeEmail(email, username, appName).catch(() => {})
    } else if (!user.email_verified) {
      // Existing unverified user — mark verified now
      user = await prisma.profile.update({
        where: { id: user.id },
        data: { email_verified: true, email_verified_at: new Date() },
      })
    }

    // ── Generate session tokens ───────────────────────────────────────────────
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role)

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ip: ipAddress,
        userAgent,
        device: 'Web',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        email: user.email,
        event_type: 'CHECKOUT_OTP_LOGIN',
        reason: entry.isNewUser ? 'Auto-registered via checkout OTP' : 'Logged in via checkout OTP',
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true,
      },
    })

    // ── Set httpOnly cookies (same shape as /api/auth/login) ─────────────────
    const isProd = process.env.NODE_ENV === 'production'
    setCookie(event, 'accessToken', accessToken, {
      httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 15 * 60,
    })
    setCookie(event, 'refreshToken', refreshToken, {
      httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60,
    })

    return {
      success: true,
      isNewUser: entry.isNewUser ?? false,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? '',
        emailVerified: user.email_verified,
        role: user.role,
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Verification failed. Please try again.' })
  }
})
