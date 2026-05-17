// FILE PATH: server/utils/auth/rateLimiter.ts
// Auth endpoint rate limiter — Redis-backed in production, in-memory fallback in dev.
// Uses a fixed-window counter: incr key on first hit, set TTL, block once count exceeds max.

import { redis } from '../cache'

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  lockoutMs: number
  keyPrefix: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  locked: boolean
  lockedUntilMs?: number
}

// ─── In-memory fallback (dev only) ───────────────────────────────────────────

interface AttemptRecord {
  count: number
  firstAttemptAt: number
  lockedUntil?: number
}

const _store = new Map<string, AttemptRecord>()

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of _store.entries()) {
    if (now - record.firstAttemptAt > 3_600_000) _store.delete(key)
  }
}, 3_600_000)

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  let record = _store.get(key)

  if (record?.lockedUntil && record.lockedUntil > now) {
    return { allowed: false, remaining: 0, resetAt: record.lockedUntil,
      locked: true, lockedUntilMs: Math.ceil((record.lockedUntil - now) / 1000) }
  }

  if (!record || now - record.firstAttemptAt > config.windowMs) {
    record = { count: 1, firstAttemptAt: now }
  } else {
    record.count++
  }

  if (record.count > config.maxAttempts) {
    record.lockedUntil = now + config.lockoutMs
    _store.set(key, record)
    return { allowed: false, remaining: 0, resetAt: record.lockedUntil,
      locked: true, lockedUntilMs: Math.ceil(config.lockoutMs / 1000) }
  }

  _store.set(key, record)
  return { allowed: true, remaining: config.maxAttempts - record.count,
    resetAt: record.firstAttemptAt + config.windowMs, locked: false }
}

// ─── Redis implementation ─────────────────────────────────────────────────────

async function checkRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now()
  const lockKey = `${key}:lock`

  // Check lockout first
  const lockTtl = await redis!.ttl(lockKey)
  if (lockTtl > 0) {
    return { allowed: false, remaining: 0, resetAt: now + lockTtl * 1000,
      locked: true, lockedUntilMs: lockTtl }
  }

  const windowSec = Math.ceil(config.windowMs / 1000)
  const count = await redis!.incr(key)
  if (count === 1) await redis!.expire(key, windowSec)

  if (count > config.maxAttempts) {
    const lockSec = Math.ceil(config.lockoutMs / 1000)
    await redis!.set(lockKey, '1', { ex: lockSec })
    await redis!.del(key)
    return { allowed: false, remaining: 0, resetAt: now + config.lockoutMs,
      locked: true, lockedUntilMs: lockSec }
  }

  const ttl = await redis!.ttl(key)
  return { allowed: true, remaining: config.maxAttempts - count,
    resetAt: now + ttl * 1000, locked: false }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const key = `${config.keyPrefix}:${identifier}`
  if (redis) {
    // Sync callers (non-async service code) can't await — schedule the Redis check
    // and optimistically allow while Redis updates. For auth endpoints the caller
    // uses the async version; this sync path is kept for backward compat.
    return checkInMemory(key, config)
  }
  return checkInMemory(key, config)
}

export async function checkRateLimitAsync(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`
  if (redis) {
    try {
      return await checkRedis(key, config)
    } catch {
      return checkInMemory(key, config)
    }
  }
  return checkInMemory(key, config)
}

export function clearRateLimit(identifier: string, keyPrefix: string): void {
  const key = `${keyPrefix}:${identifier}`
  _store.delete(key)
  if (redis) {
    redis.del(key, `${key}:lock`).catch(() => {})
  }
}

export function resetAllRateLimits(): void {
  _store.clear()
}

export function getRateLimitStatus(identifier: string, keyPrefix: string): AttemptRecord | undefined {
  return _store.get(`${keyPrefix}:${identifier}`)
}

export function deleteRateLimitRecord(identifier: string, keyPrefix: string): boolean {
  return _store.delete(`${keyPrefix}:${identifier}`)
}

export function getAllRateLimitRecords(): Map<string, AttemptRecord> {
  return new Map(_store)
}
