import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const WALLET = '/api/commerce/wallet'
const TRANSACTIONS = '/api/commerce/wallet/transactions'
const FEE_CONFIG = '/api/commerce/wallet/fee-config'
const PAYOUT_PREVIEW = '/api/commerce/wallet/payout-preview'
const ADD_FUNDS = '/api/commerce/wallet/add-funds'
const WITHDRAW = '/api/commerce/wallet/withdraw'
const STORE_WALLET = (slug: string) => `/api/commerce/wallet/store/${slug}`

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('wallet — auth guards', () => {
  test('GET /api/commerce/wallet requires auth', async ({ request }) => {
    const res = await request.get(WALLET)
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/wallet/transactions requires auth', async ({ request }) => {
    const res = await request.get(TRANSACTIONS)
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/wallet/payout-preview requires auth', async ({ request }) => {
    const res = await request.get(`${PAYOUT_PREVIEW}?amount=10000`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/wallet/add-funds requires auth', async ({ request }) => {
    const res = await request.post(ADD_FUNDS, { data: { amount: 1000 } })
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/wallet/withdraw requires auth', async ({ request }) => {
    const res = await request.post(WITHDRAW, { data: { amount: 1000, bankAccount: {} } })
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/wallet/store/:slug requires auth', async ({ request }) => {
    const res = await request.get(STORE_WALLET('balogun-fabrics'))
    expect(res.status()).toBe(401)
  })
})

// ─── Public endpoints ─────────────────────────────────────────────────────────

test.describe('wallet — public endpoints', () => {
  test('GET /api/commerce/wallet/fee-config is public', async ({ request }) => {
    const res = await request.get(FEE_CONFIG)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('example')
  })
})

// ─── Authenticated: buyer (non-seller) ───────────────────────────────────────

test.describe('wallet — buyer (non-seller)', () => {
  test('GET /api/commerce/wallet returns empty state for non-seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(WALLET, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('wallet')
    expect(body.data).toHaveProperty('stores')
  })

  test('GET /api/commerce/wallet/transactions returns empty for non-seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(TRANSACTIONS, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.transactions).toBeInstanceOf(Array)
  })

  test('POST /api/commerce/wallet/add-funds returns non-401 for seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(ADD_FUNDS, {
      data: { amount: 5000 },
      headers: { Authorization: `Bearer ${token}` },
    })
    // Seller can call add-funds — Paystack may not be configured but auth passes
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(403)
  })
})

// ─── Authenticated: seller ────────────────────────────────────────────────────

test.describe('wallet — seller', () => {
  test('GET /api/commerce/wallet/store/:slug returns seller wallet', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(STORE_WALLET(TEST_SELLER.storeSlug), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('balance')
    expect(body.data).toHaveProperty('storeSlug', TEST_SELLER.storeSlug)
  })

  test('GET /api/commerce/wallet/store/:slug returns 404 for wrong store', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(STORE_WALLET('not-my-store'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('GET /api/commerce/wallet/payout-preview returns breakdown', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${PAYOUT_PREVIEW}?amount=100000`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('net')
  })

  test('GET /api/commerce/wallet/payout-preview returns 400 for zero amount', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${PAYOUT_PREVIEW}?amount=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/wallet/withdraw returns 400 without amount', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(WITHDRAW, {
      data: { bankAccount: { bankName: 'GTBank' } },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/wallet/withdraw returns 400 without bankAccount', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(WITHDRAW, {
      data: { amount: 50000 },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})
