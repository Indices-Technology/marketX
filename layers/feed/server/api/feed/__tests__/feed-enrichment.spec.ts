import { test, expect } from '@playwright/test'

// Guards the trust-signal enrichment added to the feed product/seller selects:
//   product: averageRating, totalReviews, square{name,slug}
//   seller:  is_verified, locationLabel
// A wrong Prisma field name would 500 these endpoints; a dropped select would
// make the field `undefined` (vs. present-but-null), which these assert against.

const hasKey = (obj: any, key: string) => obj != null && key in obj

test.describe('feed enrichment — GET /api/feed/deals', () => {
  test('deal products carry rating + market + verified/location', async ({
    request,
  }) => {
    const res = await request.get('/api/feed/deals?limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const products = body.data ?? []
    test.skip(products.length === 0, 'no live flash deals in the test DB')

    const p = products[0]
    expect('averageRating' in p).toBe(true)
    expect('totalReviews' in p).toBe(true)
    expect('square' in p).toBe(true) // null or { name, slug }
    expect(hasKey(p.seller, 'is_verified')).toBe(true)
    expect(hasKey(p.seller, 'locationLabel')).toBe(true)
  })
})

test.describe('feed enrichment — GET /api/feed/fresh-drops', () => {
  test('fresh products carry rating + market + verified', async ({
    request,
  }) => {
    const res = await request.get('/api/feed/fresh-drops?limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const products = body.data ?? []
    // Fresh-drops falls back to recent products, so it should never be empty.
    expect(products.length).toBeGreaterThan(0)

    const p = products[0]
    expect('averageRating' in p).toBe(true)
    expect('square' in p).toBe(true)
    expect(hasKey(p.seller, 'is_verified')).toBe(true)
  })
})

test.describe('feed enrichment — GET /api/feed/trending', () => {
  test('featured traders carry verified + rating', async ({ request }) => {
    const res = await request.get('/api/feed/trending')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const sellers = body.data?.featuredSellers ?? []
    test.skip(sellers.length === 0, 'no featured sellers in the test DB')

    const s = sellers[0]
    expect('is_verified' in s).toBe(true)
    expect('averageRating' in s).toBe(true)
    expect('totalReviews' in s).toBe(true)
  })

  test('trending products carry rating + market + verified', async ({
    request,
  }) => {
    const res = await request.get('/api/feed/trending')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const products = body.data?.trendingProducts ?? []
    test.skip(products.length === 0, 'no trending products in the test DB')

    const p = products[0]
    expect('averageRating' in p).toBe(true)
    expect('square' in p).toBe(true)
    expect(hasKey(p.seller, 'is_verified')).toBe(true)
    expect(hasKey(p.seller, 'locationLabel')).toBe(true)
  })
})
