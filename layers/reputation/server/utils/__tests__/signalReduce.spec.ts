import { describe, it, expect } from 'vitest'
import { reduceSignalsToFacts, decayWeight } from '../signalReduce'

const created = new Date('2020-01-01T00:00:00Z')

describe('reduceSignalsToFacts', () => {
  it('folds ledger signals into facts (counts, dispute rate, rating, last place)', () => {
    const now = new Date('2026-07-22T00:00:00Z').getTime()
    const facts = reduceSignalsToFacts(
      [
        {
          signalKey: 'commerce.order_completed',
          value: { orderId: 1, delivered: true, place: 'Lagos' },
          observedAt: '2026-07-01T00:00:00Z',
        },
        {
          signalKey: 'commerce.order_completed',
          value: { orderId: 2, delivered: false, place: 'Kano' },
          observedAt: '2026-07-10T00:00:00Z',
        },
        {
          signalKey: 'commerce.review',
          value: { rating: 5 },
          observedAt: '2026-07-05T00:00:00Z',
        },
        {
          signalKey: 'commerce.review',
          value: { rating: 3 },
          observedAt: '2026-07-06T00:00:00Z',
        },
        {
          signalKey: 'commerce.dispute_resolved',
          value: { outcome: 'REFUND_BUYER' },
          observedAt: '2026-07-08T00:00:00Z',
        },
        {
          // A rejected dispute is not counted against the seller.
          signalKey: 'commerce.dispute_resolved',
          value: { outcome: 'REJECTED' },
          observedAt: '2026-07-09T00:00:00Z',
        },
      ],
      created,
      now,
    )

    expect(facts.sales).toBe(2)
    expect(facts.delivered).toBe(1)
    expect(facts.disputes).toBe(1)
    expect(facts.disputeRate).toBeCloseTo(50)
    expect(facts.reviewCount).toBe(2)
    expect(facts.rating).toBe(4)
    expect(facts.lastOrder?.place).toBe('Kano') // most recent observedAt wins
  })

  it('handles an empty ledger', () => {
    const facts = reduceSignalsToFacts([], created)
    expect(facts.sales).toBe(0)
    expect(facts.disputeRate).toBe(0)
    expect(facts.rating).toBeNull()
    expect(facts.lastOrder).toBeNull()
  })
})

describe('decayWeight', () => {
  it('is ~1 at age zero', () => {
    const now = Date.now()
    expect(decayWeight(new Date(now), 365, now)).toBeCloseTo(1)
  })

  it('is ~0.5 after one half-life', () => {
    const now = new Date('2026-07-22T00:00:00Z').getTime()
    const oneHalfLifeAgo = new Date(now - 365 * 86_400_000)
    expect(decayWeight(oneHalfLifeAgo, 365, now)).toBeCloseTo(0.5, 2)
  })

  it('decreases with age', () => {
    const now = Date.now()
    const older = decayWeight(new Date(now - 800 * 86_400_000), 365, now)
    const newer = decayWeight(new Date(now - 100 * 86_400_000), 365, now)
    expect(older).toBeLessThan(newer)
  })
})
