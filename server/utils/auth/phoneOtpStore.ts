// server/utils/auth/phoneOtpStore.ts
// OTP store for phone/WhatsApp authentication — Redis-backed in production,
// in-memory fallback for local dev (when Upstash is not configured).
// Each entry expires after 10 minutes and is single-use.
//
// Deliberately separate from otpStore.ts (checkout, email-keyed) rather than
// reused — different key namespace (`otp:phone:` vs `otp:checkout:`) so the
// two flows can never collide on the same identifier.

import { redis } from '../cache'

interface PhoneOtpEntry {
  code: string
  expiresAt: number
  isNewUser?: boolean
}

// ─── In-memory fallback (dev only) ───────────────────────────────────────────

const _store = new Map<string, PhoneOtpEntry>()

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

function otpKey(phone: string) {
  return `otp:phone:${phone}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const phoneOtpStore = {
  async set(phone: string, data: Omit<PhoneOtpEntry, 'expiresAt'>) {
    const entry: PhoneOtpEntry = {
      ...data,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }

    if (redis) {
      await redis.set(otpKey(phone), JSON.stringify(entry), { ex: 600 })
    } else {
      _store.set(phone, entry)
    }
  },

  async verify(phone: string, code: string): Promise<PhoneOtpEntry | null> {
    if (redis) {
      const raw = await redis.getdel(otpKey(phone))
      if (!raw) return null
      const entry: PhoneOtpEntry =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as PhoneOtpEntry)
      if (Date.now() > entry.expiresAt) return null
      if (entry.code !== code) return null
      return entry
    }

    // In-memory fallback. Consume the entry on ANY verify attempt to match the
    // Redis getdel semantics above — otherwise a wrong code leaves the OTP in
    // place and the 6-digit code is brute-forceable (dev-only, but keep parity).
    const entry = _store.get(phone)
    if (!entry) return null
    _store.delete(phone)
    if (Date.now() > entry.expiresAt) return null
    if (entry.code !== code) return null
    return entry
  },
}
