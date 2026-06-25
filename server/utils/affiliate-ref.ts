import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { redis } from './cache'

export const AFFILIATE_REF_COOKIE = 'mx_affiliate_ref'
export const AFFILIATE_REF_TTL_SEC = 60 * 60 * 24 * 30 // 30 days

export const isValidAffiliateRef = (ref: string): boolean =>
  /^[a-z0-9_-]{1,64}$/i.test(ref)

/** Redis key for an account-bound affiliate ref (cross-device attribution). */
export const userRefKey = (userId: string) => `affiliate:ref:${userId}`

/**
 * Resolve the affiliate code for an order, most-specific first:
 *   1. body code   — the buyer's latest client (localStorage) capture
 *   2. cookie      — server-set HTTP-only `?ref` cookie (same browser, JS-independent)
 *   3. account ref — Redis ref bound to the buyer's userId at click time
 *                    (follows them across devices on the same account)
 * All candidates are validated. Async because of the Redis lookup.
 */
export async function resolveAffiliateCode(
  event: H3Event,
  bodyCode?: string | null,
): Promise<string | undefined> {
  if (bodyCode && isValidAffiliateRef(bodyCode)) return bodyCode

  const cookie = getCookie(event, AFFILIATE_REF_COOKIE)
  if (cookie && isValidAffiliateRef(cookie)) return cookie

  const userId = event.context.user?.id
  if (userId && redis) {
    try {
      const bound = (await redis.get(userRefKey(userId))) as string | null
      if (bound && isValidAffiliateRef(bound)) return bound
    } catch {
      /* Redis unavailable — cookie/body already covered the common cases */
    }
  }
  return undefined
}
