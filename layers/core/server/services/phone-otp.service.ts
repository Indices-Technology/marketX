/**
 * Phone OTP Service
 *
 * Sign up / log in with a phone number, verified via a WhatsApp-delivered
 * one-time code (falls back to inline logging if WhatsApp isn't configured —
 * see server/queues/whatsapp.queue.ts). Mirrors checkout-otp.service.ts's
 * shape (send/verify/auto-register/session), keyed by phone instead of email.
 *
 * Phone is a second, independent identity on Profile — strict one-phone-per-
 * account (no shared-phone signups), same rule as email today. A phone-only
 * signup gets a deterministic placeholder email (Profile.email stays NOT NULL
 * DB-wide; widening that is a much bigger change than this feature needs) —
 * real email can be added later via account settings.
 */

import { authRepository } from '../repositories/auth.repository'
import { createUniqueUsername } from './checkout-otp.service'
import { phoneOtpStore } from '~~/server/utils/auth/phoneOtpStore'
import { whatsappQueue } from '~~/server/queues/whatsapp.queue'
import { bust } from '~~/server/utils/cache'

const OTP_RATE_KEY = 'phone-otp'
const WHATSAPP_OTP_TEMPLATE = 'marketx_verification'

/** Deterministic placeholder so Profile.email (NOT NULL, unique) can stay filled
 *  for phone-only signups without touching every email-assuming callsite. */
function placeholderEmail(phone: string): string {
  return `phone_${phone.replace(/\D/g, '')}@phone.marketx.africa`
}

// ── Step 1: Send OTP ─────────────────────────────────────────────────────────

export interface SendPhoneOtpResult {
  isNewUser: boolean
}

export async function sendPhoneOtp(
  phone: string,
  ipAddress: string,
): Promise<SendPhoneOtpResult> {
  const rateLimit = await checkRateLimitAsync(`${OTP_RATE_KEY}:${ipAddress}`, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
    lockoutMs: 15 * 60 * 1000,
    keyPrefix: OTP_RATE_KEY,
  })
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Try again later.',
    })
  }

  const existing = await prisma.profile.findUnique({
    where: { phone },
    select: { id: true },
  })
  const isNewUser = !existing

  const code = String(Math.floor(100000 + Math.random() * 900000))
  await phoneOtpStore.set(phone, { code, isNewUser })

  whatsappQueue.enqueue({
    to: phone,
    templateName: WHATSAPP_OTP_TEMPLATE,
    languageCode: 'en_US',
    params: [code, 'MarketX login'],
    buttonParam: code,
    type: 'AUTHENTICATION',
  })

  return { isNewUser }
}

// ── Step 2: Verify OTP ────────────────────────────────────────────────────────

export interface VerifyPhoneOtpResult {
  isNewUser: boolean
  accessToken: string
  refreshToken: string
  user: {
    id: string
    phone: string
    username: string
    phoneVerified: boolean
    role: string
    // Included so this shape is a drop-in IAuthUser on the client (which
    // requires email/emailVerified) without widening that shared type —
    // email is the placeholder, real for phone-only accounts.
    email: string
    emailVerified: boolean
  }
}

export async function verifyPhoneOtp(
  phone: string,
  code: string,
  ipAddress: string,
  userAgent: string,
): Promise<VerifyPhoneOtpResult> {
  // 1. Validate OTP (one-time use — consumed on verify)
  const entry = await phoneOtpStore.verify(phone, code)
  if (!entry) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired verification code',
    })
  }

  // 2. Resolve or create user
  let user = await prisma.profile.findUnique({ where: { phone } })

  if (!user) {
    const username = await createUniqueUsername(`user_${phone.slice(-6)}`)
    const passwordHash = await hashPassword(
      crypto.randomUUID() + crypto.randomUUID(),
    )

    user = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        email: placeholderEmail(phone),
        phone,
        username,
        password_hash: passwordHash,
        role: 'user',
        phone_verified: true,
        phone_verified_at: new Date(),
      },
    })
  } else if (!user.phone_verified) {
    user = await prisma.profile.update({
      where: { id: user.id },
      data: { phone_verified: true, phone_verified_at: new Date() },
    })
  }

  // 2b. Moderation gate — same as checkout-otp/login: this mints a full
  // session, so it's a sign-in door and has to honour bans.
  const restriction = getAccountRestriction(user)
  if (restriction) {
    throw createError({ statusCode: 403, statusMessage: restriction })
  }

  // 3. Create session
  const sessionId = crypto.randomUUID()
  const { accessToken, refreshToken } = generateTokens(
    user.id,
    user.email,
    user.role,
    sessionId,
  )

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken,
      ip: ipAddress,
      userAgent,
      device: 'Web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(),
    },
  })

  // 4. Audit log
  await authRepository.createAuditLog({
    userId: user.id,
    email: user.email,
    eventType: 'PHONE_OTP_LOGIN',
    reason: entry.isNewUser
      ? 'Auto-registered via phone OTP'
      : 'Logged in via phone OTP',
    ipAddress,
    userAgent,
    success: true,
  })

  return {
    isNewUser: entry.isNewUser ?? false,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      phone: user.phone ?? phone,
      username: user.username ?? '',
      phoneVerified: user.phone_verified,
      role: user.role,
      email: user.email,
      emailVerified: user.email_verified,
    },
  }
}

// ── Attach a verified phone to an already-authenticated account ──────────────
//
// Unlike verifyPhoneOtp above (a login/signup door that mints a session and
// can auto-register a new account), this is for a logged-in user adding or
// re-verifying their own phone from account/seller settings. It never creates
// a Profile row or a session — it only ever updates the caller's own row, and
// 409s if the number is already claimed by someone else (Profile.phone is
// @unique). This becomes the SAME phone/phone_verified fields everything else
// (login, WhatsApp notifications) reads — by design there's one verified phone
// per account, not a separate notification-only number.

export interface AttachPhoneResult {
  phone: string
  phoneVerified: boolean
}

export async function attachVerifiedPhone(
  userId: string,
  phone: string,
  code: string,
  ipAddress: string,
  userAgent: string,
): Promise<AttachPhoneResult> {
  const entry = await phoneOtpStore.verify(phone, code)
  if (!entry) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired verification code',
    })
  }

  const existing = await prisma.profile.findUnique({
    where: { phone },
    select: { id: true },
  })
  if (existing && existing.id !== userId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This phone number is already linked to another account',
    })
  }

  const user = await prisma.profile.update({
    where: { id: userId },
    data: { phone, phone_verified: true, phone_verified_at: new Date() },
    select: { email: true, phone: true, phone_verified: true },
  })

  await bust(`profile:own:${userId}`)

  await authRepository.createAuditLog({
    userId,
    email: user.email,
    eventType: 'PHONE_VERIFIED_ATTACH',
    reason: 'Verified phone attached to existing account from settings',
    ipAddress,
    userAgent,
    success: true,
  })

  return { phone: user.phone!, phoneVerified: user.phone_verified }
}
