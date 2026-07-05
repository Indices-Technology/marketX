/**
 * server/utils/cache.ts
 *
 * Thin Redis wrapper using Upstash.
 *
 * If UPSTASH_REDIS_REST_URL is not set (local dev without Redis),
 * every operation is a no-op and `remember()` always falls through
 * to the DB. Zero crashes, zero config required for dev.
 *
 * Usage:
 *   const data = await remember('feed:posts:page:0', 120, () => db query)
 *   await bust('feed:posts:page:0')
 *   await bust('feed:posts:page:*')   ← pattern bust (scans keys)
 */

import { Redis } from '@upstash/redis'

// ─── Client ──────────────────────────────────────────────────────────────────

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

// Only initialise Redis if credentials are present
export const redis = url && token ? new Redis({ url, token }) : null

if (!redis) {
  console.warn(
    '[cache] Upstash not configured — caching disabled (DB fallback active)',
  )
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Get a cached value, or run `fn` to compute it, store it, then return it.
 *
 * @param key   - Redis key (e.g. 'feed:posts:page:0')
 * @param ttl   - Seconds until the key expires
 * @param fn    - Async function that returns the fresh value from DB
 */
// In-process single-flight registry: concurrent misses on the SAME key share one
// `fn()` execution instead of each hammering the DB (cache-stampede protection).
const _inflight = new Map<string, Promise<unknown>>()

export async function remember<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  // ttl <= 0 is an explicit "bypass" (e.g. creator sees their own fresh content).
  // Never write with a non-positive TTL — Upstash `ex: 0` is invalid and would
  // otherwise risk a non-expiring key. Just compute fresh.
  if (!redis || ttl <= 0) return fn()

  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) return cached

    // Coalesce concurrent misses for this key into a single DB call + write.
    const existing = _inflight.get(key) as Promise<T> | undefined
    if (existing) return existing

    const compute = (async () => {
      const fresh = await fn()
      // Store as JSON string; Upstash SDK handles serialisation
      await redis.set(key, fresh, { ex: ttl })
      return fresh
    })()

    _inflight.set(key, compute)
    try {
      return await compute
    } finally {
      _inflight.delete(key)
    }
  } catch (err) {
    // Redis error → fall through to DB, never crash the request
    console.error('[cache] remember error:', err)
    return fn()
  }
}

// Single-flight registry for `once()` (write idempotency), kept separate from
// the read `remember` registry so their lifecycles never interfere.
const _onceInflight = new Map<string, Promise<unknown>>()

/**
 * Write-safe idempotency: run `fn` at most once per `key` within `ttl`, and
 * return the same result for repeat calls (e.g. a double-submitted order).
 *
 * Differs from `remember` in the ways that matter for WRITES:
 *  - On `fn` error it **rethrows** — it never retries and never caches a failure,
 *    so a genuinely failed operation can be safely re-attempted by the caller.
 *  - Redis get/set failures are swallowed (the op still runs exactly once,
 *    caller-scoped) so a Redis blip never blocks or double-runs a write.
 */
export async function once<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  // No store (or bypass) → run once in this request; no cross-request dedup.
  if (!redis || ttl <= 0) return fn()

  let prior: T | null = null
  try {
    prior = await redis.get<T>(key)
  } catch {
    /* Redis read blip — fall through and compute */
  }
  if (prior !== null && prior !== undefined) return prior

  // Coalesce concurrent duplicates in this process.
  const existing = _onceInflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const compute = (async () => {
    const fresh = await fn() // may throw → propagates (no retry, no cache)
    try {
      await redis!.set(key, fresh, { ex: ttl, nx: true })
    } catch {
      /* Redis write blip — result already produced; just return it */
    }
    return fresh
  })()

  _onceInflight.set(key, compute)
  try {
    return await compute
  } finally {
    _onceInflight.delete(key)
  }
}

/**
 * Delete one or more cache keys.
 * Accepts exact keys or a glob pattern (e.g. 'feed:posts:page:*').
 */
export async function bust(...keys: string[]): Promise<void> {
  if (!redis) return

  try {
    const resolved: string[] = []

    for (const key of keys) {
      if (key.includes('*')) {
        // Pattern bust — scan for matching keys then delete them
        let cursor = 0
        do {
          const [nextCursor, found] = await redis.scan(cursor, {
            match: key,
            count: 100,
          })
          cursor = Number(nextCursor)
          resolved.push(...found)
        } while (cursor !== 0)
      } else {
        resolved.push(key)
      }
    }

    if (resolved.length) await redis.del(...resolved)
  } catch (err) {
    console.error('[cache] bust error:', err)
  }
}

/**
 * Set a short-lived flag — used for the "creator bypass" pattern.
 * After creating content, the creator's next feed request skips cache
 * so they see their own post immediately.
 */
export async function setCreatorBypass(userId: string): Promise<void> {
  if (!redis) return
  try {
    await redis.set(`creator:bypass:${userId}`, '1', { ex: 30 })
  } catch (err) {
    console.error('[cache] setCreatorBypass error:', err)
  }
}

/**
 * Check and consume the creator bypass flag.
 * Returns true once then deletes the key (one-shot bypass).
 */
export async function consumeCreatorBypass(userId: string): Promise<boolean> {
  if (!redis) return false
  try {
    const val = await redis.getdel(`creator:bypass:${userId}`)
    return val === '1'
  } catch {
    return false
  }
}
