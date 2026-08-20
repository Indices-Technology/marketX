import { describe, it, expect } from 'vitest'
import { calculatePayout } from '../fees'

/**
 * Payout fee invariants.
 *
 * These are the guarantees the Payout money columns and their CHECK constraints
 * depend on. `amountNet` is the only figure a payout executor may transfer, so
 * "net can never exceed gross" and "the split always reconciles" have to hold
 * for every amount, not just the ones a preview endpoint happens to be called
 * with.
 */
describe('calculatePayout', () => {
  const AMOUNTS = [1, 100, 5_000, 5_001, 10_000, 100_000, 1_000_000, 999_999_999]

  it('never returns a net above the gross', () => {
    for (const gross of AMOUNTS) {
      expect(calculatePayout(gross).net).toBeLessThanOrEqual(gross)
    }
  })

  it('never returns a negative net', () => {
    for (const gross of AMOUNTS) {
      expect(calculatePayout(gross).net).toBeGreaterThanOrEqual(0)
    }
  })

  it('reconciles: net + platformFee + transferFee === gross, above the fee floor', () => {
    for (const gross of AMOUNTS) {
      const { net, platformFee, transferFee } = calculatePayout(gross)
      // Below the fee floor the net clamps at 0 and the identity cannot hold —
      // that case is covered separately below.
      if (net === 0) continue
      expect(net + platformFee + transferFee).toBe(gross)
    }
  })

  it('clamps to zero rather than going negative when fees exceed the gross', () => {
    const { net, totalFees } = calculatePayout(1)
    expect(net).toBe(0)
    expect(totalFees).toBeGreaterThan(1)
  })

  it('totalFees is the sum of its parts', () => {
    for (const gross of AMOUNTS) {
      const { platformFee, transferFee, totalFees } = calculatePayout(gross)
      expect(totalFees).toBe(platformFee + transferFee)
    }
  })
})
