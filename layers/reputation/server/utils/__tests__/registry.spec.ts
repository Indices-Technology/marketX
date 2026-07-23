import { describe, it, expect } from 'vitest'
import {
  commerceBand,
  identityBand,
  tierFrom,
  BAND_SCORE,
  MIN_EVIDENCE,
} from '../../reputation.registry'

describe('reputation registry (engine v1 thresholds)', () => {
  describe('commerceBand', () => {
    it('is INSUFFICIENT below min-evidence', () => {
      expect(commerceBand(MIN_EVIDENCE - 1, 0)).toBe('INSUFFICIENT')
    })
    it('is HIGH for strong volume + low disputes', () => {
      expect(commerceBand(60, 1)).toBe('HIGH')
    })
    it('falls to MEDIUM when disputes climb past the HIGH bar', () => {
      expect(commerceBand(60, 3)).toBe('MEDIUM')
    })
    it('is MEDIUM for mid volume', () => {
      expect(commerceBand(12, 1)).toBe('MEDIUM')
    })
    it('is LOW just past the evidence threshold', () => {
      expect(commerceBand(5, 1)).toBe('LOW')
    })
    it('is LOW when disputes are high regardless of volume', () => {
      expect(commerceBand(200, 5)).toBe('LOW')
    })
  })

  describe('identityBand', () => {
    it('HIGH when verified and CAC registered', () => {
      expect(identityBand({ is_verified: true, cac_verified: true })).toBe(
        'HIGH',
      )
    })
    it('MEDIUM with only one signal', () => {
      expect(identityBand({ is_verified: true, cac_verified: false })).toBe(
        'MEDIUM',
      )
    })
    it('LOW with neither', () => {
      expect(identityBand({ is_verified: false, cac_verified: false })).toBe(
        'LOW',
      )
    })
  })

  describe('tierFrom', () => {
    it('TIER_1 for 100+ clean sales', () => {
      expect(tierFrom(120, 1)).toBe('TIER_1')
    })
    it('never TIER_1 once disputes reach 2%', () => {
      expect(tierFrom(200, 3)).toBe('TIER_2')
    })
    it('TIER_2 for mid volume', () => {
      expect(tierFrom(40, 2)).toBe('TIER_2')
    })
    it('TIER_3 for small sellers', () => {
      expect(tierFrom(6, 0)).toBe('TIER_3')
    })
  })

  describe('BAND_SCORE', () => {
    it('has no score for non-displayable bands', () => {
      expect(BAND_SCORE.INSUFFICIENT).toBeNull()
      expect(BAND_SCORE.NOT_PROVIDED).toBeNull()
    })
    it('orders HIGH > MEDIUM > LOW', () => {
      expect(BAND_SCORE.HIGH!).toBeGreaterThan(BAND_SCORE.MEDIUM!)
      expect(BAND_SCORE.MEDIUM!).toBeGreaterThan(BAND_SCORE.LOW!)
    })
  })
})
