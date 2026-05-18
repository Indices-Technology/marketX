import { describe, it, expect } from 'vitest'
import {
  assignStrips,
  STRIP_WEIGHTS,
  STRIP_PRIORITY,
  type StripCandidate,
  type StripName,
} from '../discoverAlgorithm'

// ── Fixture helpers ──────────────────────────────────────────────────────────

const now = Date.now()

function makeProduct(overrides: Partial<StripCandidate> & { id: number }): StripCandidate {
  return {
    viewCount: 0,
    discount: null,
    isThrift: false,
    isDeal: false,
    created_at: new Date(now - 3_600_000),  // 1 hour ago
    _count: { likes: 0, comments: 0 },
    ...overrides,
  }
}

function hoursAgo(h: number): Date {
  return new Date(now - h * 3_600_000)
}

// Generates a pool where every strip gets the same 5 products (worst case overlap)
function overlappingPool(ids: number[]): Record<StripName, StripCandidate[]> {
  const products = ids.map((id) => makeProduct({ id }))
  return { trending: products, fresh: products, deals: products, preloved: products }
}

// ── No-overlap guarantee ─────────────────────────────────────────────────────

describe('assignStrips — no-overlap guarantee', () => {
  it('each product appears in at most one strip', () => {
    const pool = overlappingPool([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    const result = assignStrips(pool, 3)

    const allIds = [
      ...result.trending.map((p) => p.id),
      ...result.fresh.map((p) => p.id),
      ...result.deals.map((p) => p.id),
      ...result.preloved.map((p) => p.id),
    ]
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
  })

  it('no duplicate ids within a single strip', () => {
    const pool = overlappingPool([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    const result = assignStrips(pool, 3)

    for (const strip of STRIP_PRIORITY) {
      const ids = result[strip].map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('total products across all strips ≤ pool size', () => {
    const pool = overlappingPool([1, 2, 3, 4, 5, 6])
    const result = assignStrips(pool, 2)

    const total = Object.values(result).reduce((sum, strip) => sum + strip.length, 0)
    expect(total).toBeLessThanOrEqual(6)
  })
})

// ── Strip size ───────────────────────────────────────────────────────────────

describe('assignStrips — strip sizing', () => {
  it('each strip has at most `size` products', () => {
    const pool = overlappingPool([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const result = assignStrips(pool, 4)

    for (const strip of STRIP_PRIORITY) {
      expect(result[strip].length).toBeLessThanOrEqual(4)
    }
  })

  it('strips are smaller than size when not enough unique candidates remain', () => {
    // Only 5 total products, size=4 — lower-priority strips get fewer
    const pool = overlappingPool([1, 2, 3, 4, 5])
    const result = assignStrips(pool, 4)

    const total = Object.values(result).reduce((sum, s) => sum + s.length, 0)
    expect(total).toBe(5)  // all 5 products claimed, spread across strips
  })

  it('handles size=1 per strip', () => {
    const pool = overlappingPool([1, 2, 3, 4])
    const result = assignStrips(pool, 1)

    for (const strip of STRIP_PRIORITY) {
      expect(result[strip].length).toBeLessThanOrEqual(1)
    }
    // 4 products, 4 strips, size=1 → each strip gets exactly 1
    const total = Object.values(result).reduce((sum, s) => sum + s.length, 0)
    expect(total).toBe(4)
  })
})

// ── Signal routing ───────────────────────────────────────────────────────────

describe('assignStrips — signal routing', () => {
  it('highly viewed products land in trending', () => {
    const viral  = makeProduct({ id: 1, viewCount: 10_000, created_at: hoursAgo(48) })
    const fresh  = makeProduct({ id: 2, viewCount: 10,    created_at: hoursAgo(1) })
    const deal   = makeProduct({ id: 3, viewCount: 5,     discount: 50, created_at: hoursAgo(2) })
    const thrift = makeProduct({ id: 4, viewCount: 5,     isThrift: true, created_at: hoursAgo(3) })

    const result = assignStrips(
      { trending: [viral, fresh, deal, thrift], fresh: [viral, fresh, deal, thrift], deals: [deal], preloved: [thrift] },
      1,
    )

    expect(result.trending[0]?.id).toBe(1)
  })

  it('highly discounted products land in deals when competing with fresh drops', () => {
    const deepDiscount = makeProduct({ id: 10, discount: 80, viewCount: 50,  created_at: hoursAgo(24) })
    const brandNew     = makeProduct({ id: 20, discount: 0,  viewCount: 10,  created_at: hoursAgo(0.5) })
    const popular      = makeProduct({ id: 30, discount: 0,  viewCount: 500, created_at: hoursAgo(12) })

    const result = assignStrips(
      {
        trending: [popular, deepDiscount, brandNew],
        fresh:    [brandNew, deepDiscount, popular],
        deals:    [deepDiscount],
        preloved: [],
      },
      1,
    )

    expect(result.deals[0]?.id).toBe(10)
  })

  it('thrift items with high engagement land in preloved when trending has a dominant view-count product', () => {
    // Give trending a clearly dominant product via viewCount (the trending strip's #1 signal)
    // so it claims that product and leaves the thrift item for preloved.
    const viralProduct  = makeProduct({ id: 1, viewCount: 50_000, created_at: hoursAgo(12) })
    const engagedThrift = makeProduct({
      id: 99,
      isThrift: true,
      viewCount: 0,
      _count: { likes: 500, comments: 200 },
      created_at: hoursAgo(6),
    })

    const result = assignStrips(
      {
        trending: [viralProduct, engagedThrift],
        fresh:    [viralProduct],
        deals:    [],
        preloved: [engagedThrift],
      },
      1,
    )

    // viralProduct dominates trending via viewCount; engagedThrift falls to preloved
    expect(result.trending[0]?.id).toBe(1)
    expect(result.preloved[0]?.id).toBe(99)
  })

  it('brand new low-engagement products end up in fresh (catch-all) when trending has a dominant view-count product', () => {
    // Trending needs a clear winner (high viewCount) so the brand-new product with 0 views
    // doesn't accidentally get claimed by trending via its recency score.
    const viralOld = makeProduct({ id: 55, viewCount: 20_000, created_at: hoursAgo(24) })
    const brandNew = makeProduct({ id: 77, viewCount: 0, discount: null, isThrift: false, created_at: hoursAgo(0.1) })

    const result = assignStrips(
      {
        trending: [viralOld, brandNew],
        fresh:    [viralOld, brandNew],
        deals:    [],
        preloved: [],
      },
      1,
    )

    // viralOld wins trending; brandNew is unclaimed and goes to fresh
    expect(result.trending[0]?.id).toBe(55)
    expect(result.fresh[0]?.id).toBe(77)
  })
})

// ── Priority ordering ─────────────────────────────────────────────────────────

describe('assignStrips — STRIP_PRIORITY ordering', () => {
  it('STRIP_PRIORITY ends with "fresh" (the catch-all)', () => {
    expect(STRIP_PRIORITY[STRIP_PRIORITY.length - 1]).toBe('fresh')
  })

  it('higher-priority strips are filled before lower-priority ones', () => {
    // With only 2 products and size=1 per strip, the first 2 in STRIP_PRIORITY get a product
    const products = [
      makeProduct({ id: 1, viewCount: 100 }),
      makeProduct({ id: 2, viewCount: 90 }),
    ]

    const result = assignStrips(
      { trending: products, fresh: products, deals: products, preloved: products },
      1,
    )

    const filledStrips = STRIP_PRIORITY.filter((s) => result[s].length === 1)
    const emptyStrips  = STRIP_PRIORITY.filter((s) => result[s].length === 0)

    // First 2 strips in priority order should be filled
    expect(filledStrips[0]).toBe(STRIP_PRIORITY[0])
    expect(filledStrips[1]).toBe(STRIP_PRIORITY[1])
    // Last 2 strips empty because all products claimed
    expect(emptyStrips).toEqual([STRIP_PRIORITY[2], STRIP_PRIORITY[3]])
  })
})

// ── Edge cases ───────────────────────────────────────────────────────────────

describe('assignStrips — edge cases', () => {
  it('returns empty strips when all inputs are empty', () => {
    const result = assignStrips({ trending: [], fresh: [], deals: [], preloved: [] }, 10)

    for (const strip of STRIP_PRIORITY) {
      expect(result[strip]).toEqual([])
    }
  })

  it('handles size larger than total pool without throwing', () => {
    const pool = overlappingPool([1, 2])
    expect(() => assignStrips(pool, 100)).not.toThrow()
  })

  it('handles products with null/undefined optional fields', () => {
    const sparse = makeProduct({ id: 1, discount: null, _count: undefined as any })
    const result = assignStrips(
      { trending: [sparse], fresh: [sparse], deals: [], preloved: [] },
      1,
    )

    expect(result.trending.length + result.fresh.length).toBe(1)
  })

  it('preserves original product shape — does not strip fields', () => {
    const product = { ...makeProduct({ id: 42 }), title: 'Test Product', price: 9900 }
    const result = assignStrips(
      { trending: [product], fresh: [], deals: [], preloved: [] },
      1,
    )

    const found = [...result.trending, ...result.fresh, ...result.deals, ...result.preloved].find(
      (p) => p.id === 42,
    ) as any
    expect(found?.title).toBe('Test Product')
    expect(found?.price).toBe(9900)
  })
})

// ── STRIP_WEIGHTS sanity ──────────────────────────────────────────────────────

describe('STRIP_WEIGHTS — configuration sanity', () => {
  it('all weight values are between 0 and 1', () => {
    for (const [strip, weights] of Object.entries(STRIP_WEIGHTS)) {
      for (const [signal, value] of Object.entries(weights)) {
        expect(value, `${strip}.${signal}`).toBeGreaterThanOrEqual(0)
        expect(value, `${strip}.${signal}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('each strip has entries for all four signals', () => {
    const signals = ['views', 'recency', 'discount', 'engagement']
    for (const strip of STRIP_PRIORITY) {
      for (const signal of signals) {
        expect(STRIP_WEIGHTS[strip]).toHaveProperty(signal)
      }
    }
  })

  it('fresh strip has the highest recency weight (it is the freshness strip)', () => {
    const freshRecency = STRIP_WEIGHTS.fresh.recency
    for (const other of ['trending', 'deals', 'preloved'] as StripName[]) {
      expect(freshRecency).toBeGreaterThan(STRIP_WEIGHTS[other].recency)
    }
  })

  it('deals strip has the highest discount weight', () => {
    const dealsDiscount = STRIP_WEIGHTS.deals.discount
    for (const other of ['trending', 'fresh', 'preloved'] as StripName[]) {
      expect(dealsDiscount).toBeGreaterThan(STRIP_WEIGHTS[other].discount)
    }
  })

  it('trending strip has the highest views weight', () => {
    const trendingViews = STRIP_WEIGHTS.trending.views
    for (const other of ['fresh', 'deals', 'preloved'] as StripName[]) {
      expect(trendingViews).toBeGreaterThan(STRIP_WEIGHTS[other].views)
    }
  })
})
