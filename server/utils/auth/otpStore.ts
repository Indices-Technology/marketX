// server/utils/auth/otpStore.ts
// In-memory OTP store for checkout authentication.
// Each entry expires after 10 minutes and is single-use.

interface OtpEntry {
  code: string
  expiresAt: number
  // Temporary data for auto-registration (new users only)
  name?: string
  phone?: string
  isNewUser?: boolean
}

const _store = new Map<string, OtpEntry>()

// Sweep expired entries every 5 minutes to avoid unbounded growth
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of _store) {
      if (now > entry.expiresAt) _store.delete(key)
    }
  },
  5 * 60 * 1000,
)

export const otpStore = {
  set(email: string, data: Omit<OtpEntry, 'expiresAt'>) {
    _store.set(email.toLowerCase(), {
      ...data,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    })
  },

  /** Returns true and deletes the entry if code is valid and not expired */
  verify(email: string, code: string): OtpEntry | null {
    const key = email.toLowerCase()
    const entry = _store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      _store.delete(key)
      return null
    }
    if (entry.code !== code) return null
    _store.delete(key) // one-time use
    return entry
  },

  has(email: string): boolean {
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
