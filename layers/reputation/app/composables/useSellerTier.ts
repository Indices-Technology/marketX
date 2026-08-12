// Seller tier lookup for compact surfaces (feed action rail, product tiles).
//
// FALLBACK PATH ONLY. Tier is denormalised onto SellerProfile, so any query that
// already joins a seller row carries it for free — the feed reads `author.tier`
// straight off the payload and never reaches this file. What's left for it: a
// cached page served before that field existed, and callers that build items
// from a slimmer select.
//
// Even so it batches, because those callers are per-slide components and slides
// mount together. Slugs requested in the same tick become one call, and answers
// are cached for the page's lifetime (nulls included, so an unranked seller
// isn't re-asked).
//
// Client-only by design: the cache is module state, which in SSR is shared
// across every request. Tiers are public and identical for all viewers, so
// there is no leak of user data, but populating it on the server would still
// grow unbounded and serve one visitor's batch to the next. Instead SSR renders
// the caller's fallback and hydration fills the real label in.

import { reactive } from 'vue'
import { useReputationApi } from '../services/reputation.api'
import type { TrustTier } from '../types/trust.types'

/** Reactive so a slide re-renders when its batch lands. */
const cache = reactive(new Map<string, TrustTier | null>())
const pending = new Set<string>()
let scheduled = false

/** The one place a tier is turned into words for a compact surface. */
export const TIER_LABELS: Record<TrustTier, string> = {
  TIER_1: 'Tier 1',
  TIER_2: 'Tier 2',
  TIER_3: 'Tier 3',
}

async function flush() {
  scheduled = false
  const slugs = [...pending]
  pending.clear()
  if (!slugs.length) return

  try {
    const res = (await useReputationApi().getTiers(slugs)) as {
      data?: Record<string, TrustTier | null>
    } | null
    const data = res?.data ?? {}
    for (const slug of slugs) cache.set(slug, data[slug] ?? null)
  } catch {
    // A missing tier is a cosmetic gap, never a blocker. Cache the null so a
    // failing endpoint can't turn every slide into a retry loop.
    for (const slug of slugs) cache.set(slug, null)
  }
}

export function useSellerTier() {
  /** Queue a slug for the next batch; returns immediately. */
  const request = (slug?: string | null) => {
    if (!import.meta.client || !slug || cache.has(slug) || pending.has(slug))
      return
    pending.add(slug)
    if (scheduled) return
    scheduled = true
    // A tick is enough: every slide in a screen mounts within the same one.
    setTimeout(flush, 0)
  }

  /** The seller's tier, or null while loading / when unranked. */
  const tierFor = (slug?: string | null): TrustTier | null => {
    request(slug)
    return (slug && cache.get(slug)) || null
  }

  /** Display label ("Tier 2"), or null when there is no earned tier to show. */
  const tierLabelFor = (slug?: string | null): string | null => {
    const tier = tierFor(slug)
    return tier ? TIER_LABELS[tier] : null
  }

  return { tierFor, tierLabelFor }
}
