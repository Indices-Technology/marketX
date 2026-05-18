/**
 * Feed Ranking Algorithm
 *
 * Re-ranks an already-fetched batch of feed items (posts, products, or mixed)
 * using a weighted combination of recency decay and engagement signals.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * Each item gets a score:
 *
 *   score = recency × decay(age) + engagement × norm(likes+comments+shares)
 *           + social × isFollowed + commercial × isPremium
 *
 * Items are then sorted descending by score and returned.
 * This function makes NO extra DB calls — pass engagement counts from the
 * same query you already ran.
 *
 * ── Tuning ──────────────────────────────────────────────────────────────────
 * Edit FEED_PROFILES to adjust the feel of each feed.
 *
 *   halfLifeHours  — how many hours until a post's recency score halves.
 *                    Smaller = feeds feel fresher.  Larger = viral content
 *                    stays visible longer.
 *
 *   engagement     — higher = trending/viral posts surface more aggressively.
 *
 *   social         — boost for content from authors the viewer follows.
 *                    Set to 0 when the feed is already pre-filtered to follows.
 *
 *   commercial     — boost for isPremium seller content (product cards).
 *
 * All weights are relative — they don't need to sum to 1, but it helps
 * reasoning to keep them normalised.
 */

export type RankableItem = {
  id: string | number
  created_at: Date | string
  authorId?: string
  likeCount?: number | null
  commentCount?: number | null
  shareCount?: number | null
  viewCount?: number | null
  isPremium?: boolean
}

type FeedProfile = {
  recency: number
  engagement: number
  social: number
  commercial: number
  halfLifeHours: number
}

// ── Tune these ────────────────────────────────────────────────────────────────

export const FEED_PROFILES: Record<string, FeedProfile> = {
  /**
   * Home feed — discovery-focused.
   * Balances fresh content with highly-engaged posts.
   * Small social & commercial boosts for variety.
   */
  home: {
    recency:       0.35,
    engagement:    0.45,
    social:        0.10,
    commercial:    0.10,
    halfLifeHours: 24,
  },

  /**
   * Following feed — social-focused.
   * Prioritises freshness from your network over raw virality.
   * social = 0 because the feed is already pre-filtered to followed authors.
   */
  following: {
    recency:       0.55,
    engagement:    0.40,
    social:        0.00,
    commercial:    0.05,
    halfLifeHours: 48,
  },

  /**
   * Discover feed — engagement-first.
   * Surfaces the most compelling content regardless of age.
   * Wider half-life so quality older posts can still surface.
   */
  discover: {
    recency:       0.20,
    engagement:    0.60,
    social:        0.05,
    commercial:    0.15,
    halfLifeHours: 72,
  },
}

// ── Internals ─────────────────────────────────────────────────────────────────

function recencyDecay(createdAt: Date | string, halfLifeHours: number): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  // Exponential half-life: 1.0 at age 0, 0.5 at age = halfLifeHours
  return Math.pow(0.5, ageHours / halfLifeHours)
}

function rawEngagement(item: RankableItem): number {
  // Shares weighted 3× (high-intent), comments 2× (effort), likes 1×
  return (
    (item.likeCount ?? 0) +
    2 * (item.commentCount ?? 0) +
    3 * (item.shareCount ?? 0)
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Re-ranks a batch of feed items in-place order.
 * Returns a new sorted array — original array is not mutated.
 *
 * @param items        Feed items (posts and/or products)
 * @param profileKey   Which profile to use: 'home' | 'following' | 'discover'
 * @param followedIds  Set of author IDs the current viewer follows (optional).
 *                     Only meaningful when the profile's `social` weight > 0.
 */
export function rankFeedItems<T extends RankableItem>(
  items: T[],
  profileKey: string,
  followedIds?: Set<string>,
): T[] {
  if (items.length <= 1) return items

  const cfg = FEED_PROFILES[profileKey] ?? FEED_PROFILES.home!

  // Normalise engagement to [0, 1] within this batch
  const engagements = items.map(rawEngagement)
  const maxEngagement = Math.max(...engagements, 1)

  const scored = items.map((item, i) => {
    const rScore = recencyDecay(item.created_at, cfg.halfLifeHours)
    const eScore = engagements[i]! / maxEngagement
    const sScore = (cfg.social > 0 && followedIds?.has(String(item.authorId))) ? 1.0 : 0.0
    const cScore = item.isPremium ? 1.0 : 0.0

    return {
      item,
      score:
        cfg.recency    * rScore +
        cfg.engagement * eScore +
        cfg.social     * sScore +
        cfg.commercial * cScore,
    }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
}
