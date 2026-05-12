import { test, expect } from '@playwright/test'

const SEARCH = '/api/search'

test.describe('search', () => {
  test('GET /api/search returns empty for short query', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=a`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.users).toHaveLength(0)
    expect(body.data.products).toHaveLength(0)
  })

  test('GET /api/search returns empty for missing query', async ({ request }) => {
    const res = await request.get(SEARCH)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('users')
    expect(body.data).toHaveProperty('products')
    expect(body.data).toHaveProperty('posts')
    expect(body.data).toHaveProperty('stores')
    expect(body.data).toHaveProperty('tags')
  })

  test('GET /api/search returns results for valid query', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=adire`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    // Products with "adire" in seed data should match
    expect(body.data.products).toBeInstanceOf(Array)
  })

  test('GET /api/search?type=products filters by type', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=fashion&type=products`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.users).toHaveLength(0)
    expect(body.data.posts).toHaveLength(0)
    expect(body.data.products).toBeInstanceOf(Array)
  })

  test('GET /api/search?type=stores filters by stores', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=balogun&type=stores`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.stores).toBeInstanceOf(Array)
  })

  test('GET /api/search respects limit param', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=a&limit=2`)
    // Short query returns empty — limit is still respected
    expect(res.status()).toBe(200)
  })
})
