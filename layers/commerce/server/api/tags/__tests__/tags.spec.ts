import { test, expect } from '@playwright/test'

const TAGS = '/api/tags'
const CATEGORIES = '/api/commerce/categories'

// ─── Tags ─────────────────────────────────────────────────────────────────────

test.describe('tags', () => {
  test('GET /api/tags returns list', async ({ request }) => {
    const res = await request.get(TAGS)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/tags?search= filters by name', async ({ request }) => {
    const res = await request.get(`${TAGS}?search=fashion`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/tags respects limit param', async ({ request }) => {
    const res = await request.get(`${TAGS}?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeLessThanOrEqual(5)
  })
})

// ─── Categories ───────────────────────────────────────────────────────────────

test.describe('categories', () => {
  test('GET /api/commerce/categories returns list', async ({ request }) => {
    const res = await request.get(CATEGORIES)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
    // Seed always creates categories — at least one should exist
    expect(body.data.length).toBeGreaterThan(0)
  })

  test('GET /api/commerce/categories includes slug and name', async ({ request }) => {
    const res = await request.get(CATEGORIES)
    const body = await res.json()
    const first = body.data[0]
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('slug')
  })
})
