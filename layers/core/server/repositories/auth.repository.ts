/**
 * Auth Repository
 * * Centralizes all authentication-related database operations.
 * Implements secure token generation, session tracking, and audit logging.
 */

import { randomBytes } from 'crypto'

export const authRepository = {
  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  /**
   * Create email verification token
   * Uses cryptographically secure random bytes
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex')

    await prisma.emailVerificationToken.create({
      data: {
        user_id: userId,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    return token
  },

  /**
   * Verify email token and update user profile
   */
  async verifyEmailToken(token: string): Promise<string | null> {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    })

    if (!record) return null

    // Atomically claim the token only if still unused AND not expired — same
    // single-use + expiry guarantee as the password-reset path, race-safe.
    const claimed = await prisma.emailVerificationToken.updateMany({
      where: {
        id: record.id,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      data: { used_at: new Date() },
    })
    if (claimed.count === 0) return null

    // Mark the user profile as verified
    await prisma.profile.update({
      where: { id: record.user_id },
      data: { email_verified: true },
    })

    return record.user_id
  },

  // ============================================
  // PASSWORD RESET
  // ============================================

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex')

    await prisma.passwordResetToken.create({
      data: {
        user_id: userId,
        token,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    })

    return token
  },

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!record) return null
    if (new Date() > record.expires_at) return null
    if (record.used_at) return null

    return record.user_id
  },

  /**
   * Mark password reset token as used and invalidate others
   */
  async usePasswordResetToken(token: string): Promise<string | null> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!record) return null

    // Atomically claim the token ONLY if still unused AND not expired. This one
    // conditional update enforces single-use + expiry and is race-safe (two
    // concurrent resets with the same token can't both win — the loser matches
    // zero rows). Previously neither check was applied, so expired tokens still
    // worked and a used token could be replayed to reset the password again.
    const claimed = await prisma.passwordResetToken.updateMany({
      where: {
        id: record.id,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      data: { used_at: new Date() },
    })
    if (claimed.count === 0) return null

    // Invalidate any other unused tokens for this user (single live token)
    await prisma.passwordResetToken.updateMany({
      where: {
        user_id: record.user_id,
        id: { not: record.id },
        used_at: null,
      },
      data: { used_at: new Date() },
    })

    return record.user_id
  },

  // ============================================
  // FAILED LOGIN ATTEMPTS & ACCOUNT LOCKOUT
  // ============================================
  //
  // Redis (server/utils/auth/rateLimiter.ts) is the *enforcer* — it decides when
  // a login is throttled or locked. This table is a durable forensic ledger of
  // those failures: it survives Redis eviction/flush, is queryable by admins, and
  // powers brute-force monitoring. One row per email (upserted); cleared on a
  // successful login. All writes are best-effort — a bookkeeping failure must
  // never turn a 401 into a 500 or block a legitimate login.

  /**
   * Increment the failed-attempt counter for an email (one row per email).
   * Refreshes ip/user_agent/last_attempt_at so the row reflects the latest probe.
   */
  async recordFailedLoginAttempt(data: {
    email: string
    userId?: string
    ipAddress?: string
    userAgent?: string
  }) {
    const email = data.email.toLowerCase()
    return prisma.failedLoginAttempt
      .upsert({
        where: { email },
        update: {
          attempt_count: { increment: 1 },
          last_attempt_at: new Date(),
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          ...(data.userId ? { user_id: data.userId } : {}),
        },
        create: {
          email,
          user_id: data.userId,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          attempt_count: 1,
          last_attempt_at: new Date(),
        },
      })
      .catch((err) => {
        logger.logError('[authRepository.recordFailedLoginAttempt]', err)
        return null
      })
  },

  /**
   * Stamp the lockout window onto the email's row so admins/monitoring can see
   * a locked account without reading Redis. Mirrors the Redis lock's expiry.
   */
  async markAccountLocked(email: string, lockedUntil: Date) {
    const e = email.toLowerCase()
    return prisma.failedLoginAttempt
      .upsert({
        where: { email: e },
        update: { locked_until: lockedUntil, last_attempt_at: new Date() },
        create: {
          email: e,
          attempt_count: 0,
          locked_until: lockedUntil,
          last_attempt_at: new Date(),
        },
      })
      .catch((err) => {
        logger.logError('[authRepository.markAccountLocked]', err)
        return null
      })
  },

  /**
   * Clear the ledger for an email after a successful login (deleteMany so a
   * missing row is a no-op rather than a P2025 throw).
   */
  async clearFailedLoginAttempts(email: string) {
    return prisma.failedLoginAttempt
      .deleteMany({ where: { email: email.toLowerCase() } })
      .catch((err) => {
        logger.logError('[authRepository.clearFailedLoginAttempts]', err)
        return null
      })
  },

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Create a new audit log entry (Missing method restored)
   */
  async createAuditLog(data: {
    userId: string
    email: string
    eventType: string
    reason?: string
    ipAddress?: string
    userAgent?: string
    success: boolean
  }) {
    return prisma.auditLog.create({
      data: {
        email: data.email,
        user_id: data.userId,
        event_type: data.eventType,
        reason: data.reason,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: data.success,
      },
    })
  },

  async getUserAuditLogs(userId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    })
  },

  async getAuditLogsByEvent(eventType: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: { event_type: eventType },
      orderBy: { created_at: 'desc' },
      take: limit,
    })
  },

  // ============================================
  // CLEANUP TASKS
  // ============================================

  async cleanupExpiredTokens() {
    const now = new Date()
    await Promise.all([
      prisma.emailVerificationToken.deleteMany({
        where: { expires_at: { lt: now } },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expires_at: { lt: now } },
      }),
    ])
  },

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSession(data: {
    id?: string
    userId: string
    refreshToken: string
    ip: string
    userAgent: string
    device?: string
    country?: string
  }) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return prisma.session.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        userId: data.userId,
        refreshToken: data.refreshToken,
        ip: data.ip,
        userAgent: data.userAgent,
        device: data.device,
        country: data.country,
        expiresAt,
        lastUsedAt: new Date(),
      },
    })
  },

  // Compatibility alias
  async getSession(refreshToken: string) {
    return this.getSessionByRefreshToken(refreshToken)
  },

  async getSessionByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
    })
  },

  async getSessionById(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
    })
  },

  /**
   * Live sessions for a user — not revoked AND not past expiry.
   *
   * The expiry filter matters: requireAuth rejects a token whose session is
   * past expiresAt, so an expired row is already dead. Listing it would show
   * the user a "device" they cannot actually be signed in on, and invite them
   * to revoke something that is not a threat.
   */
  async getUserSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        device: true,
        country: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    })
  },

  async revokeSession(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })
  },

  /**
   * Revoke one session, but only if it belongs to `userId`.
   *
   * Ownership is enforced in the WHERE clause rather than by a read-then-write
   * check, so a caller cannot revoke another account's session by guessing its
   * id. Returns false when the session is missing, already revoked, or owned by
   * someone else — all three are indistinguishable to the caller by design.
   */
  async revokeSessionForUser(sessionId: string, userId: string) {
    const result = await prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count > 0
  },

  async revokeAllSessions(userId: string) {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count
  },

  /**
   * Revoke every live session for a user except one — the "sign out everywhere
   * else" action. Passing no `exceptSessionId` signs out every device.
   */
  async revokeOtherSessions(userId: string, exceptSessionId?: string) {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    })
    return result.count
  },

  async updateSessionLastUsed(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    })
  },

  async deleteExpiredSessions() {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return result.count
  },

  async countActiveSessions(userId: string) {
    return prisma.session.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
  },

  async getOldSessions(daysOld: number = 7) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    return prisma.session.findMany({
      where: { createdAt: { lt: cutoffDate } },
    })
  },
}
