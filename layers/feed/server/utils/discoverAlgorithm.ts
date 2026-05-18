/**
 * Discover Strip Algorithm
 *
 * Scores and deduplicates products across the four Trending-page strips so
 * no product appears in more than one strip at a time.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * 1. Each strip passes in an over-fetched candidate pool (aim for ~2.5× the
 *    target `size` so deduplication still leaves enough products in each strip).
 * 2. All candidate pools are merged into one de-duped pool and normalised.
 * 3. Strips fill in STRIP_PRIORITY order: the highest-priority strip scores and
 *    claims its top `size` products first; lower-priority strips only see what's
 *    left.  "Fresh Drops" is last because it's the catch-all.
 *
 * ── Tuning ──────────────────────────────────────────────────────────────────
 * Edit STRIP_WEIGHTS to change how each strip ranks its candidates.
 * Edit STRIP_PRIORITY to change which strip "wins" a contested product.
 * Weights don't need to sum to 1 — they're relative, not absolute.
 */

export type StripCandidate = {
  id: number
  viewCount: number
  discount: number | null
  isThrift: boolean
  isDeal: boolean
  created_at: Date | string
  _count?: { likes?: number; comments?: number }
  [key: string]: unknown
}

export type StripName = 'trending' | 'fresh' | 'deals' | 'preloved'

type WeightProfile = {
  /** Normalised view count  — measures popularity */
  views: number
  /** Recency score (1 = just listed, 0 = oldest in pool) — measures freshness */
  recency: number
  /** Normalised discount % — measures deal strength */
  discount: number
  /** Normalised likes+comments — measures social proof */
  engagement: number
}

// ── Tune these ───────────────────────────────────────────────────────────────

/** Signal weights per strip. Higher weight = that signal pulls products toward this strip. */
export const STRIP_WEIGHTS: Record<StripName, WeightProfile> = {
  //                    views  recency  discount  engagement
  trending: { views: 0.50, recency: 0.15, discount: 0.10, engagement: 0.25 },
  fresh:    { views: 0.05, recency: 0.75, discount: 0.05, engagement: 0.15 },
  deals:    { views: 0.10, recency: 0.10, discount: 0.65, engagement: 0.15 },
  preloved: { views: 0.10, recency: 0.35, discount: 0.00, engagement: 0.55 },
}

/**
 * When two strips compete for the same product, the strip that appears
 * earlier in this list wins.  Put the most curated/specific strips first;
 * "fresh" is the catch-all and should always be last.
 */
export const STRIP_PRIORITY: StripName[] = ['trending', 'deals', 'preloved', 'fresh']

// ── Internals ────────────────────────────────────────────────────────────────

type NormalisedCandidate = StripCandidate & {
  _norm: { views: number; recency: number; discount: number; engagement: number }
}

function normalisePool(candidates: StripCandidate[]): NormalisedCandidate[] {
  if (!candidates.length) return []

  const maxViews = Math.max(...candidates.map((p) => p.viewCount ?? 0), 1)
  const maxDiscount = Math.max(...candidates.map((p) => p.discount ?? 0), 1)
  const maxEngagement = Math.max(
    ...candidates.map((p) => (p._count?.likes ?? 0) + (p._count?.comments ?? 0)),
    1,
  )
  const now = Date.now()
  const ages = candidates.map((p) => now - new Date(p.created_at).getTime())
  const maxAge = Math.max(...ages, 1)

  return candidates.map((p, i) => ({
    ...p,
    _norm: {
      views:      (p.viewCount ?? 0) / maxViews,
      discount:   (p.discount ?? 0) / maxDiscount,
      engagement: ((p._count?.likes ?? 0) + (p._count?.comments ?? 0)) / maxEngagement,
      recency:    1 - ages[i]! / maxAge,  // 1 = newest, 0 = oldest
    },
  }))
}

function stripScore(p: NormalisedCandidate, strip: StripName): number {
  const w = STRIP_WEIGHTS[strip]
  const n = p._norm
  return (
    w.views      * n.views +
    w.recency    * n.recency +
    w.discount   * n.discount +
    w.engagement * n.engagement
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Takes over-fetched strip candidate pools (may overlap across pools),
 * scores them per strip, and returns each strip with no shared products.
 *
 * @param input  One over-fetched array per strip name.
 * @param size   Target products per strip after deduplication.
 */
export function assignStrips<T extends StripCandidate>(
  input: Record<StripName, T[]>,
  size: number,
): Record<StripName, T[]> {
  // 1. Build a unified pool for normalisation — scores are relative to ALL candidates
  //    so that a product's engagement is compared against the full field, not per-strip.
  const byId = new Map<number, T>()
  for (const strip of STRIP_PRIORITY) {
    for (const p of input[strip]) {
      if (!byId.has(p.id)) byId.set(p.id, p)
    }
  }

  const normById = new Map(
    normalisePool([...byId.values()]).map((p) => [p.id, p]),
  )

  const seen = new Set<number>()
  const result = {} as Record<StripName, T[]>

  // 2. Fill strips in priority order.
  //    Each strip only ranks from ITS OWN submitted candidates (pre-filtered by the
  //    DB query), minus any already claimed by a higher-priority strip.
  //    This ensures a preloved-only product can never be stolen by deals.
  for (const strip of STRIP_PRIORITY) {
    const ranked = input[strip]
      .filter((p) => !seen.has(p.id))
      .map((p) => normById.get(p.id)!)
      .filter(Boolean)
      .sort((a, b) => stripScore(b, strip) - stripScore(a, strip))
      .slice(0, size)
      .map((p) => byId.get(p.id)!)  // return original shape, not the normalised copy

    result[strip] = ranked
    for (const p of ranked) seen.add(p.id)
  }

  return result
}
