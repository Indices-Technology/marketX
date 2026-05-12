import { test, expect } from '@playwright/test'

const FEED = '/api/feed'
const BALOGUN_SQUARE = 'balogun-market-lagos'

// ─── Public feed endpoints not covered in feed.spec.ts ────────────────────────

test.describe('feed — extended public endpoints', () => {
  test('GET /api/feed/fresh-drops returns products', async ({ request }) => {
    const res = await request.get(`${FEED}/fresh-drops`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  test('GET /api/feed/pre-loved returns products', async ({ request }) => {
    const res = await request.get(`${FEED}/pre-loved`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  test('GET /api/feed/reels returns content', async ({ request }) => {
    const res = await request.get(`${FEED}/reels`)
    expect(res.status()).toBe(200)
  })

  test('GET /api/feed/shop-today returns content', async ({ request }) => {
    const res = await request.get(`${FEED}/shop-today`)
    expect(res.status()).toBe(200)
  })

  test('GET /api/feed/squares/:slug returns square feed', async ({ request }) => {
    const res = await request.get(`${FEED}/squares/${BALOGUN_SQUARE}`)
    expect(res.status()).toBe(200)
  })

  test('GET /api/feed/fresh-drops respects limit param', async ({ request }) => {
    const res = await request.get(`${FEED}/fresh-drops?limit=5`)
    expect(res.status()).toBe(200)
  })
})
