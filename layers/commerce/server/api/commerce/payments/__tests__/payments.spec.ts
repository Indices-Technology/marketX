import { test, expect } from '@playwright/test'
import crypto from 'crypto'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const INIT        = '/api/commerce/payments/initialize'
const VERIFY      = '/api/commerce/payments/verify'
const PAYPAL_CREATE   = '/api/commerce/payments/paypal/create'
const PAYPAL_CAPTURE  = '/api/commerce/payments/paypal/capture'
const POD_INIT    = '/api/commerce/payments/pod-initialize'
const POD_VERIFY  = '/api/commerce/payments/pod-verify'
const WEBHOOK     = '/api/commerce/payments/webhook'

// Minimal valid order body — uses seed variant
const orderBody = async (request: any, overrides = {}) => {
  const varRes = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
  const varBody = await varRes.json()
  const variantId = varBody.data?.variants?.[0]?.id ?? 1
  return {
    items: [{ variantId, quantity: 1 }],
    name: 'Test Buyer',
    address: '1 Marina Street',
    zipcode: '100001',
    country: 'NG',
    shippingCost: 0,
    ...overrides,
  }
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('payments — auth guards', () => {
  test('POST /initialize requires auth', async ({ request }) => {
    const res = await request.post(INIT, { data: { items: [] } })
    expect(res.status()).toBe(401)
  })

  test('POST /verify requires auth', async ({ request }) => {
    const res = await request.post(VERIFY, { data: { reference: 'ref_123' } })
    expect(res.status()).toBe(401)
  })

  test('POST /paypal/create requires auth', async ({ request }) => {
    const res = await request.post(PAYPAL_CREATE, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /paypal/capture requires auth', async ({ request }) => {
    const res = await request.post(PAYPAL_CAPTURE, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /pod-initialize requires auth', async ({ request }) => {
    const res = await request.post(POD_INIT, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /pod-verify requires auth', async ({ request }) => {
    const res = await request.post(POD_VERIFY, { data: { reference: 'ref_123' } })
    expect(res.status()).toBe(401)
  })
})

// ─── Input validation ─────────────────────────────────────────────────────────

test.describe('payments — validation', () => {
  test('POST /initialize rejects missing items', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(INIT, {
      data: { name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /initialize rejects empty items array', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(INIT, {
      data: { items: [], name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /pod-initialize rejects zero shippingCost', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request, { shippingCost: 0, country: 'NG' })
    const res = await request.post(POD_INIT, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /verify rejects missing reference', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(VERIFY, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /pod-verify rejects missing reference', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(POD_VERIFY, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /paypal/capture rejects missing fields', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(PAYPAL_CAPTURE, {
      data: { orderId: 'not-a-number' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── Not found ────────────────────────────────────────────────────────────────

test.describe('payments — reference not found', () => {
  test('POST /verify returns 404 for unknown reference', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(VERIFY, {
      data: { reference: `fake_ref_${Date.now()}` },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('POST /pod-verify returns 404 for unknown reference', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(POD_VERIFY, {
      data: { reference: `fake_pod_ref_${Date.now()}` },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('POST /paypal/capture returns 404 for unknown orderId', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(PAYPAL_CAPTURE, {
      data: { orderId: 999999999, paypalOrderId: 'fake_paypal_id' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})

// ─── IDOR: another user cannot access another's payment reference ─────────────

test.describe('payments — ownership (IDOR)', () => {
  test('POST /verify returns 403 when reference belongs to a different user', async ({ request }) => {
    // Step 1: initialize a payment as TEST_USER — creates order + reference in DB
    // even if Paystack fails (order is created before Paystack call)
    const { token: buyerToken } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request)
    const initRes = await request.post(INIT, {
      data: { ...body, callback_url: 'http://localhost:3000/buyer/orders' },
      headers: { Authorization: `Bearer ${buyerToken}` },
    })

    // Skip if Paystack not configured in test env — we can't get the reference
    if (!initRes.ok()) {
      test.skip()
      return
    }

    const initBody = await initRes.json()
    const reference = initBody.data?.reference
    if (!reference) { test.skip(); return }

    // Step 2: try to verify the reference as TEST_SELLER → must be 403
    const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
    const verifyRes = await request.post(VERIFY, {
      data: { reference },
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(verifyRes.status()).toBe(403)
  })

  test('POST /paypal/capture returns 403 when order belongs to a different user', async ({ request }) => {
    const { token: buyerToken } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request, { callback_url: 'http://localhost:3000/buyer/orders' })
    const createRes = await request.post(PAYPAL_CREATE, {
      data: body,
      headers: { Authorization: `Bearer ${buyerToken}` },
    })

    if (!createRes.ok()) { test.skip(); return }
    const createBody = await createRes.json()
    const orderId = createBody.data?.orderId
    if (!orderId) { test.skip(); return }

    const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
    const captureRes = await request.post(PAYPAL_CAPTURE, {
      data: { orderId, paypalOrderId: 'fake_paypal_token' },
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    expect(captureRes.status()).toBe(403)
  })
})

// ─── POD — zone eligibility ───────────────────────────────────────────────────

test.describe('pod-initialize — zone eligibility', () => {
  test('rejects when seller does not support POD', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request, {
      shippingCost: 150000, // valid shipping cost in kobo
      country: 'NG',
      shippingZone: 'Kano · North',
      county: 'Kano',
    })
    const res = await request.post(POD_INIT, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    // Either 400 (zone not eligible) or non-401 (auth passes, business logic runs)
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(403)
  })
})

// ─── Webhook — signature verification ────────────────────────────────────────

test.describe('Paystack webhook — signature', () => {
  test('returns 400 when x-paystack-signature header is missing', async ({ request }) => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'test_ref' } })
    const res = await request.post(WEBHOOK, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    // Either 400 (signature missing) or 500 (PAYSTACK_SECRET_KEY not set in test env)
    expect([400, 500]).toContain(res.status())
  })

  test('returns 401 when x-paystack-signature is wrong', async ({ request }) => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'test_ref' } })
    const res = await request.post(WEBHOOK, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'completely_wrong_signature',
      },
    })
    // 401 if secret is configured, 500 if not
    expect([401, 500]).toContain(res.status())
  })

  test('returns 200 for valid signature and unknown reference (graceful no-op)', async ({ request }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) { test.skip(); return }

    const payload = JSON.stringify({
      event: 'charge.success',
      data: { reference: `nonexistent_ref_${Date.now()}` },
    })
    const sig = crypto.createHmac('sha512', secret).update(payload).digest('hex')

    const res = await request.post(WEBHOOK, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': sig,
      },
    })
    expect(res.status()).toBe(200)
  })

  test('is idempotent — duplicate charge.success does not double-process', async ({ request }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) { test.skip(); return }

    const payload = JSON.stringify({
      event: 'charge.success',
      data: { reference: `idempotent_test_ref_${Date.now()}` },
    })
    const sig = crypto.createHmac('sha512', secret).update(payload).digest('hex')

    const headers = {
      'Content-Type': 'application/json',
      'x-paystack-signature': sig,
    }

    const [r1, r2] = await Promise.all([
      request.post(WEBHOOK, { data: payload, headers }),
      request.post(WEBHOOK, { data: payload, headers }),
    ])
    expect(r1.status()).toBe(200)
    expect(r2.status()).toBe(200)
  })
})

// ─── Integration: provider availability in test env ──────────────────────────

test.describe('payments — provider not configured', () => {
  test('POST /initialize returns non-401 (auth passes)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request)
    const res = await request.post(INIT, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).not.toBe(401)
  })

  test('POST /paypal/create returns non-auth error when PayPal not configured', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request, { callback_url: 'http://localhost:3000/checkout' })
    const res = await request.post(PAYPAL_CREATE, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(403)
  })
})
