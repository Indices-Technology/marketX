// POST /api/auth/checkout-otp/send
// Step 1 of inline checkout auth.
// Checks if the email already has an account.
//   - Existing user → generate OTP, send it, return { isNewUser: false }
//   - New user      → generate OTP, store name+phone for later, return { isNewUser: true }
// The account is NOT created here — creation happens on verify so we don't
// leave ghost accounts from people who abandon the OTP step.

import { z } from 'zod'
import { getRequestIP, getRequestHeader } from 'h3'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
})

const OTP_RATE_KEY = 'checkout-otp'

export default defineEventHandler(async (event) => {
  try {
    const body = schema.parse(await readBody(event))
    const email = body.email.toLowerCase()
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'

    // Basic rate limit: 5 sends per 15 min per IP
    const rateLimit = checkRateLimit(`${OTP_RATE_KEY}:${ipAddress}`, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5,
      lockoutMs: 15 * 60 * 1000,
      keyPrefix: OTP_RATE_KEY,
    })
    if (!rateLimit.allowed) {
      throw createError({ statusCode: 429, statusMessage: 'Too many requests. Try again later.' })
    }

    const existing = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
    const isNewUser = !existing

    // 6-digit numeric OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))

    otpStore.set(email, {
      code,
      isNewUser,
      name: body.name,
      phone: body.phone,
    })

    const config = useRuntimeConfig()
    const appName = (config.public.appName as string) || 'MarketX'

    await sendOtpEmail(email, code, isNewUser, appName).catch((err) => {
      console.error('[checkout-otp/send] email failed:', err.message)
    })

    return { success: true, isNewUser }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to send verification code' })
  }
})
