// Pure reduction of ledger signals into the same RawTrustFacts the live
// aggregation produces (framework §4). No DB access → unit-testable. This is
// what lets the engine read the append-only ReputationSignal ledger instead of
// re-querying Orders/Reviews on every request.

import type { RawTrustFacts } from './trustFacts'

export interface SignalRow {
  signalKey: string
  value: unknown
  observedAt: Date | string
}

/**
 * Exponential decay weight for a dated signal: 1.0 today, 0.5 after one
 * half-life, etc. Recent evidence counts more, so a seller must keep trading
 * cleanly rather than coast on old volume (framework §6 "burst then coast").
 */
export function decayWeight(
  observedAt: Date | string,
  halfLifeDays: number,
  now: number = Date.now(),
): number {
  const ageDays = Math.max(
    0,
    (now - new Date(observedAt).getTime()) / 86_400_000,
  )
  return Math.pow(0.5, ageDays / halfLifeDays)
}

/** Fold active COMMERCE signals into the facts the engine/presenters expect. */
export function reduceSignalsToFacts(
  signals: SignalRow[],
  createdAt: Date | string,
  now: number = Date.now(),
): RawTrustFacts {
  let sales = 0
  let delivered = 0
  let disputes = 0
  let reviewCount = 0
  let ratingSum = 0
  let lastAt: Date | null = null
  let lastPlace: string | null = null

  for (const s of signals) {
    const v = (s.value ?? {}) as Record<string, unknown>
    if (s.signalKey === 'commerce.order_completed') {
      sales++
      if (v.delivered === true) delivered++
      const at = new Date(s.observedAt)
      if (!lastAt || at > lastAt) {
        lastAt = at
        lastPlace = (v.place as string | null) ?? null
      }
    } else if (s.signalKey === 'commerce.review') {
      reviewCount++
      ratingSum += Number(v.rating) || 0
    } else if (s.signalKey === 'commerce.dispute_resolved') {
      if (v.outcome === 'REFUND_BUYER') disputes++
    }
  }

  const disputeRate = sales ? (disputes / sales) * 100 : 0
  const tenureYears = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 31_536_000_000),
  )

  return {
    sales,
    delivered,
    disputes,
    disputeRate,
    reviewCount,
    rating: reviewCount ? ratingSum / reviewCount : null,
    tenureYears,
    lastOrder: lastAt ? { at: lastAt, place: lastPlace } : null,
  }
}
