import { test, expect } from '@playwright/test'

// ─── GET /api/tags/:id/products ───────────────────────────────────────────────

test.describe('tags — products by tag', () => {
  let tagId: number

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tags?limit=1')
    const body = await res.json()
    tagId = body.data?.[0]?.id ?? 0
  })

  test('GET /api/tags/:id/products returns 400 for non-numeric ID', async ({ request }) => {
    const res = await request.get('/api/tags/not-a-number/products')
    expect(res.status()).toBe(400)
  })

  test('GET /api/tags/:id/products returns 400 for zero ID', async ({ request }) => {
    const res = await request.get('/api/tags/0/products')
    expect(res.status()).toBe(400)
  })

  test('GET /api/tags/:id/products returns 404 for unknown tag', async ({ request }) => {
    const res = await request.get('/api/tags/999999/products')
    expect(res.status()).toBe(404)
  })

  test('GET /api/tags/:id/products returns products for valid seed tag', async ({ request }) => {
    if (!tagId) return
    const res = await request.get(`/api/tags/${tagId}/products`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('products')
    expect(body.data).toHaveProperty('tag')
    expect(body.data).toHaveProperty('total')
    expect(Array.isArray(body.data.products)).toBe(true)
  })

  test('GET /api/tags/:id/products respects limit param', async ({ request }) => {
    if (!tagId) return
    const res = await request.get(`/api/tags/${tagId}/products?limit=3`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.products.length).toBeLessThanOrEqual(3)
  })
})
