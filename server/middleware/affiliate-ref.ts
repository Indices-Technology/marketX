import { getQuery, getHeader, parseCookies, setCookie } from 'h3'
import {
  AFFILIATE_REF_COOKIE,
  AFFILIATE_REF_TTL_SEC,
  isValidAffiliateRef,
  userRefKey,
} from '~~/server/utils/affiliate-ref'
import { jwtVerify } from '~~/server/utils/auth/auth'
import { redis } from '~~/server/utils/cache'

// Capture an affiliate ?ref=CODE the moment it appears on ANY request and persist
// it in three durability tiers:
//   1. HTTP-only cookie  — same browser, XSS-safe, JS-independent
//   2. Redis, keyed by userId (if logged in) — follows the buyer ACROSS DEVICES
// (localStorage capture on the client is the third tier). Read back at checkout
// via resolveAffiliateCode(). No-op when there's no valid ?ref.
//
// NB: auth.global only populates event.context.user for /api routes, but ?ref lands
// on PAGE requests — so we verify the token ourselves here to learn the userId.
export default defineEventHandler(async (event) => {
  const ref = getQuery(event).ref
  if (typeof ref !== 'string' || !isValidAffiliateRef(ref)) return

  // 1. Durable same-browser cookie
  setCookie(event, AFFILIATE_REF_COOKIE, ref, {
    maxAge: AFFILIATE_REF_TTL_SEC,
    httpOnly: true,
    sameSite: 'lax',
    secure: !process.dev,
    path: '/',
  })

  // 2. Cross-device: bind to the account if the visitor is logged in
  if (!redis) return
  try {
    let token = getHeader(event, 'authorization')?.replace('Bearer ', '')
    if (!token) token = parseCookies(event).accessToken
    if (!token) return
    const decoded = jwtVerify(token)
    if (decoded?.userId) {
      await redis.set(userRefKey(decoded.userId), ref)
      await redis.expire(userRefKey(decoded.userId), AFFILIATE_REF_TTL_SEC)
    }
  } catch {
    /* not logged in / invalid token — the cookie still covers same-browser */
  }
})
