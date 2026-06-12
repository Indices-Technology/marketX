// Wallet & Payouts audit suite — June pillar
// Covers: cross-seller store-wallet IDOR (real slug), payout-preview fee math
// against the public fee config, withdraw guards (negative, below-fees,
// insufficient balance, non-seller), and aggregate wallet consistency.
import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const WALLET = '/api/commerce/wallet'
const FEE_CONFIG = '/api/commerce/wallet/fee-config'
const PAYOUT_PREVIEW = '/api/commerce/wallet/payout-preview'
const WITHDRAW = '/api/commerce/wallet/withdraw'
const STORE_WALLET = (slug: string) => `/api/commerce/wallet/store/${slug}`

const SECOND_SELLER = { email: 'wuse@peppr.test', password: 'test1234' }
const BUYER_ONLY = { email: 'chidi@peppr.test', password: 'test1234' }

const BANK_ACCOUNT = {
  account_number: '0123456789',
  bank_code: '058',
  name: 'Audit Test Account',
}

// ─── Store wallet — cross-seller IDOR with a real slug ────────────────────────

test.describe('GET /api/commerce/wallet/store/:slug — IDOR', () => {
  test('seller cannot read another seller\'s wallet by real slug', async ({ request }) => {
    // Resolve the second seller's real store slug from their own wallet
    const second = await apiLogin(request, SECOND_SELLER)
    const ownRes = await request.get(WALLET, {
      headers: { Authorization: `Bearer ${second.token}` },
    })
    expect(ownRes.status()).toBe(200)
    const ownBody = await ownRes.json()
    const secondSlug: string | undefined = ownBody.data.stores?.[0]?.storeSlug
    test.skip(!secondSlug, 'second seller has no store in seed')

    // First seller requests it — must not see the wallet
    const first = await apiLogin(request, TEST_SELLER)
    const res = await request.get(STORE_WALLET(secondSlug!), {
      headers: { Authorization: `Bearer ${first.token}` },
    })
    expect(res.status()).toBe(404) // not-found semantics, no existence leak
  })
})

// ─── Payout preview — fee math against public config ──────────────────────────

test.describe('GET /api/commerce/wallet/payout-preview — fee calculation', () => {
  test('breakdown matches the public fee config exactly', async ({ request }) => {
    const configRes = await request.get(FEE_CONFIG)
    expect(configRes.status()).toBe(200)
    const config = (await configRes.json()).data
    const pct: number = config.platformFeePercent ?? config.config?.platformFeePercent
    const transferFee: number = config.transferFeeKobo ?? config.config?.transferFeeKobo
    expect(typeof pct).toBe('number')
    expect(typeof transferFee).toBe('number')

    const gross = 250_000 // ₦2,500 in kobo
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${PAYOUT_PREVIEW}?amount=${gross}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const data = (await res.json()).data

    const expectedPlatformFee = Math.round(gross * (pct / 100))
    expect(data.gross).toBe(gross)
    expect(data.platformFee).toBe(expectedPlatformFee)
    expect(data.transferFee).toBe(transferFee)
    expect(data.totalFees).toBe(expectedPlatformFee + transferFee)
    expect(data.net).toBe(Math.max(0, gross - expectedPlatformFee - transferFee))
  })

  test('rejects negative amount', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(`${PAYOUT_PREVIEW}?amount=-5000`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── Withdraw — guards ────────────────────────────────────────────────────────

test.describe('POST /api/commerce/wallet/withdraw — guards', () => {
  test('rejects negative amount', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(WITHDRAW, {
      data: { amount: -100_000, bankAccount: BANK_ACCOUNT },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects amount the fees would fully consume (zero-net)', async ({ request }) => {
    // ₦10 gross — far below the flat transfer fee alone
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(WITHDRAW, {
      data: { amount: 1000, bankAccount: BANK_ACCOUNT },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).toMatch(/fee/i)
  })

  test('rejects withdrawal above wallet balance', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(WITHDRAW, {
      data: { amount: 1_000_000_000_00, bankAccount: BANK_ACCOUNT }, // ₦1bn
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).toMatch(/insufficient/i)
  })

  test('rejects user without a seller profile', async ({ request }) => {
    const { token } = await apiLogin(request, BUYER_ONLY)
    const res = await request.post(WITHDRAW, {
      data: { amount: 100_000, bankAccount: BANK_ACCOUNT },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })
})

// ─── Aggregate wallet — structure & summation consistency ─────────────────────

test.describe('GET /api/commerce/wallet — aggregate', () => {
  test('totals equal the sum across stores', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(WALLET, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const data = (await res.json()).data

    expect(Array.isArray(data.stores)).toBe(true)
    expect(data.stores.length).toBeGreaterThan(0)

    const sumBalance = data.stores.reduce(
      (s: number, st: { wallet?: { balance?: number } }) => s + (st.wallet?.balance ?? 0),
      0,
    )
    const sumPending = data.stores.reduce(
      (s: number, st: { wallet?: { pending_balance?: number } }) =>
        s + (st.wallet?.pending_balance ?? 0),
      0,
    )
    expect(data.wallet.balance).toBe(sumBalance)
    expect(data.wallet.pending_balance).toBe(sumPending)
  })
})
