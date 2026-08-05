import { describe, it, expect } from 'vitest'
import { sanitizeBuyerNote, BUYER_NOTE_MAX } from '../buyerNote'

describe('sanitizeBuyerNote', () => {
  it('returns null for empty / whitespace-only / nullish input', () => {
    for (const t of ['', '   ', '\n\t ', null, undefined]) {
      const r = sanitizeBuyerNote(t)
      expect(r.note, JSON.stringify(t)).toBeNull()
      expect(r.masked).toBe(false)
    }
  })

  it('keeps a clean instruction unchanged and unmasked', () => {
    const r = sanitizeBuyerNote('Call before arriving, the gate is locked')
    expect(r.note).toBe('Call before arriving, the gate is locked')
    expect(r.masked).toBe(false)
    expect(r.matches).toEqual([])
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeBuyerNote('  gift wrap please  ').note).toBe('gift wrap please')
  })

  it('masks a phone number and flags it as masked', () => {
    const r = sanitizeBuyerNote('deliver fast, call me on 08012345678 thanks')
    expect(r.masked).toBe(true)
    expect(r.note).not.toMatch(/08012345678/)
    expect(r.note).toContain('[hidden]')
    // surrounding instruction is preserved
    expect(r.note).toContain('deliver fast')
    expect(r.note).toContain('thanks')
    expect(r.matches.length).toBeGreaterThan(0)
  })

  it('masks an email and a WhatsApp off-ramp', () => {
    expect(sanitizeBuyerNote('email me at seller@gmail.com').note).toContain('[hidden]')
    expect(sanitizeBuyerNote('whatsapp me for details').masked).toBe(true)
  })

  it('caps the stored note at BUYER_NOTE_MAX characters', () => {
    const long = 'a'.repeat(BUYER_NOTE_MAX + 120)
    const r = sanitizeBuyerNote(long)
    expect(r.note).not.toBeNull()
    expect(r.note!.length).toBe(BUYER_NOTE_MAX)
  })

  it('caps AFTER masking so a leak near the boundary cannot survive via truncation', () => {
    // A masked note that is still longer than the cap must remain masked once cut.
    const filler = 'x'.repeat(BUYER_NOTE_MAX)
    const r = sanitizeBuyerNote(`call 08012345678 ${filler}`)
    expect(r.note!.length).toBe(BUYER_NOTE_MAX)
    expect(r.note).not.toMatch(/08012345678/)
  })
})
