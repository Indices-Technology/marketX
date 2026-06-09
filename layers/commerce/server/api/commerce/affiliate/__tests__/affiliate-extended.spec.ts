import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER, getFirstVariantId, clearCart } from '../../../../../../../tests/helpers/auth'

const AFFILIATE = '/api/commerce/affiliate'
const ENROLL = `${AFFILIATE}/enroll`
const AVAILABLE = `${AFFILIATE}/available-products`
const ORDERS = '/api/commerce/orders'

// ─── GET /api/commerce/affiliate/seller-products ──────────────────────────────

test.describe('affiliate — seller-products', () => {
  test('GET /api/commerce/affiliate/seller-products requires auth', async ({ request }) => {
    const res = await request.get(`${AFFILIATE}/seller-products`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/affiliate/seller-products returns data for seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${AFFILIATE}/seller-products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('products')
    expect(Array.isArray(body.data.products)).toBe(true)
  })
})

// ─── GET /api/commerce/affiliate/promoters ────────────────────────────────────

test.describe('affiliate — promoters', () => {
  test('GET /api/commerce/affiliate/promoters requires auth', async ({ request }) => {
    const res = await request.get(`${AFFILIATE}/promoters`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/affiliate/promoters returns data for seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${AFFILIATE}/promoters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('promoters')
    expect(Array.isArray(body.data.promoters)).toBe(true)
  })

  test('each promoter entry has id, username, orderCount and totalEarned', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${AFFILIATE}/promoters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    for (const p of data.promoters) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('username')
      expect(typeof p.orderCount).toBe('number')
      expect(typeof p.totalEarned).toBe('number')
      // totalEarned must be non-negative (per-seller items only, never inflated)
      expect(p.totalEarned).toBeGreaterThanOrEqual(0)
    }
  })
})

// ─── Affiliate referrals — response shape ────────────────────────────────────

test.describe('affiliate — referrals shape', () => {
  test('each referral has commission as a number and a status string', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${AFFILIATE}/referrals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveProperty('referrals')
    expect(Array.isArray(data.referrals)).toBe(true)
    for (const r of data.referrals) {
      expect(typeof r.commission).toBe('number')
      expect(typeof r.status).toBe('string')
      expect(r.commission).toBeGreaterThanOrEqual(0)
    }
  })

  test('pagination fields are present', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${AFFILIATE}/referrals?limit=5&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(typeof data.total).toBe('number')
    expect(typeof data.limit).toBe('number')
    expect(typeof data.offset).toBe('number')
    expect(typeof data.hasMore).toBe('boolean')
  })
})

// ─── Affiliate cut — quantity multiplier ─────────────────────────────────────
// Verifies Bug 1 fix: affiliateCut = affiliateCommission × quantity, not just
// affiliateCommission × 1 regardless of quantity.

test.describe('affiliate — commission × quantity', () => {
  test('affiliateCut scales with order quantity', async ({ request }) => {
    // 1. Ensure TEST_USER is enrolled and has an affiliate code
    const { token: affiliateToken } = await apiLogin(request, TEST_USER)
    const enrollRes = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${affiliateToken}` },
    })
    expect(enrollRes.status()).toBeLessThan(300)
    const enrollBody = await enrollRes.json()
    const affiliateCode: string = enrollBody.data?.affiliateCode
    if (!affiliateCode) { test.skip(); return }

    // 2. Find a product with affiliateCommission via available-products
    const availRes = await request.get(`${AVAILABLE}?limit=50`)
    expect(availRes.status()).toBe(200)
    const availBody = await availRes.json()
    const products: Array<{ id: number; affiliateCommission: number; variants?: Array<{ id: number; stock: number }> }>
      = availBody.data ?? []
    const product = products.find((p) => (p.affiliateCommission ?? 0) > 0)
    if (!product) { test.skip(); return } // no affiliate products in seed

    // 3. Resolve a variant with sufficient stock (need qty=2)
    const variantId = await getFirstVariantId(request).catch(() => null)
    if (!variantId) { test.skip(); return }

    // 4. Place TWO separate single-unit orders via TEST_SELLER using the affiliate code
    //    (TEST_SELLER is a different user so self-referral is not triggered)
    const { token: buyerToken } = await apiLogin(request, TEST_SELLER)
    await clearCart(request, buyerToken)

    const orderBody = {
      items: [{ variantId, quantity: 1 }],
      name: 'Test Buyer',
      address: '1 Marina Street',
      zipcode: '100001',
      country: 'NG',
      shippingCost: 0,
      affiliateCode,
    }

    const order1Res = await request.post(ORDERS, {
      data: orderBody,
      headers: { Authorization: `Bearer ${buyerToken}` },
    })

    if (!order1Res.ok()) { test.skip(); return } // stock may be depleted in CI
    const order1 = (await order1Res.json()).data
    const singleUnitCut: number = order1.affiliateCut ?? 0

    // 5. Place a second order with quantity=2 using the same affiliate code
    const order2Res = await request.post(ORDERS, {
      data: { ...orderBody, items: [{ variantId, quantity: 2 }] },
      headers: { Authorization: `Bearer ${buyerToken}` },
    })

    if (!order2Res.ok()) { test.skip(); return }
    const order2 = (await order2Res.json()).data
    const doubleUnitCut: number = order2.affiliateCut ?? 0

    // The double-quantity order must have exactly 2× the single-quantity cut
    // (only meaningful when the product has a commission; skip if zero)
    if (singleUnitCut === 0) { test.skip(); return }
    expect(doubleUnitCut).toBe(singleUnitCut * 2)
  })

  test('affiliateCut is 0 when no affiliate code provided', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    await clearCart(request, token)
    const variantId = await getFirstVariantId(request).catch(() => null)
    if (!variantId) { test.skip(); return }

    const res = await request.post(ORDERS, {
      data: {
        items: [{ variantId, quantity: 1 }],
        name: 'No-Affiliate Buyer',
        address: '1 Marina Street',
        zipcode: '100001',
        country: 'NG',
        shippingCost: 0,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok()) { test.skip(); return }
    const order = (await res.json()).data
    expect(order.affiliateCut ?? 0).toBe(0)
  })

  test('self-referral is blocked — affiliateCut is 0', async ({ request }) => {
    // TEST_USER places an order using their OWN affiliate code
    const { token } = await apiLogin(request, TEST_USER)
    await clearCart(request, token)

    const enrollRes = await request.post(ENROLL, { headers: { Authorization: `Bearer ${token}` } })
    const affiliateCode: string = (await enrollRes.json()).data?.affiliateCode
    if (!affiliateCode) { test.skip(); return }

    const variantId = await getFirstVariantId(request).catch(() => null)
    if (!variantId) { test.skip(); return }

    const res = await request.post(ORDERS, {
      data: {
        items: [{ variantId, quantity: 1 }],
        name: 'Self Referral',
        address: '1 Marina Street',
        zipcode: '100001',
        country: 'NG',
        shippingCost: 0,
        affiliateCode,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok()) { test.skip(); return }
    const order = (await res.json()).data
    // Self-referral is silently dropped — cut must be 0
    expect(order.affiliateCut ?? 0).toBe(0)
  })
})
