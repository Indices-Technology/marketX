import { describe, it, expect } from 'vitest'
import { scanForContact, maskContact } from '../contentGuard'

const LEAKS = [
  'call me on 08012345678',
  'my number is +234 801 234 5678',
  'whatsapp me',
  'reach me on wa.me/2348012345678',
  'dm me on instagram',
  'telegram: @joeseller',
  'send to GTB 0123456789',
  'email me at seller@gmail.com',
  'text me 0803-456-7890 abeg',
]

const CLEAN = [
  'Looking for a size 42 leather sandal under 15k',
  'Do you have this in blue?',
  'I need it delivered to Yaba, Lagos by Friday',
  'Budget is around 20000 naira',
]

describe('scanForContact', () => {
  it('flags every leak sample', () => {
    for (const t of LEAKS) {
      expect(scanForContact(t).clean, t).toBe(false)
    }
  })

  it('passes clean shopping text', () => {
    for (const t of CLEAN) {
      expect(scanForContact(t).clean, t).toBe(true)
    }
  })

  it('returns matched fragments for logging', () => {
    const r = scanForContact('call me on 08012345678')
    expect(r.matches.length).toBeGreaterThan(0)
  })

  it('treats empty/nullish as clean', () => {
    expect(scanForContact('').clean).toBe(true)
    expect(scanForContact(null).clean).toBe(true)
    expect(scanForContact(undefined).clean).toBe(true)
  })
})

describe('maskContact', () => {
  it('masks phone numbers', () => {
    expect(maskContact('call me on 08012345678')).not.toMatch(/08012345678/)
    expect(maskContact('call me on 08012345678')).toContain('[hidden]')
  })

  it('masks emails', () => {
    expect(maskContact('seller@gmail.com')).toBe('[hidden]')
  })

  it('masks messaging handles', () => {
    expect(maskContact('whatsapp me now')).toContain('[hidden]')
  })

  it('leaves clean text unchanged', () => {
    const t = 'Looking for a size 42 sandal under 15k, deliver to Yaba'
    expect(maskContact(t)).toBe(t)
  })

  it('preserves the rest of the message around a masked number', () => {
    const out = maskContact('I want the blue one, 08012345678 thanks')
    expect(out).toContain('I want the blue one')
    expect(out).toContain('thanks')
    expect(out).not.toContain('08012345678')
  })
})
