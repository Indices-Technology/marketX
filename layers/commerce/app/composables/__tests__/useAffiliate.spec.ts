import { describe, it, expect, beforeEach } from 'vitest'
import { isValidAffiliateRef } from '../useAffiliate'

// ── isValidAffiliateRef ───────────────────────────────────────────────────────
// Pure function — no Pinia / Nuxt / localStorage needed.

describe('isValidAffiliateRef', () => {
  it('accepts a simple lowercase code', () => {
    expect(isValidAffiliateRef('josh_abc123')).toBe(true)
  })

  it('accepts a code with hyphens', () => {
    expect(isValidAffiliateRef('seller-code-42')).toBe(true)
  })

  it('accepts uppercase (case-insensitive)', () => {
    expect(isValidAffiliateRef('SELLER_ABC')).toBe(true)
  })

  it('accepts a single character', () => {
    expect(isValidAffiliateRef('a')).toBe(true)
  })

  it('accepts exactly 64 characters', () => {
    expect(isValidAffiliateRef('a'.repeat(64))).toBe(true)
  })

  it('accepts digits only', () => {
    expect(isValidAffiliateRef('1234567')).toBe(true)
  })

  it('accepts mixed underscore and hyphen', () => {
    expect(isValidAffiliateRef('my_store-code_42')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidAffiliateRef('')).toBe(false)
  })

  it('rejects string longer than 64 characters', () => {
    expect(isValidAffiliateRef('a'.repeat(65))).toBe(false)
  })

  it('rejects code with spaces', () => {
    expect(isValidAffiliateRef('bad code')).toBe(false)
  })

  it('rejects XSS payload', () => {
    expect(isValidAffiliateRef('<script>alert(1)</script>')).toBe(false)
  })

  it('rejects code with dots', () => {
    expect(isValidAffiliateRef('seller.code')).toBe(false)
  })

  it('rejects code with slashes', () => {
    expect(isValidAffiliateRef('seller/code')).toBe(false)
  })

  it('rejects code with at-sign', () => {
    expect(isValidAffiliateRef('@seller')).toBe(false)
  })

  it('rejects code with equals sign', () => {
    expect(isValidAffiliateRef('ref=injected')).toBe(false)
  })

  it('rejects code with ampersand', () => {
    expect(isValidAffiliateRef('ref&other=1')).toBe(false)
  })
})
