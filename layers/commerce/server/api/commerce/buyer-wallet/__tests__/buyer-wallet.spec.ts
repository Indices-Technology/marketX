import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const BUYER_WALLET = '/api/commerce/buyer-wallet'

test.describe('GET /api/commerce/buyer-wallet', () => {
  test('requires authentication', async ({ request }) => {
    const res = await request.get(BUYER_WALLET)
    expect(res.status()).toBe(401)
  })

  test('returns wallet and stats for authenticated user', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(BUYER_WALLET, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('wallet')
    expect(body.data).toHaveProperty('stats')
    expect(typeof body.data.wallet.balance).toBe('number')
    expect(body.data.wallet.balance).toBeGreaterThanOrEqual(0)
    expect(typeof body.data.stats.totalEarned).toBe('number')
    expect(typeof body.data.stats.totalSpent).toBe('number')
  })

  test('also works for seller accounts', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get(BUYER_WALLET, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.wallet).toBeDefined()
  })
})

test.describe('GET /api/commerce/buyer-wallet/transactions', () => {
  test('requires authentication', async ({ request }) => {
    const res = await request.get(`${BUYER_WALLET}/transactions`)
    expect(res.status()).toBe(401)
  })

  test('returns transaction list with pagination fields', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${BUYER_WALLET}/transactions?limit=10&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.transactions)).toBe(true)
    expect(typeof body.data.total).toBe('number')
    expect(typeof body.data.limit).toBe('number')
    expect(typeof body.data.offset).toBe('number')
    expect(typeof body.data.hasMore).toBe('boolean')
  })

  test('rejects invalid limit', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${BUYER_WALLET}/transactions?limit=999`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('each transaction has expected shape', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(`${BUYER_WALLET}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    for (const tx of data.transactions) {
      expect(typeof tx.id).toBe('string')
      expect(typeof tx.amount).toBe('number')
      expect(tx.amount).toBeGreaterThanOrEqual(0)
      expect(typeof tx.type).toBe('string')
      expect(typeof tx.description).toBe('string')
      expect(typeof tx.created_at).toBe('string')
    }
  })
})
