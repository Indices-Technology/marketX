// Products & Inventory audit suite — June pillar
// Covers: create persistence (deals/condition/variants), edit/delete IDOR,
// soft delete, variant sync integrity, draft leak lockdown, oversell guard,
// review purchase-gate, and rating aggregation after review upsert.
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const LIST = '/api/commerce/products'
const BY_ID = (id: number) => `/api/commerce/products/${id}`
const ORDERS = '/api/commerce/orders'
const REVIEWS = (id: number) => `/api/products/${id}/reviews`

// Second seeded seller — used for cross-seller IDOR checks
const SECOND_SELLER = { email: 'wuse@peppr.test', password: 'test1234' }

const SHIPPING = {
  name: 'Audit Test Buyer',
  address: '1 Test Close, Ikeja',
  zipcode: '100001',
  country: 'NG',
}

async function createTestProduct(
  request: APIRequestContext,
  token: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request.post(LIST, {
    data: {
      title: `Inventory Audit ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      price: 4000,
      description: 'Product created by the inventory audit suite.',
      status: 'PUBLISHED',
      variants: [
        { size: 'S', stock: 10 },
        { size: 'M', stock: 4 },
      ],
      ...overrides,
    },
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  return body.data
}

async function archiveProduct(
  request: APIRequestContext,
  token: string,
  id: number | null | undefined,
) {
  if (!id) return
  await request.delete(BY_ID(id), {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── Create: full payload persists ───────────────────────────────────────────

test.describe('POST /api/commerce/products — payload persistence', () => {
  let createdId: number | null = null

  test('persists variants, deal fields, and condition', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const dealEndsAt = new Date(Date.now() + 86_400_000).toISOString()
    const product = await createTestProduct(request, token, {
      isDeal: true,
      dealEndsAt,
      condition: 'LIKE_NEW',
      isThrift: true,
    })
    createdId = product.id

    expect(product.variants).toHaveLength(2)
    const sizes = product.variants.map((v: { size: string }) => v.size).sort()
    expect(sizes).toEqual(['M', 'S'])
    // Regression: these fields passed Zod but were silently dropped pre-audit
    expect(product.isDeal).toBe(true)
    expect(product.dealEndsAt).toBeTruthy()
    expect(product.condition).toBe('LIKE_NEW')
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, createdId)
  })
})

// ─── Ownership: edit & delete IDOR ────────────────────────────────────────────

test.describe('product edit/delete — cross-seller IDOR', () => {
  let productId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token)
    productId = product.id
  })

  test('another seller cannot edit the product', async ({ request }) => {
    const { token } = await apiLogin(request, SECOND_SELLER)
    const res = await request.patch(BY_ID(productId), {
      data: { title: 'Hijacked title' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('another seller cannot archive the product', async ({ request }) => {
    const { token } = await apiLogin(request, SECOND_SELLER)
    const res = await request.delete(BY_ID(productId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('buyer without seller profile cannot edit', async ({ request }) => {
    // chidi has no seller profile (TEST_USER/ada owns a store — she'd hit the ownership check instead)
    const { token } = await apiLogin(request, { email: 'chidi@peppr.test', password: 'test1234' })
    const res = await request.patch(BY_ID(productId), {
      data: { title: 'Buyer edit attempt' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, productId)
  })
})

// ─── Variant sync integrity ───────────────────────────────────────────────────

test.describe('PATCH /api/commerce/products/:id — variant sync', () => {
  let productId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token)
    productId = product.id
  })

  test('updates stock, removes a size, adds a size', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(BY_ID(productId), {
      data: {
        variants: [
          { size: 'S', stock: 7 }, // update existing
          { size: 'L', stock: 3 }, // create new
          // 'M' omitted — should be deleted (not in any cart/order)
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const variants: Array<{ size: string; stock: number }> = body.data.variants

    const bySize = new Map(variants.map((v) => [v.size, v.stock]))
    expect(bySize.get('S')).toBe(7)
    expect(bySize.get('L')).toBe(3)
    expect(bySize.has('M')).toBe(false)
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, productId)
  })
})

// ─── Soft delete ──────────────────────────────────────────────────────────────

test.describe('DELETE /api/commerce/products/:id — soft delete', () => {
  let productId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token)
    productId = product.id
  })

  test('archives instead of hard-deleting', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.delete(BY_ID(productId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('ARCHIVED')

    // Record still exists — detail fetch succeeds (soft delete)
    const detail = await request.get(BY_ID(productId))
    expect(detail.status()).toBe(200)
    const detailBody = await detail.json()
    expect(detailBody.data.status).toBe('ARCHIVED')
  })

  test('archived product is absent from the public list', async ({ request }) => {
    const res = await request.get(`${LIST}?limit=100`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    const ids = body.data.products.map((p: { id: number }) => p.id)
    expect(ids).not.toContain(productId)
  })
})

// ─── Draft leak lockdown ──────────────────────────────────────────────────────

test.describe('GET /api/commerce/products — status filter lockdown', () => {
  let draftId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token, { status: 'DRAFT' })
    draftId = product.id
  })

  test('unauthenticated ?status=DRAFT returns only PUBLISHED products', async ({ request }) => {
    const res = await request.get(`${LIST}?status=DRAFT&limit=100`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    for (const p of body.data.products) {
      expect(p.status).toBe('PUBLISHED')
    }
    const ids = body.data.products.map((p: { id: number }) => p.id)
    expect(ids).not.toContain(draftId)
  })

  test('buyer ?status=DRAFT cannot see another seller\'s drafts', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${LIST}?status=DRAFT&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const ids = body.data.products.map((p: { id: number }) => p.id)
    expect(ids).not.toContain(draftId)
  })

  test('owning seller ?status=DRAFT sees own draft', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${LIST}?status=DRAFT&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const ids = body.data.products.map((p: { id: number }) => p.id)
    expect(ids).toContain(draftId)
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, draftId)
  })
})

// ─── Oversell guard at order creation ─────────────────────────────────────────

test.describe('POST /api/commerce/orders — stock enforcement', () => {
  let productId: number
  let variantId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token)
    productId = product.id
    variantId = product.variants[0].id
  })

  test('rejects order with quantity above stock', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(ORDERS, {
      data: {
        items: [{ variantId, quantity: 99999 }],
        ...SHIPPING,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).toMatch(/stock/i)
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, productId)
  })
})

// ─── Review purchase-gate + rating aggregation ────────────────────────────────

test.describe('product reviews — purchase gate and rating aggregation', () => {
  let productId: number
  let variantId: number
  let orderId: number

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const product = await createTestProduct(request, token)
    productId = product.id
    variantId = product.variants[0].id
  })

  test('buyer without a delivered order cannot review', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(REVIEWS(productId), {
      data: { rating: 5, body: 'Should be rejected' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('full flow: order → deliver → review updates product rating', async ({ request }) => {
    const buyer = await apiLogin(request, TEST_USER)
    const seller = await apiLogin(request, TEST_SELLER)

    // 1. Buyer places an order for 1 unit
    const orderRes = await request.post(ORDERS, {
      data: { items: [{ variantId, quantity: 1 }], ...SHIPPING },
      headers: { Authorization: `Bearer ${buyer.token}` },
    })
    expect(orderRes.status()).toBe(200)
    const orderBody = await orderRes.json()
    orderId = orderBody.data.id

    // 2. Seller walks the order forward: PENDING → CONFIRMED → SHIPPED
    for (const status of ['CONFIRMED', 'SHIPPED']) {
      const res = await request.patch(`${ORDERS}/${orderId}/status`, {
        data: { status },
        headers: { Authorization: `Bearer ${seller.token}` },
      })
      expect(res.status()).toBe(200)
    }

    // 3. Buyer confirms receipt → DELIVERED
    const receiptRes = await request.post(`${ORDERS}/${orderId}/confirm-receipt`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
    })
    expect(receiptRes.status()).toBe(200)

    // 4. Review now passes the purchase gate
    const reviewRes = await request.post(REVIEWS(productId), {
      data: { rating: 4, title: 'Solid', body: 'Audit suite verified review.' },
      headers: { Authorization: `Bearer ${buyer.token}` },
    })
    expect(reviewRes.status()).toBe(200)
    const reviewBody = await reviewRes.json()
    expect(reviewBody.data.verified).toBe(true)

    // 5. Aggregation: product carries the new average + count
    const detail = await request.get(BY_ID(productId))
    const detailBody = await detail.json()
    expect(detailBody.data.averageRating).toBe(4)
    expect(detailBody.data.totalReviews).toBe(1)
  })

  test('review upsert recalculates the aggregate (no stale rating)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)

    // Same buyer updates their review — upsert, not duplicate
    const res = await request.post(REVIEWS(productId), {
      data: { rating: 2, body: 'Revised opinion.' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)

    const detail = await request.get(BY_ID(productId))
    const detailBody = await detail.json()
    expect(detailBody.data.averageRating).toBe(2)
    expect(detailBody.data.totalReviews).toBe(1) // still one review, not two
  })

  test.afterAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await archiveProduct(request, token, productId)
  })
})
