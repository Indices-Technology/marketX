// Reputation engine registry (framework §3 "code registry"). The weights,
// thresholds and band cut-offs live HERE — typed, reviewed, versioned — not in
// the database. Changing a rule is a PR that bumps ENGINE_VERSION, and old
// ReputationProfile snapshots stay interpretable forever.
//
// v1 is deliberately simple (COMMERCE + IDENTITY from real data); decay curves,
// tier caps and per-signal weights land as the ReputationSignal ledger arrives.

export const ENGINE_VERSION = '1.0.0'

/** Below this many completed orders a dimension reads "not enough data" (§1.6). */
export const MIN_EVIDENCE = 3

/** How long a cached snapshot is trusted before recompute. */
export const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000

export type Band = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' | 'NOT_PROVIDED'

export type Tier = 'TIER_1' | 'TIER_2' | 'TIER_3'

/** 0–100 for the dimension bar; null when the band has no displayable score. */
export const BAND_SCORE: Record<Band, number | null> = {
  HIGH: 92,
  MEDIUM: 74,
  LOW: 52,
  INSUFFICIENT: null,
  NOT_PROVIDED: null,
}

/** COMMERCE band from real escrow evidence. */
export function commerceBand(sales: number, disputeRate: number): Band {
  if (sales < MIN_EVIDENCE) return 'INSUFFICIENT'
  if (sales >= 50 && disputeRate < 2) return 'HIGH'
  if (sales >= 10 && disputeRate < 4) return 'MEDIUM'
  return 'LOW'
}

/** IDENTITY band from verification flags. */
export function identityBand(v: {
  is_verified: boolean
  cac_verified: boolean
}): Band {
  if (v.is_verified && v.cac_verified) return 'HIGH'
  if (v.is_verified || v.cac_verified) return 'MEDIUM'
  return 'LOW'
}

/** Overall seller rank from real evidence (min-evidence gated upstream). */
export function tierFrom(sales: number, disputeRate: number): Tier {
  if (sales >= 100 && disputeRate < 2) return 'TIER_1'
  if (sales >= 30 && disputeRate < 4) return 'TIER_2'
  return 'TIER_3'
}

// ── Signal definitions (framework §3 code registry) ──────────────────────────
// One entry per signalKey: its dimension, provenance tier, and (for the future
// weighted engine) weight + decay half-life. Changing these is a versioned PR.
export const signalDefs = {
  'commerce.order_completed': {
    dimension: 'COMMERCE',
    tier: 'GOLD',
    weight: 5,
    halfLifeDays: 365,
  },
  'commerce.review': {
    dimension: 'COMMERCE',
    tier: 'GOLD',
    weight: 2,
    halfLifeDays: 365,
  },
  'commerce.dispute_resolved': {
    dimension: 'COMMERCE',
    tier: 'GOLD',
    weight: 4,
    halfLifeDays: 365,
  },
} as const

export type SignalKey = keyof typeof signalDefs
