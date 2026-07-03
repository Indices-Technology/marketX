import { test, expect } from '@playwright/test'

// Covers the market-first additions to GET /api/commerce/products:
//   - ?storeSlug=  → a trader's goods
//   - ?squareSlug= → goods that live inside a market square
//   - product detail now carries the `square` relation
// These guard the Prisma selects/filters — a wrong field/relation name would 500 here.

const LIST = '/api/commerce/products'
const BY_SLUG = (s: string) => `/api/commerce/products/by-slug/${s}`
const SEED_PRODUCT = 'adire-tie-dye-maxi-dress' // prisma/seed.ts
const GEO_SQUARE = 'balogun-market-lagos' // prisma/seed.ts

test.describe('GET /api/commerce/products — ?storeSlug filter', () => {
  test('returns only the given trader’s goods', async ({ request }) => {
    // Derive a real store from seed data so the test is seed-agnostic.
    const all = await (await request.get(`${LIST}?limit=20`)).json()
    const storeSlug = all.data.products.find((p: any) => p.store_slug)
      ?.store_slug as string | undefined
    test.skip(!storeSlug, 'no products with a store_slug in the test DB')

    const res = await request.get(`${LIST}?storeSlug=${storeSlug}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.products.length).toBeGreaterThan(0)
    for (const p of body.data.products) {
      expect(p.store_slug).toBe(storeSlug)
    }
  })

  test('unknown storeSlug returns an empty list (no error)', async ({
    request,
  }) => {
    const res = await request.get(`${LIST}?storeSlug=no-such-store-xyz-99999`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.products.length).toBe(0)
  })
})

test.describe('GET /api/commerce/products — ?squareSlug filter', () => {
  test('is accepted for a real market (no 500)', async ({ request }) => {
    const res = await request.get(`${LIST}?squareSlug=${GEO_SQUARE}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.products)).toBe(true)
  })

  test('unknown squareSlug returns an empty list (no error)', async ({
    request,
  }) => {
    const res = await request.get(`${LIST}?squareSlug=no-such-market-xyz-99999`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.products.length).toBe(0)
  })
})

test.describe('GET /api/commerce/products/by-slug/:slug — market context', () => {
  test('product detail includes the `square` relation', async ({ request }) => {
    const res = await request.get(BY_SLUG(SEED_PRODUCT))
    expect(res.status()).toBe(200)
    const body = await res.json()
    // Present as null (independent trader) or { name, slug } (in a market).
    expect('square' in body.data).toBe(true)
    if (body.data.square) {
      expect(typeof body.data.square.slug).toBe('string')
      expect(typeof body.data.square.name).toBe('string')
    }
  })
})
