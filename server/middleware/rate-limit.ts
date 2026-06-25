/**
 * API-wide rate limiting middleware — Redis-backed in production, in-memory in dev.
 *
 * Tiers:
 *  - Auth endpoints (/api/auth/*): handled by auth rateLimiter — skipped here
 *  - Upload endpoints (/api/upload/*): 10 req/min (expensive)
 *  - Public read endpoints: 300 req/min per IP (feed/home pages fire ~8 calls each,
 *    and mobile carrier-NAT means many real users share one IP — 120 was too tight)
 *  - Authenticated requests: 300 req/min per userId
 */

import { redis } from '../utils/cache'

// ─── In-memory fallback (dev) ─────────────────────────────────────────────────

interface WindowRecord {
  count: number
  windowStart: number
}
const _store = new Map<string, WindowRecord>()

setInterval(
  () => {
    const now = Date.now()
    for (const [key, rec] of _store.entries()) {
      if (now - rec.windowStart > 120_000) _store.delete(key)
    }
  },
  5 * 60 * 1000,
)

function checkInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const rec = _store.get(key)
  if (!rec || now - rec.windowStart >= windowMs) {
    _store.set(key, { count: 1, windowStart: now })
    return true
  }
  rec.count++
  return rec.count <= limit
}

// ─── Redis implementation ─────────────────────────────────────────────────────

async function checkRedis(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const count = await redis!.incr(key)
  if (count === 1) await redis!.expire(key, Math.ceil(windowMs / 1000))
  return count <= limit
}

async function check(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (redis) {
    try {
      return await checkRedis(key, limit, windowMs)
    } catch {
      /* fallthrough */
    }
  }
  return checkInMemory(key, limit, windowMs)
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    if (process.dev) return

    const path = event.node.req.url ?? ''

    if (!path.startsWith('/api/')) return
    if (path.startsWith('/api/auth/')) return
    if (path.startsWith('/api/oauth/')) return
    if (path.startsWith('/api/commerce/payments/webhook')) return
    // Internal Dassah endpoints — authenticated by X-Dassah-Internal key, not rate-limited
    if (path.startsWith('/api/ai/context/')) return
    if (path.startsWith('/api/ai/embeddings/')) return
    if (path.startsWith('/api/ai/profile/')) return
    if (path.startsWith('/api/ai/logs/')) return

    const ip =
      getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      getHeader(event, 'x-real-ip') ||
      'unknown'

    if (path.startsWith('/api/upload')) {
      if (!(await check(`rl:upload:${ip}`, 10, 60_000))) {
        setResponseHeader(event, 'Retry-After', 60)
        throw createError({ statusCode: 429, statusMessage: 'Too many uploads. Please wait a moment.' })
      }
      return
    }

    const userId = event.context?.user?.id
    if (userId) {
      if (!(await check(`rl:user:${userId}`, 300, 60_000))) {
        setResponseHeader(event, 'Retry-After', 60)
        throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please slow down.' })
      }
      return
    }

    if (!(await check(`rl:ip:${ip}`, 300, 60_000))) {
      setResponseHeader(event, 'Retry-After', 60)
      throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please slow down.' })
    }
  } catch (err) {
    if ((err as any)?.statusCode === 429) throw err
    console.error('[rate-limit]', err)
  }
})
