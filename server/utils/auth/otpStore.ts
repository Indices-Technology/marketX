// server/utils/auth/otpStore.ts
// OTP store for checkout authentication — Redis-backed in production,
// in-memory fallback for local dev (when Upstash is not configured).
// Each entry expires after 10 minutes and is single-use.

import { redis } from '../cache'

interface OtpEntry {
  code: string
  expiresAt: number
  name?: string
  phone?: string
  isNewUser?: boolean
}

// ─── In-memory fallback (dev only) ───────────────────────────────────────────

const _store = new Map<string, OtpEntry>()

setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of _store) {
      if (now > entry.expiresAt) _store.delete(key)
    }
  },
  5 * 60 * 1000,
)

// ─── Redis helpers ────────────────────────────────────────────────────────────
// TODO confirm that Redis JSON parsing is consistent across Upstash and ioredis
function otpKey(email: string) {
  return `otp:checkout:${email.toLowerCase()}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const otpStore = {
  async set(email: string, data: Omit<OtpEntry, 'expiresAt'>) {
    const key = email.toLowerCase()
    const entry: OtpEntry = { ...data, expiresAt: Date.now() + 10 * 60 * 1000 }

    if (redis) {
      await redis.set(otpKey(email), JSON.stringify(entry), { ex: 600 })
    } else {
      _store.set(key, entry)
    }
  },

  async verify(email: string, code: string): Promise<OtpEntry | null> {
    if (redis) {
      const raw = await redis.getdel(otpKey(email))
      if (!raw) return null
      const entry: OtpEntry =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as OtpEntry)
      if (Date.now() > entry.expiresAt) return null
      if (entry.code !== code) return null
      return entry
    }

    // In-memory fallback
    const key = email.toLowerCase()
    const entry = _store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      _store.delete(key)
      return null
    }
    if (entry.code !== code) return null
    _store.delete(key)
    return entry
  },

  async has(email: string): Promise<boolean> {
    if (redis) {
      const raw = await redis.get(otpKey(email))
      if (!raw) return false
      const entry: OtpEntry =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as OtpEntry)
      return Date.now() <= entry.expiresAt
    }

    // In-memory fallback
    const key = email.toLowerCase()
    const entry = _store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      _store.delete(key)
      return false
    }
    return true
  },
}
