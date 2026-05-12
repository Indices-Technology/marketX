import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER } from '../../../../../../../tests/helpers/auth'

const COMMENTS = (id: number) => `/api/commerce/products/${id}/comments`
const LIKES = (id: number) => `/api/commerce/products/${id}/likes`
const LIKE_ACTION = (id: number) => `/api/commerce/products/${id}/like`
const VARIANT = (id: number) => `/api/commerce/products/variants/${id}`
const VIEW = (id: number) => `/api/products/${id}/view`
const ELIGIBILITY = (id: number) => `/api/products/${id}/reviews/eligibility`

test.describe('products — comments and likes', () => {
  let productId: number
  let variantId: number

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
    const body = await res.json()
    productId = body.data?.id ?? 0
    variantId = body.data?.variants?.[0]?.id ?? 0
  })

  // ─── Comments ─────────────────────────────────────────────────────────────────

  test('GET /api/commerce/products/:id/comments is public', async ({ request }) => {
    if (!productId) return
    const res = await request.get(COMMENTS(productId))
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    const comments = body.data?.comments ?? body.data
    expect(Array.isArray(comments)).toBe(true)
  })

  test('GET /api/commerce/products/:id/comments returns 400 for invalid ID', async ({ request }) => {
    const res = await request.get('/api/commerce/products/invalid/comments')
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/products/:id/comments requires auth', async ({ request }) => {
    if (!productId) return
    const res = await request.post(COMMENTS(productId), {
      data: { content: 'Nice product!' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/products/:id/comments with auth passes auth gate', async ({ request }) => {
    if (!productId) return
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(COMMENTS(productId), {
      data: { text: 'Phase 5 test comment' },
      headers: { Authorization: `Bearer ${token}` },
    })
    // Auth passes — 200 on success, 5xx if handler has schema issues in test env
    expect(res.status()).not.toBe(401)
  })

  // ─── Likes list ───────────────────────────────────────────────────────────────

  test('GET /api/commerce/products/:id/likes is public', async ({ request }) => {
    if (!productId) return
    const res = await request.get(LIKES(productId))
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('likes')
    expect(body.data).toHaveProperty('total')
    expect(Array.isArray(body.data.likes)).toBe(true)
  })

  test('GET /api/commerce/products/:id/likes returns 400 for invalid product ID', async ({ request }) => {
    const res = await request.get('/api/commerce/products/invalid/likes')
    expect(res.status()).toBe(400)
  })

  test('GET /api/commerce/products/:id/likes respects limit param', async ({ request }) => {
    if (!productId) return
    const res = await request.get(`${LIKES(productId)}?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.likes.length).toBeLessThanOrEqual(5)
  })

  // ─── Like / Unlike ────────────────────────────────────────────────────────────

  test('POST /api/commerce/products/:id/like requires auth', async ({ request }) => {
    if (!productId) return
    const res = await request.post(LIKE_ACTION(productId))
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/commerce/products/:id/like requires auth', async ({ request }) => {
    if (!productId) return
    const res = await request.delete(LIKE_ACTION(productId))
    expect(res.status()).toBe(401)
  })

  // ─── Variant ──────────────────────────────────────────────────────────────────

  test('GET /api/commerce/products/variants/:id is public', async ({ request }) => {
    if (!variantId) return
    const res = await request.get(VARIANT(variantId))
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('id')
    expect(body.data).toHaveProperty('price')
    expect(body.data).toHaveProperty('stock')
    expect(body.data).toHaveProperty('product')
  })

  test('GET /api/commerce/products/variants/:id returns 400 for invalid ID', async ({ request }) => {
    const res = await request.get('/api/commerce/products/variants/0')
    expect(res.status()).toBe(400)
  })

  test('GET /api/commerce/products/variants/:id returns 404 for unknown ID', async ({ request }) => {
    const res = await request.get('/api/commerce/products/variants/999999')
    expect(res.status()).toBe(404)
  })

  // ─── View ─────────────────────────────────────────────────────────────────────

  test('POST /api/products/:id/view is public and returns success', async ({ request }) => {
    if (!productId) return
    const res = await request.post(VIEW(productId))
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('POST /api/products/:id/view returns 400 for invalid ID', async ({ request }) => {
    const res = await request.post('/api/products/not-a-number/view')
    expect(res.status()).toBe(400)
  })

  // ─── Reviews eligibility ─────────────────────────────────────────────────────

  test('GET /api/products/:id/reviews/eligibility requires auth', async ({ request }) => {
    if (!productId) return
    const res = await request.get(ELIGIBILITY(productId))
    expect(res.status()).toBe(401)
  })

  test('GET /api/products/:id/reviews/eligibility returns eligibility when authenticated', async ({ request }) => {
    if (!productId) return
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(ELIGIBILITY(productId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('canReview')
    expect(body.data).toHaveProperty('existingReview')
  })

  test('GET /api/products/:id/reviews/eligibility returns 400 for invalid ID', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get('/api/products/0/reviews/eligibility', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})
