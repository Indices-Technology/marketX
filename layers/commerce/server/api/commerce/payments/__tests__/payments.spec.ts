import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER } from '../../../../../../../tests/helpers/auth'

const INIT = '/api/commerce/payments/initialize'
const VERIFY = '/api/commerce/payments/verify'
const PAYPAL_CREATE = '/api/commerce/payments/paypal/create'
const PAYPAL_CAPTURE = '/api/commerce/payments/paypal/capture'
const POD_INIT = '/api/commerce/payments/pod-initialize'
const POD_VERIFY = '/api/commerce/payments/pod-verify'

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
  test('POST /api/commerce/payments/initialize requires auth', async ({ request }) => {
    const res = await request.post(INIT, { data: { items: [] } })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/payments/verify requires auth', async ({ request }) => {
    const res = await request.post(VERIFY, { data: { reference: 'ref_123' } })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/payments/paypal/create requires auth', async ({ request }) => {
    const res = await request.post(PAYPAL_CREATE, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/payments/paypal/capture requires auth', async ({ request }) => {
    const res = await request.post(PAYPAL_CAPTURE, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/payments/pod-initialize requires auth', async ({ request }) => {
    const res = await request.post(POD_INIT, { data: {} })
    expect(res.status()).toBe(401)
  })
})

// ─── Input validation ─────────────────────────────────────────────────────────

test.describe('payments — validation', () => {
  test('POST /api/commerce/payments/initialize rejects missing items', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(INIT, {
      data: { name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/payments/initialize rejects empty items array', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(INIT, {
      data: { items: [], name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/payments/pod-initialize rejects zero shippingCost', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request, { shippingCost: 0, country: 'NG' })
    const res = await request.post(POD_INIT, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    // shippingCost must be >= 1 for POD
    expect(res.status()).toBe(400)
  })
})

// ─── Integration: Paystack/PayPal not configured in test env ──────────────────

test.describe('payments — provider not configured', () => {
  test('POST /api/commerce/payments/initialize returns non-401 (auth passes)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const body = await orderBody(request)
    const res = await request.post(INIT, {
      data: body,
      headers: { Authorization: `Bearer ${token}` },
    })
    // Authentication passes — any non-401 response is acceptable (order/Paystack may fail for other reasons)
    expect(res.status()).not.toBe(401)
  })

  test('POST /api/commerce/payments/paypal/create returns non-auth error when PayPal not configured', async ({ request }) => {
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
