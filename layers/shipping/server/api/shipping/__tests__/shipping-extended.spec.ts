// Shipping audit suite — June pillar
// Covers: create-shipment authorization & state guards, webhook payload
// hardening, webhook status transitions (incl. no-downgrade of DELIVERED).
// Provider-dependent paths (live Shippo/Sendbox calls) are intentionally not
// exercised — rates.post.ts falls back gracefully and is covered in shipping.spec.ts.
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const CREATE = '/api/commerce/shipping/create'
const WEBHOOK_SENDBOX = '/api/commerce/shipping/webhook/sendbox'
const WEBHOOK_SHIPPO = '/api/commerce/shipping/webhook/shippo'
const ORDERS = '/api/commerce/orders'
const PRODUCTS = '/api/commerce/products'

const BUYER_ONLY = { email: 'chidi@peppr.test', password: 'test1234' }

const SHIPPING_TO = {
  name: 'Shipping Audit Buyer',
  address: '7 Audit Lane, Yaba',
  zipcode: '100001',
  country: 'NG',
}

const ADDRESS = {
  name: 'Test',
  street1: '1 Test St',
  city: 'Lagos',
  state: 'Lagos',
  zip: '100001',
  country: 'NG',
}

/** Create product (seller) + place order (buyer). Returns ids + tokens. */
async function setupOrder(request: APIRequestContext) {
  const seller = await apiLogin(request, TEST_SELLER)
  const buyer = await apiLogin(request, TEST_USER)

  const prodRes = await request.post(PRODUCTS, {
    data: {
      title: `Shipping Audit ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      price: 3000,
      description: 'Product created by the shipping audit suite.',
      status: 'PUBLISHED',
      variants: [{ size: 'One Size', stock: 20 }],
    },
    headers: { Authorization: `Bearer ${seller.token}` },
  })
  expect(prodRes.status()).toBe(200)
  const product = (await prodRes.json()).data

  const orderRes = await request.post(ORDERS, {
    data: {
      items: [{ variantId: product.variants[0].id, quantity: 1 }],
      ...SHIPPING_TO,
    },
    headers: { Authorization: `Bearer ${buyer.token}` },
  })
  expect(orderRes.status()).toBe(200)
  const order = (await orderRes.json()).data

  return {
    productId: product.id as number,
    orderId: order.id as number,
    sellerToken: seller.token,
    buyerToken: buyer.token,
  }
}

async function archiveProduct(
  request: APIRequestContext,
  token: string,
  id: number | null | undefined,
) {
  if (!id) return
  await request.delete(`${PRODUCTS}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── Create shipment — auth & state guards ────────────────────────────────────

test.describe('POST /api/commerce/shipping/create — guards', () => {
  let ctx: Awaited<ReturnType<typeof setupOrder>>

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000) // first request after an HMR rebuild can be slow
    ctx = await setupOrder(request)
  })

  test('requires authentication', async ({ request }) => {
    const res = await request.post(CREATE, {
      data: { orderId: 1, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
    })
    expect(res.status()).toBe(401)
  })

  test('rejects missing fields', async ({ request }) => {
    const res = await request.post(CREATE, {
      data: { orderId: ctx.orderId },
      headers: { Authorization: `Bearer ${ctx.sellerToken}` },
    })
    expect(res.status()).toBe(400)
  })

  test('404 for unknown order', async ({ request }) => {
    const res = await request.post(CREATE, {
      data: { orderId: 999999999, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
      headers: { Authorization: `Bearer ${ctx.sellerToken}` },
    })
    expect(res.status()).toBe(404)
  })

  test('403 for a user unrelated to the order', async ({ request }) => {
    const { token } = await apiLogin(request, BUYER_ONLY)
    const res = await request.post(CREATE, {
      data: { orderId: ctx.orderId, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('400 for an order that is not CONFIRMED (state guard)', async ({ request }) => {
    // Order is freshly placed → PENDING. Seller in the order is authorized but
    // booking must be blocked until the order is confirmed.
    const res = await request.post(CREATE, {
      data: { orderId: ctx.orderId, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
      headers: { Authorization: `Bearer ${ctx.sellerToken}` },
    })
    expect(res.status()).toBe(400)
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).toMatch(/PENDING/i)
  })

  test.afterAll(async ({ request }) => {
    if (!ctx) return
    await archiveProduct(request, ctx.sellerToken, ctx.productId)
  })
})

// ─── Webhooks — signature gate (shippo: secret configured in dev .env) ────────

test.describe('POST webhook/shippo — signature verification', () => {
  test('rejects unsigned request with 401', async ({ request }) => {
    const res = await request.post(WEBHOOK_SHIPPO, {
      data: JSON.stringify({ event: 'ping', data: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(401)
  })

  test('rejects request with a garbage signature', async ({ request }) => {
    const res = await request.post(WEBHOOK_SHIPPO, {
      data: JSON.stringify({ event: 'ping', data: {} }),
      headers: {
        'Content-Type': 'application/json',
        'X-Shippo-Signature': 'deadbeef'.repeat(8),
      },
    })
    expect(res.status()).toBe(401)
  })
})

// ─── Webhook — payload hardening (sendbox: secret unset in dev → skip) ────────

test.describe('POST webhook/sendbox — payload hardening', () => {
  test('rejects invalid JSON with 400', async ({ request }) => {
    // text/plain so Playwright does not JSON-serialize the string into valid JSON
    const res = await request.post(WEBHOOK_SENDBOX, {
      data: 'not-json{{{',
      headers: { 'Content-Type': 'text/plain' },
    })
    expect(res.status()).toBe(400)
  })

  test('acknowledges payload without tracking number (no-op)', async ({ request }) => {
    const res = await request.post(WEBHOOK_SENDBOX, {
      data: JSON.stringify({ event: 'ping', data: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  test('acknowledges payload with unknown tracking number', async ({ request }) => {
    const res = await request.post(WEBHOOK_SENDBOX, {
      data: JSON.stringify({
        event: 'status_updated',
        data: { tracking_number: 'NO-SUCH-TRACKING-123', status: 'delivered' },
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})

// ─── Webhook — full status flow + no-downgrade guard ──────────────────────────

test.describe('webhook/sendbox — order status transitions', () => {
  let ctx: Awaited<ReturnType<typeof setupOrder>>
  const trackingNumber = `AUDIT-TRK-${Date.now()}`

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000) // first request after an HMR rebuild can be slow
    ctx = await setupOrder(request)

    // Walk the order to SHIPPED with our tracking number attached
    for (const status of ['CONFIRMED', 'SHIPPED']) {
      const res = await request.patch(`${ORDERS}/${ctx.orderId}/status`, {
        data: { status, ...(status === 'SHIPPED' ? { trackingNumber } : {}) },
        headers: { Authorization: `Bearer ${ctx.sellerToken}` },
      })
      expect(res.status()).toBe(200)
    }
  })

  test('DELIVERED event marks the order delivered', async ({ request }) => {
    const res = await request.post(WEBHOOK_SENDBOX, {
      data: JSON.stringify({
        event: 'status_updated',
        data: { tracking_number: trackingNumber, status: 'delivered' },
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(200)

    const orderRes = await request.get(`${ORDERS}/${ctx.orderId}`, {
      headers: { Authorization: `Bearer ${ctx.buyerToken}` },
    })
    const order = (await orderRes.json()).data
    expect(order.status).toBe('DELIVERED')
  })

  test('late IN_TRANSIT event does not downgrade a DELIVERED order', async ({ request }) => {
    const res = await request.post(WEBHOOK_SENDBOX, {
      data: JSON.stringify({
        event: 'status_updated',
        data: { tracking_number: trackingNumber, status: 'in_transit' },
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(200)

    const orderRes = await request.get(`${ORDERS}/${ctx.orderId}`, {
      headers: { Authorization: `Bearer ${ctx.buyerToken}` },
    })
    const order = (await orderRes.json()).data
    expect(order.status).toBe('DELIVERED') // unchanged — no downgrade
  })

  test.afterAll(async ({ request }) => {
    if (!ctx) return
    await archiveProduct(request, ctx.sellerToken, ctx.productId)
  })
})
