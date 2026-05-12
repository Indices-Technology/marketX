import { test, expect } from '@playwright/test'

const MENTIONS = '/api/mentions/search'

// ─── GET /api/mentions/search ──────────────────────────────────────────────────

test.describe('mentions — search', () => {
  test('GET /api/mentions/search is public (no auth required)', async ({ request }) => {
    const res = await request.get(`${MENTIONS}?q=balogun`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/mentions/search with empty query returns empty array', async ({ request }) => {
    const res = await request.get(MENTIONS)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toBeInstanceOf(Array)
    expect(body.data.length).toBe(0)
  })

  test('GET /api/mentions/search result shape is correct', async ({ request }) => {
    const res = await request.get(`${MENTIONS}?q=balogun`)
    const body = await res.json()
    if (body.data.length > 0) {
      const item = body.data[0]
      expect(item).toHaveProperty('type')
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('handle')
      expect(['user', 'seller']).toContain(item.type)
    }
  })

  test('GET /api/mentions/search trims query to 50 chars', async ({ request }) => {
    const longQuery = 'a'.repeat(100)
    const res = await request.get(`${MENTIONS}?q=${longQuery}`)
    expect(res.status()).toBe(200)
  })
})
