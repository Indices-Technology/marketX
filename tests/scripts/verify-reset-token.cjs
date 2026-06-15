/**
 * End-to-end proof that password-reset tokens are single-use + expiry-enforced.
 * Tokens are emailed (not returned by the API), so we seed them directly via
 * Prisma and exercise the real /api/auth/reset-password endpoint.
 *
 * Uses a non-critical seed buyer and restores its password hash afterward.
 * Run with the dev server up:  node tests/scripts/verify-reset-token.cjs
 */
require('dotenv').config()
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

// Prisma 7 requires the driver adapter (mirrors server/utils/db.ts)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const BASE = 'http://localhost:3000'
const EMAIL = 'bayo@peppr.test' // seed buyer, unused by the test suites
const STRONG = 'NewValidPass123!'

async function resetPassword(token) {
  const res = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: STRONG, confirmPassword: STRONG }),
  })
  return res.status
}

function check(label, actual, expected) {
  const ok = actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} (got ${actual}, expected ${expected})`)
  return ok
}

;(async () => {
  const user = await prisma.profile.findUnique({ where: { email: EMAIL } })
  if (!user) throw new Error(`Seed user ${EMAIL} not found`)
  const originalHash = user.password_hash
  let allOk = true

  try {
    // 1. Valid token → reset succeeds (200)
    const validToken = randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token: validToken, expires_at: new Date(Date.now() + 15 * 60 * 1000) },
    })
    allOk &= check('valid token resets password', await resetPassword(validToken), 200)

    // 2. Replay the SAME token → rejected (400) — single-use
    allOk &= check('used token cannot be replayed', await resetPassword(validToken), 400)

    // 3. Expired token → rejected (400) — expiry enforced
    const expiredToken = randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token: expiredToken, expires_at: new Date(Date.now() - 60 * 1000) },
    })
    allOk &= check('expired token is rejected', await resetPassword(expiredToken), 400)
  } finally {
    // Restore original password + clean up test tokens
    await prisma.profile.update({ where: { id: user.id }, data: { password_hash: originalHash } })
    await prisma.passwordResetToken.deleteMany({ where: { user_id: user.id } })
    await prisma.$disconnect()
  }

  console.log(allOk ? '\nALL PASS' : '\nFAILURES PRESENT')
  process.exit(allOk ? 0 : 1)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
