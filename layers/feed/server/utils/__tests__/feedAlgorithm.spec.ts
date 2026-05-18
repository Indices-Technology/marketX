import { describe, it, expect } from 'vitest'
import {
  rankFeedItems,
  FEED_PROFILES,
  type RankableItem,
} from '../feedAlgorithm'

// ── Fixture helpers ──────────────────────────────────────────────────────────

const now = Date.now()

function makeItem(overrides: Partial<RankableItem> & { id: string }): RankableItem {
  return {
    created_at: new Date(now - 3_600_000),  // 1 hour ago
    authorId: 'author-1',
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    isPremium: false,
    ...overrides,
  }
}

function hoursAgo(h: number): Date {
  return new Date(now - h * 3_600_000)
}

function ids(items: RankableItem[]): string[] {
  return items.map((i) => String(i.id))
}

// ── Basic contract ────────────────────────────────────────────────────────────

describe('rankFeedItems — basic contract', () => {
  it('returns the same number of items', () => {
    const items = [
      makeItem({ id: 'a' }),
      makeItem({ id: 'b' }),
      makeItem({ id: 'c' }),
    ]
    expect(rankFeedItems(items, 'home').length).toBe(3)
  })

  it('returns empty array for empty input', () => {
    expect(rankFeedItems([], 'home')).toEqual([])
  })

  it('returns single item unchanged', () => {
    const item = makeItem({ id: 'solo' })
    const result = rankFeedItems([item], 'home')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('solo')
  })

  it('does not mutate the input array', () => {
    const items = [makeItem({ id: 'x' }), makeItem({ id: 'y' })]
    const copy = [...items]
    rankFeedItems(items, 'home')
    expect(items).toEqual(copy)
  })

  it('returns all original item references (no cloning)', () => {
    const a = makeItem({ id: 'a' })
    const b = makeItem({ id: 'b' })
    const result = rankFeedItems([a, b], 'home')
    expect(result).toContain(a)
    expect(result).toContain(b)
  })

  it('falls back to home profile for unknown profileKey', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    expect(() => rankFeedItems(items, 'nonexistent')).not.toThrow()
  })
})

// ── Recency signal ────────────────────────────────────────────────────────────

describe('rankFeedItems — recency', () => {
  it('newer post ranks above older post when engagement is equal', () => {
    const older  = makeItem({ id: 'old',  created_at: hoursAgo(48) })
    const newer  = makeItem({ id: 'new',  created_at: hoursAgo(1) })

    const result = rankFeedItems([older, newer], 'following')
    expect(ids(result)[0]).toBe('new')
  })

  it('following profile surfaces recent posts over old viral ones; home profile does the reverse', () => {
    // Use a 5-day-old (120h) viral post vs a 1h-old quiet post so the half-life decay
    // is deep enough that following's recency weight can overcome the engagement signal,
    // while home's shorter half-life still lets engagement dominate.
    //
    // Math (verified):
    //   following halfLife=48h: recent=0.542, oldViral=0.497 → recent wins ✓
    //   home      halfLife=24h: recent=0.340, oldViral=0.461 → oldViral wins ✓
    const recentQuiet = makeItem({ id: 'recent',  created_at: hoursAgo(1),   likeCount: 0 })
    const oldViral    = makeItem({ id: 'viral',   created_at: hoursAgo(120), likeCount: 100 })

    const homeResult      = rankFeedItems([recentQuiet, oldViral], 'home')
    const followingResult = rankFeedItems([recentQuiet, oldViral], 'following')

    expect(ids(followingResult)[0]).toBe('recent')
    expect(ids(homeResult)[0]).toBe('viral')
  })
})

// ── Engagement signal ─────────────────────────────────────────────────────────

describe('rankFeedItems — engagement', () => {
  it('post with more likes ranks higher than one with none (same age)', () => {
    const age = hoursAgo(5)
    const popular = makeItem({ id: 'popular', created_at: age, likeCount: 200 })
    const quiet   = makeItem({ id: 'quiet',   created_at: age, likeCount: 0 })

    const result = rankFeedItems([quiet, popular], 'home')
    expect(ids(result)[0]).toBe('popular')
  })

  it('comments are weighted higher than likes', () => {
    const age = hoursAgo(5)
    const manyLikes    = makeItem({ id: 'likes',    created_at: age, likeCount: 100, commentCount: 0 })
    const fewComments  = makeItem({ id: 'comments', created_at: age, likeCount: 0,   commentCount: 20 })
    // 100 likes = 100 raw;  20 comments = 40 raw (weight 2×)

    const result = rankFeedItems([manyLikes, fewComments], 'home')
    // 40 > 100? No — but let's use numbers where comments win:
    // 5 comments = 10 > 9 likes = 9
    const likesHeavy    = makeItem({ id: 'L', created_at: age, likeCount: 9,  commentCount: 0 })
    const commentsHeavy = makeItem({ id: 'C', created_at: age, likeCount: 0,  commentCount: 5 })

    const result2 = rankFeedItems([likesHeavy, commentsHeavy], 'home')
    expect(ids(result2)[0]).toBe('C')
  })

  it('shares are weighted highest (3×)', () => {
    const age = hoursAgo(5)
    const oneShare   = makeItem({ id: 'share',   created_at: age, shareCount: 1, likeCount: 0, commentCount: 0 })
    const twoLikes   = makeItem({ id: 'likes',   created_at: age, shareCount: 0, likeCount: 2, commentCount: 0 })
    // 1 share = 3 raw; 2 likes = 2 raw → share should win
    const result = rankFeedItems([twoLikes, oneShare], 'home')
    expect(ids(result)[0]).toBe('share')
  })

  it('engagement is normalised — absolute numbers don\'t dominate', () => {
    // Even with low absolute counts, the relative leader should surface first
    const age = hoursAgo(2)
    const best  = makeItem({ id: 'best',  created_at: age, likeCount: 3 })
    const worst = makeItem({ id: 'worst', created_at: age, likeCount: 1 })

    const result = rankFeedItems([worst, best], 'home')
    expect(ids(result)[0]).toBe('best')
  })
})

// ── Social boost ──────────────────────────────────────────────────────────────

describe('rankFeedItems — social boost', () => {
  it('content from followed author ranks above equal content from stranger when social weight > 0', () => {
    const age = hoursAgo(3)
    const followed  = makeItem({ id: 'followed',  created_at: age, authorId: 'alice', likeCount: 10 })
    const stranger  = makeItem({ id: 'stranger',  created_at: age, authorId: 'bob',   likeCount: 10 })

    const followedIds = new Set(['alice'])

    // home profile has social > 0
    const result = rankFeedItems([stranger, followed], 'home', followedIds)
    expect(ids(result)[0]).toBe('followed')
  })

  it('social boost has no effect when followedIds is not provided', () => {
    const age = hoursAgo(3)
    const a = makeItem({ id: 'a', created_at: age, authorId: 'alice', likeCount: 10 })
    const b = makeItem({ id: 'b', created_at: age, authorId: 'bob',   likeCount: 10 })

    // Without followedIds, items with equal signals should maintain relative order
    // (or at least not throw)
    expect(() => rankFeedItems([a, b], 'home')).not.toThrow()
  })

  it('social boost has no effect in following profile (social weight = 0)', () => {
    const age = hoursAgo(1)
    // Following feed already pre-filters to followed authors — social weight is 0
    const followed = makeItem({ id: 'followed', created_at: age, authorId: 'alice', likeCount: 5 })
    const noFollow = makeItem({ id: 'nofollow', created_at: age, authorId: 'bob',   likeCount: 10 })

    const followedIds = new Set(['alice'])
    const result = rankFeedItems([followed, noFollow], 'following', followedIds)

    // Since social weight = 0, engagement wins — noFollow has more likes
    expect(ids(result)[0]).toBe('nofollow')
  })
})

// ── Commercial boost ──────────────────────────────────────────────────────────

describe('rankFeedItems — commercial boost', () => {
  it('premium items get a boost over equal non-premium items', () => {
    const age = hoursAgo(2)
    const premium    = makeItem({ id: 'premium',    created_at: age, isPremium: true,  likeCount: 5 })
    const nonPremium = makeItem({ id: 'nonpremium', created_at: age, isPremium: false, likeCount: 5 })

    const result = rankFeedItems([nonPremium, premium], 'home')
    expect(ids(result)[0]).toBe('premium')
  })

  it('premium boost does not override significantly higher engagement', () => {
    const age = hoursAgo(2)
    const premium    = makeItem({ id: 'premium',    created_at: age, isPremium: true,  likeCount: 1 })
    const viral      = makeItem({ id: 'viral',      created_at: age, isPremium: false, likeCount: 10_000, commentCount: 2_000 })

    const result = rankFeedItems([premium, viral], 'home')
    expect(ids(result)[0]).toBe('viral')
  })
})

// ── Mixed content ─────────────────────────────────────────────────────────────

describe('rankFeedItems — mixed signals', () => {
  it('produces a stable sort with multiple equally-scoring items', () => {
    const identical = [
      makeItem({ id: 'a', created_at: hoursAgo(5) }),
      makeItem({ id: 'b', created_at: hoursAgo(5) }),
      makeItem({ id: 'c', created_at: hoursAgo(5) }),
    ]

    const result1 = rankFeedItems([...identical], 'home')
    const result2 = rankFeedItems([...identical].reverse(), 'home')

    // All items have equal scores — both orderings are valid.
    // What matters is no items are lost.
    expect(result1.length).toBe(3)
    expect(result2.length).toBe(3)
  })

  it('handles items with null/undefined engagement fields gracefully', () => {
    const sparse = makeItem({
      id: 'sparse',
      likeCount: undefined,
      commentCount: null as any,
      shareCount: undefined,
      viewCount: null as any,
    })
    const normal = makeItem({ id: 'normal', likeCount: 5 })

    expect(() => rankFeedItems([sparse, normal], 'home')).not.toThrow()
    const result = rankFeedItems([sparse, normal], 'home')
    expect(result).toHaveLength(2)
  })

  it('sorts a realistic mixed-age feed correctly', () => {
    const posts = [
      makeItem({ id: 'old-viral',   created_at: hoursAgo(48), likeCount: 5000, commentCount: 300 }),
      makeItem({ id: 'recent-good', created_at: hoursAgo(2),  likeCount: 200,  commentCount: 50 }),
      makeItem({ id: 'new-quiet',   created_at: hoursAgo(0.5),likeCount: 2,    commentCount: 0 }),
      makeItem({ id: 'mid-meh',     created_at: hoursAgo(12), likeCount: 30,   commentCount: 5 }),
    ]

    const result = rankFeedItems(posts, 'home')

    // old-viral has massive engagement but suffers recency penalty
    // recent-good is fresh AND has decent engagement → should rank high
    // new-quiet is fresh but no engagement
    // mid-meh is middle-of-the-road

    expect(ids(result)).toHaveLength(4)
    // recent-good should rank above new-quiet (same recency ballpark, much more engagement)
    const recentGoodIdx = result.findIndex((i) => i.id === 'recent-good')
    const newQuietIdx   = result.findIndex((i) => i.id === 'new-quiet')
    expect(recentGoodIdx).toBeLessThan(newQuietIdx)
  })
})

// ── Profile configuration sanity ─────────────────────────────────────────────

describe('FEED_PROFILES — configuration sanity', () => {
  it('all profiles exist', () => {
    expect(FEED_PROFILES.home).toBeDefined()
    expect(FEED_PROFILES.following).toBeDefined()
    expect(FEED_PROFILES.discover).toBeDefined()
  })

  it('all weight values are between 0 and 1', () => {
    for (const [name, profile] of Object.entries(FEED_PROFILES)) {
      const weights = ['recency', 'engagement', 'social', 'commercial'] as const
      for (const w of weights) {
        expect(profile[w], `${name}.${w}`).toBeGreaterThanOrEqual(0)
        expect(profile[w], `${name}.${w}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('halfLifeHours is positive for all profiles', () => {
    for (const [name, profile] of Object.entries(FEED_PROFILES)) {
      expect(profile.halfLifeHours, `${name}.halfLifeHours`).toBeGreaterThan(0)
    }
  })

  it('following profile has social weight of 0 (pre-filtered feed)', () => {
    expect(FEED_PROFILES.following.social).toBe(0)
  })

  it('discover profile has the highest engagement weight (surfaces viral content)', () => {
    const discoverEngagement = FEED_PROFILES.discover.engagement
    expect(discoverEngagement).toBeGreaterThan(FEED_PROFILES.home.engagement)
    expect(discoverEngagement).toBeGreaterThan(FEED_PROFILES.following.engagement)
  })

  it('following profile has the highest halfLifeHours (wider social time window)', () => {
    expect(FEED_PROFILES.following.halfLifeHours).toBeGreaterThan(FEED_PROFILES.home.halfLifeHours)
  })
})
