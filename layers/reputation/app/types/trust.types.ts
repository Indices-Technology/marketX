// Types for the discovery projection of the reputation framework (§5.4):
// the compact, story-first Trust Card shown in the home feed.

// Seller rank on the card (Tier 1 = highest). Distinct from the framework's
// Gold/Silver/Bronze *signal* tiers, which classify evidence provenance.
export type TrustTier = 'TIER_1' | 'TIER_2' | 'TIER_3'

/** A small proof pill — an icon + short label (escrow, attestation, tenure). */
export interface TrustChip {
  icon: string
  label: string
}

/**
 * A seller as it appears in the Trust Spotlight rail. Identity fields are real
 * (from /api/seller/featured); the story fields (`headline`, `loyalty`,
 * `recent`, `chips`, `tier`) are the human projection of `ReputationProfile.facts`
 * once the engine lands (framework Phase 1). Until then a placeholder mapper
 * writes them — see useTrustSpotlight.
 *
 * The card tells a story, not a stat grid: numbers live inside sentences a buyer
 * can relate to, never as a naked row of figures.
 */
export interface TrustSpotlightSeller {
  id: string
  publicId: string | null
  store_name: string | null
  store_slug: string
  store_logo: string | null
  is_verified: boolean
  tier: TrustTier
  /** The hero line — the trust story in plain language, numbers in context. */
  headline: string
  /** Human framing of repeat business, e.g. "More than 1 in 3 buyers come back". */
  loyalty: string
  /** A concrete recent moment, e.g. "Sold sneakers to Lekki · 2 days ago". */
  recent: string
  /** Proof pills: escrow, attestation, tenure. */
  chips: TrustChip[]
  /** Earned numeric line for the hero card, e.g. "960 verified deliveries · 1.2% dispute rate · 5 yrs trading". */
  stats: string
}

// ── Full trust view (profile Trust tab) ──────────────────────────────────────

export type TrustBand =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INSUFFICIENT'
  | 'NOT_PROVIDED'

export interface TrustDimension {
  key: string
  label: string
  band: TrustBand
  /** 0–100 for the bar; null when the band has no displayable score. */
  score: number | null
  fact: string
}

export interface TrustProfileView {
  id: string
  publicId: string | null
  store_name: string | null
  store_slug: string
  store_logo: string | null
  store_location: string | null
  is_verified: boolean
  cac_verified: boolean
  /** False → seller hasn't crossed the min-evidence threshold (§1.6). */
  enoughEvidence: boolean
  tier: TrustTier | null
  headline: string
  facts: {
    sales: number
    delivered: number
    disputeRate: number
    reviewCount: number
    rating: number | null
    tenure: string
    lastSale: string | null
  }
  dimensions: TrustDimension[]
}
