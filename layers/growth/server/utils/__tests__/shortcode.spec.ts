import { describe, it, expect } from 'vitest'
import {
  randomShortCode,
  isShortCode,
  SHORTCODE_ALPHABET,
} from '../shortcode'

describe('randomShortCode', () => {
  it('is the requested length and uses only the alphabet', () => {
    const code = randomShortCode()
    expect(code).toHaveLength(7)
    for (const ch of code) expect(SHORTCODE_ALPHABET).toContain(ch)
  })

  it('honours a custom length', () => {
    expect(randomShortCode(10)).toHaveLength(10)
  })

  it('is effectively unique across many draws', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 5000; i++) seen.add(randomShortCode())
    // 62^7 space → 5000 draws should collide ~never.
    expect(seen.size).toBe(5000)
  })
})

describe('isShortCode', () => {
  it('accepts a well-formed code', () => {
    expect(isShortCode('g7Kp2Qa')).toBe(true)
  })
  it('rejects wrong length or bad characters', () => {
    expect(isShortCode('short')).toBe(false) // too short
    expect(isShortCode('g7Kp2Q-')).toBe(false) // hyphen not in alphabet
  })
})
