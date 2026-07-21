// server/utils/auth/accountStatus.ts

/**
 * Account moderation gate.
 *
 * One place decides whether a moderated account may hold a session, so the
 * three doors into the app — login, requireAuth, and token refresh — can never
 * drift apart on what "banned" means. Revoking sessions at ban time is not
 * enough on its own: without these checks the user simply logs in again and
 * mints a fresh session.
 */

export interface AccountModerationState {
  bannedAt?: Date | null
  suspendedUntil?: Date | null
  isActive?: boolean | null
}

/**
 * Returns a human-readable reason when the account is barred from holding a
 * session, or null when it is in good standing.
 *
 * A suspension whose `suspendedUntil` has passed self-heals — it simply stops
 * matching here, so no cron job is needed to release time-boxed suspensions.
 * A ban (`bannedAt` set, `suspendedUntil` null) never expires and is only
 * cleared by an admin lifting it.
 */
export function getAccountRestriction(
  account: AccountModerationState,
): string | null {
  if (account.bannedAt) {
    return 'Your account has been permanently banned.'
  }

  // Compared against false, not falsy: callers may pass a partial record where
  // isActive is absent, and an unknown flag must never lock someone out.
  if (account.isActive === false) {
    return 'Your account has been disabled. Contact support if you believe this is an error.'
  }

  if (account.suspendedUntil && account.suspendedUntil > new Date()) {
    const until = account.suspendedUntil.toISOString().split('T')[0]
    return `Your account is suspended until ${until}.`
  }

  return null
}
