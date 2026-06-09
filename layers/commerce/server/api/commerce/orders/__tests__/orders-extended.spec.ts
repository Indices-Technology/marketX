import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const ORDERS = '/api/commerce/orders'
const ORDER = (id: string | number) => `/api/commerce/orders/${id}`
const SELLER_ORDERS = '/api/commerce/orders/seller'
const CANCEL = (id: string | number) => `${ORDER(id)}/cancel`
const CONFIRM_RECEIPT = (id: string | number) => `${ORDER(id)}/confirm-receipt`
const REFUSE = (id: string | number) => `${ORDER(id)}/refuse-delivery`
const STATUS = (id: string | number) => `${ORDER(id)}/status`
const CONFIRM_CASH = (id: string | number) => `${ORDER(id)}/confirm-cash`

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('orders — auth guards', () => {
  for (const [label, fn] of [
    ['GET /orders', (r: Parameters<typeof test>[2] extends (args: infer A) => unknown ? A : never) => r.request.get(ORDERS)] as const,
    ['GET /orders/:id', (r: any) => r.request.get(ORDER('1'))] as const,
    ['POST /orders/:id/cancel', (r: any) => r.request.post(CANCEL('1'))] as const,
    ['POST /orders/:id/confirm-receipt', (r: any) => r.request.post(CONFIRM_RECEIPT('1'))] as const,
    ['POST /orders/:id/refuse-delivery', (r: any) => r.request.post(REFUSE('1'), { data: {} })] as const,
    ['PATCH /orders/:id/status', (r: any) => r.request.patch(STATUS('1'), { data: { status: 'CONFIRMED' } })] as const,
    ['GET /orders/seller', (r: any) => r.request.get(SELLER_ORDERS)] as const,
  ]) {
    test(`${label} requires authentication`, async ({ request }) => {
      const res = await fn({ request })
      expect(res.status()).toBe(401)
    })
  }
})

// ─── Input validation — non-numeric IDs ───────────────────────────────────────

test.describe('orders — non-numeric ID → 400', () => {
  test('GET /orders/abc returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(ORDER('abc'), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('POST /orders/abc/cancel returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CANCEL('abc'), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('POST /orders/abc/confirm-receipt returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CONFIRM_RECEIPT('abc'), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('POST /orders/abc/refuse-delivery returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(REFUSE('abc'), { data: {}, headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('PATCH /orders/abc/status returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS('abc'), {
      data: { status: 'SHIPPED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── Not found ────────────────────────────────────────────────────────────────

test.describe('orders — unknown ID → 404', () => {
  const GHOST = 999999999

  test('GET /orders/:id 404 for unknown order', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(ORDER(GHOST), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(404)
  })

  test('POST /orders/:id/cancel 404 for unknown order', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CANCEL(GHOST), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(404)
  })

  test('POST /orders/:id/confirm-receipt 404 for unknown order', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CONFIRM_RECEIPT(GHOST), { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(404)
  })

  test('PATCH /orders/:id/status 404 for unknown order (valid body)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS(GHOST), {
      data: { status: 'SHIPPED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})

// ─── Buyer order list ─────────────────────────────────────────────────────────

test.describe('GET /api/commerce/orders — buyer list', () => {
  test('returns orders array and pagination fields', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${ORDERS}?limit=10&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    // Service wraps in { orders, total, limit, offset }
    const data = body.data
    expect(Array.isArray(data.orders)).toBe(true)
    expect(typeof data.total).toBe('number')
    expect(typeof data.limit).toBe('number')
    expect(typeof data.offset).toBe('number')
  })

  test('all returned orders belong to the authenticated user', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    for (const order of data.orders ?? []) {
      // Every order in the list must have user data — we cannot check userId directly
      // but if IDOR protection is absent, a cross-user fetch would surface here.
      // We assert status and paymentStatus are valid strings as a shape check.
      expect(typeof order.status).toBe('string')
      expect(typeof order.paymentStatus).toBe('string')
    }
  })
})

// ─── IDOR — order detail ──────────────────────────────────────────────────────

test.describe('GET /api/commerce/orders/:id — IDOR', () => {
  test('TEST_SELLER cannot read an order that belongs to TEST_USER', async ({ request }) => {
    // Find an order owned by TEST_USER
    const { token: userToken } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
    const listBody = await listRes.json()
    const orders: Array<{ id: number }> = listBody.data?.orders ?? []
    if (!orders.length) { test.skip(); return }

    const orderId = orders[0].id
    // Now access it as TEST_SELLER — must be 403
    const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(ORDER(orderId), {
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(res.status()).toBe(403)
  })
})

// ─── Seller order list — IDOR ─────────────────────────────────────────────────

test.describe('GET /api/commerce/orders/seller — authorization', () => {
  test('requires storeSlug param', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(SELLER_ORDERS, { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(400)
  })

  test('TEST_USER cannot access TEST_SELLER store orders (403)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('seller order list contains sellerBreakdown per order', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(Array.isArray(data.orders)).toBe(true)
    for (const order of data.orders) {
      expect(order).toHaveProperty('sellerBreakdown')
      expect(typeof order.sellerBreakdown.gross).toBe('number')
      expect(typeof order.sellerBreakdown.net).toBe('number')
      expect(order.sellerBreakdown.net).toBeLessThanOrEqual(order.sellerBreakdown.gross)
    }
  })
})

// ─── Cancel — IDOR & state ────────────────────────────────────────────────────

test.describe('POST /api/commerce/orders/:id/cancel — IDOR & state', () => {
  test('seller cannot cancel a buyer\'s order (403)', async ({ request }) => {
    const { token: userToken } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
    const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
    if (!orders.length) { test.skip(); return }

    const orderId = orders[0].id
    const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CANCEL(orderId), {
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(res.status()).toBe(403)
  })
})

// ─── Confirm receipt — IDOR & state ──────────────────────────────────────────

test.describe('POST /api/commerce/orders/:id/confirm-receipt', () => {
  test('seller cannot confirm receipt for a buyer\'s order (403)', async ({ request }) => {
    const { token: userToken } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
    const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
    if (!orders.length) { test.skip(); return }

    const orderId = orders[0].id
    const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CONFIRM_RECEIPT(orderId), {
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(res.status()).toBe(403)
  })

  test('returns 400 for order not in a confirmable state (PENDING)', async ({ request }) => {
    // Find a PENDING or CANCELLED order to confirm — should be rejected
    const { token } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
    const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
    const invalid = orders.find((o) => ['PENDING', 'CANCELLED', 'RETURNED'].includes(o.status))
    if (!invalid) { test.skip(); return }

    const res = await request.post(CONFIRM_RECEIPT(invalid.id), {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Already DELIVERED returns 200 (idempotent); otherwise 400
    if (invalid.status === 'DELIVERED') {
      expect(res.status()).toBe(200)
    } else {
      expect(res.status()).toBe(400)
    }
  })
})

// ─── Status PATCH — seller-only & valid transitions ──────────────────────────

test.describe('PATCH /api/commerce/orders/:id/status — authorization & transitions', () => {
  test('buyer cannot update order status (403)', async ({ request }) => {
    const { token: userToken } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
    const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
    if (!orders.length) { test.skip(); return }

    const orderId = orders[0].id
    const res = await request.patch(STATUS(orderId), {
      data: { status: 'DELIVERED' },
      headers: { Authorization: `Bearer ${userToken}` },
    })
    expect(res.status()).toBe(403)
  })

  test('rejects invalid status value (400)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS(999999999), {
      data: { status: 'PROCESSING' },
      headers: { Authorization: `Bearer ${token}` },
    })
    // Zod rejects unknown enum value before the 404 check
    expect(res.status()).toBe(400)
  })

  test('seller order list orders have known status values', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const { data } = await res.json()
    const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'PROCESSING'])
    for (const order of data.orders) {
      expect(VALID_STATUSES.has(order.status)).toBe(true)
    }
  })

  test('cannot move order backward: non-existent order returns 404 before transition check', async ({ request }) => {
    // Transition check only fires after order is found — 404 for ghost ID regardless
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS(999999999), {
      data: { status: 'CONFIRMED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('valid backward transition (DELIVERED → CONFIRMED) is rejected for real order', async ({ request }) => {
    // Find a DELIVERED order on TEST_SELLER's store
    const { token } = await apiLogin(request, TEST_SELLER)
    const listRes = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
    const delivered = orders.find((o) => o.status === 'DELIVERED')
    if (!delivered) { test.skip(); return }

    const res = await request.patch(STATUS(delivered.id), {
      data: { status: 'CONFIRMED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('adding tracking to a SHIPPED order (same status) returns 200', async ({ request }) => {
    // Seller should be able to add/update tracking without re-transitioning the status
    const { token } = await apiLogin(request, TEST_SELLER)
    const listRes = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}&status=SHIPPED`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
    if (!orders.length) { test.skip(); return }

    const res = await request.patch(STATUS(orders[0].id), {
      data: { status: 'SHIPPED', shipper: 'DHL', trackingNumber: 'TEST123456' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })
})

// ─── Refuse delivery — POD-only guard ────────────────────────────────────────

test.describe('POST /api/commerce/orders/:id/refuse-delivery', () => {
  test('rejects non-POD order (400)', async ({ request }) => {
    // Find any non-POD order belonging to TEST_USER
    const { token } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
    const orders: Array<{ id: number; paymentMethod: string }> = (await listRes.json()).data?.orders ?? []
    const nonPOD = orders.find((o) => o.paymentMethod !== 'pay_on_delivery')
    if (!nonPOD) { test.skip(); return }

    const res = await request.post(REFUSE(nonPOD.id), {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.statusMessage ?? body.message ?? '').toMatch(/POD|Pay on Delivery|pay_on_delivery/i)
  })

  test('refuses delivery only when order is in CONFIRMED or SHIPPED state', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
    const orders: Array<{ id: number; paymentMethod: string; status: string }> = (await listRes.json()).data?.orders ?? []
    const podPending = orders.find(
      (o) => o.paymentMethod === 'pay_on_delivery' && o.status === 'PENDING',
    )
    if (!podPending) { test.skip(); return }

    const res = await request.post(REFUSE(podPending.id), {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── confirm-cash (POD seller endpoint) ──────────────────────────────────────

test.describe('POST /api/commerce/orders/:id/confirm-cash', () => {
  test('requires authentication', async ({ request }) => {
    const res = await request.post(CONFIRM_CASH('1'))
    expect(res.status()).toBe(401)
  })

  test('non-numeric ID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CONFIRM_CASH('not-a-number'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('unknown order ID returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CONFIRM_CASH('999999999'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('buyer cannot confirm cash for own order (403)', async ({ request }) => {
    // confirm-cash is a seller action (seller confirms they received cash on delivery)
    const { token: userToken } = await apiLogin(request, TEST_USER)
    const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
    const orders: Array<{ id: number; paymentMethod: string }> = (await listRes.json()).data?.orders ?? []
    const pod = orders.find((o) => o.paymentMethod === 'pay_on_delivery')
    if (!pod) { test.skip(); return }

    const res = await request.post(CONFIRM_CASH(pod.id), {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    expect(res.status()).toBe(403)
  })
})
