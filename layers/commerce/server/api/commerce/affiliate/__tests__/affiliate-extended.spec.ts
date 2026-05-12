import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const AFFILIATE = '/api/commerce/affiliate'

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
})
