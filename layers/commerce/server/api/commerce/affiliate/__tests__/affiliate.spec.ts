import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER } from '../../../../../../../tests/helpers/auth'

const AFFILIATE = '/api/commerce/affiliate'
const ENROLL = '/api/commerce/affiliate/enroll'
const AVAILABLE = '/api/commerce/affiliate/available-products'
const REFERRALS = '/api/commerce/affiliate/referrals'

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('affiliate — auth guards', () => {
  test('GET /api/commerce/affiliate requires auth', async ({ request }) => {
    const res = await request.get(AFFILIATE)
    expect(res.status()).toBe(401)
  })

  test('POST /api/commerce/affiliate/enroll requires auth', async ({ request }) => {
    const res = await request.post(ENROLL)
    expect(res.status()).toBe(401)
  })

  test('GET /api/commerce/affiliate/available-products is public (no auth needed)', async ({ request }) => {
    const res = await request.get(AVAILABLE)
    expect(res.status()).toBe(200)
  })

  test('GET /api/commerce/affiliate/referrals requires auth', async ({ request }) => {
    const res = await request.get(REFERRALS)
    expect(res.status()).toBe(401)
  })
})

// ─── Authenticated ────────────────────────────────────────────────────────────

test.describe('affiliate — authenticated', () => {
  test('GET /api/commerce/affiliate returns stats', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(AFFILIATE, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  test('POST /api/commerce/affiliate/enroll enrolls or returns existing', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 200 (already enrolled) or 201 (newly enrolled) — both valid
    expect(res.status()).toBeLessThan(300)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('GET /api/commerce/affiliate/available-products returns list', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(AVAILABLE, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/commerce/affiliate/referrals returns list', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get(REFERRALS, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
