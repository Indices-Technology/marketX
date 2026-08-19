// POST /api/__test__/reset-rate-limits
// Dev/test only — resets rate limit counters and failed-login ledgers between
// test runs. Returns 403 in production so it cannot be called on live infrastructure.
//
// resetAllRateLimits() only clears the in-memory fallback store — it's a
// no-op once Redis is configured (checkRateLimitAsync prefers Redis whenever
// it's available, which is true in this dev environment too). Without the
// explicit per-identifier clears below, a handful of failed/malformed login
// attempts during manual debugging silently locks the seeded test accounts
// out for the full 30-minute lockout window, and this endpoint appears to
// have worked (200 OK) while doing nothing for the account that's actually stuck.

import {
  resetAllRateLimits,
  clearRateLimit,
} from '~~/server/utils/auth/rateLimiter'
import { RATE_LIMITS } from '~~/server/config/rateLimits'
import { authRepository } from '~~/layers/core/server/repositories/auth.repository'
import { getClientIP } from '~~/server/layers/shared/utils/security'

// Seed accounts from prisma/seed.ts — the ones test helpers log in as.
const TEST_EMAILS = ['ada@peppr.test', 'balogun@peppr.test']

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not available in production',
    })
  }
  resetAllRateLimits()

  await Promise.all(
    TEST_EMAILS.map(async (email) => {
      clearRateLimit(`login:${email}`, RATE_LIMITS.LOGIN.keyPrefix)
      await authRepository.clearFailedLoginAttempts(email)
    }),
  )

  // IP-keyed limits live in Redis too, and registration only allows 3 per
  // hour — without this, a second run of the auth suite fails on the register
  // happy path for reasons that have nothing to do with the code under test.
  const ip = getClientIP(event)
  clearRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER.keyPrefix)
  clearRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER_SELLER.keyPrefix)
  clearRateLimit(`check-username:${ip}`, RATE_LIMITS.CHECK_USERNAME.keyPrefix)

  return { success: true }
})
