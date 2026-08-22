import { describe, it, expect } from 'vitest'
import {
  assessPayoutRisk,
  DEFAULT_LARGE_AMOUNT_KOBO,
  DEFAULT_TYPICAL_MULTIPLE,
  DEFAULT_BANK_AGE_HOURS,
  type RiskInput,
} from '../../services/settlement-risk'

/**
 * These rules decide where a reviewer's attention goes. Two properties matter
 * more than any individual flag:
 *
 *  1. A routine payout must come back CLEAN. If ordinary payouts get flagged,
 *     the reviewer learns to click through without reading, and the review stops
 *     being a control at all.
 *  2. Anything uncertain must default to EXCLUDED. The cost of being wrong that
 *     way is a delayed payout; the other way sends money that shouldn't move.
 */

/** An established seller, modest amount, long-standing account. */
const routine = (over: Partial<RiskInput> = {}): RiskInput => ({
  amountGross: 1_000_000, // ₦10,000
  priorPayoutAmounts: [900_000, 1_100_000, 1_000_000, 950_000],
  newestBankAccountAgeHours: 24 * 90,
  hasActiveHold: false,
  hasUnsecuredClaim: false,
  trustTier: 'TIER_2',
  isSellerPayee: true,
  ...over,
})

describe('assessPayoutRisk', () => {
  it('leaves a routine payout completely clean', () => {
    const r = assessPayoutRisk(routine())
    expect(r.flags).toEqual([])
    expect(r.score).toBe(0)
    expect(r.shouldExclude).toBe(false)
  })

  it('excludes on any flag at all', () => {
    const r = assessPayoutRisk(routine({ hasActiveHold: true }))
    expect(r.flags).toContain('OPEN_DISPUTE')
    expect(r.shouldExclude).toBe(true)
  })

  it('flags a payee with no destination account, and scores it highest', () => {
    const r = assessPayoutRisk(routine({ newestBankAccountAgeHours: null }))
    expect(r.flags).toContain('NO_BANK_ACCOUNT')
    // Cannot be paid at all — must outrank every other concern.
    expect(r.score).toBeGreaterThanOrEqual(100)
  })

  it('flags a destination account changed inside the window', () => {
    const r = assessPayoutRisk(
      routine({ newestBankAccountAgeHours: DEFAULT_BANK_AGE_HOURS - 1 }),
    )
    expect(r.flags).toContain('BANK_CHANGED_RECENTLY')
  })

  it('does not flag an account just outside the window', () => {
    const r = assessPayoutRisk(
      routine({ newestBankAccountAgeHours: DEFAULT_BANK_AGE_HOURS + 1 }),
    )
    expect(r.flags).not.toContain('BANK_CHANGED_RECENTLY')
  })

  it('flags a first payout', () => {
    const r = assessPayoutRisk(routine({ priorPayoutAmounts: [] }))
    expect(r.flags).toContain('FIRST_PAYOUT')
  })

  it('flags an amount above the absolute threshold', () => {
    const r = assessPayoutRisk(
      routine({ amountGross: DEFAULT_LARGE_AMOUNT_KOBO + 1 }),
    )
    expect(r.flags).toContain('LARGE_AMOUNT')
  })

  it('flags an amount far above the payee history', () => {
    const r = assessPayoutRisk(
      routine({ amountGross: 1_000_000 * DEFAULT_TYPICAL_MULTIPLE + 1 }),
    )
    expect(r.flags).toContain('ABOVE_TYPICAL')
  })

  it('does not compare against history too thin to be a pattern', () => {
    // Two prior payouts is not a baseline. Comparing against it would fire on
    // roughly every third payout a new seller makes.
    const r = assessPayoutRisk(
      routine({ priorPayoutAmounts: [10_000, 10_000], amountGross: 5_000_000 }),
    )
    expect(r.flags).not.toContain('ABOVE_TYPICAL')
  })

  it('flags a dispute that could not be fully secured', () => {
    const r = assessPayoutRisk(routine({ hasUnsecuredClaim: true }))
    expect(r.flags).toContain('UNSECURED_CLAIM')
  })

  it('flags a seller with no trust tier', () => {
    const r = assessPayoutRisk(routine({ trustTier: null }))
    expect(r.flags).toContain('NO_TRUST_TIER')
  })

  it('does not flag an affiliate for having no trust tier', () => {
    // Affiliates are not sellers and never have one. Flagging it would put every
    // affiliate payout in front of a human forever.
    const r = assessPayoutRisk(
      routine({ trustTier: null, isSellerPayee: false }),
    )
    expect(r.flags).not.toContain('NO_TRUST_TIER')
  })

  it('accumulates flags and scores rather than stopping at the first', () => {
    const r = assessPayoutRisk(
      routine({
        priorPayoutAmounts: [],
        hasActiveHold: true,
        newestBankAccountAgeHours: 1,
        amountGross: DEFAULT_LARGE_AMOUNT_KOBO + 1,
      }),
    )
    expect(r.flags).toEqual(
      expect.arrayContaining([
        'BANK_CHANGED_RECENTLY',
        'OPEN_DISPUTE',
        'FIRST_PAYOUT',
        'LARGE_AMOUNT',
      ]),
    )
    expect(r.score).toBeGreaterThan(50)
    expect(r.shouldExclude).toBe(true)
  })
})
