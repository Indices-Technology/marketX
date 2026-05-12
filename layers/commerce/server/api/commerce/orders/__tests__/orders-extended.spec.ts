import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'

const CONFIRM_CASH = (id: string) => `/api/commerce/orders/${id}/confirm-cash`
const REFUSE = (id: string) => `/api/commerce/orders/${id}/refuse-delivery`
const CONFIRM_RECEIPT = (id: string) => `/api/commerce/orders/${id}/confirm-receipt`
const STATUS = (id: string) => `/api/commerce/orders/${id}/status`

// ─── confirm-cash ──────────────────────────────────────────────────────────────

test.describe('orders — confirm-cash (POD)', () => {
  test('POST requires auth', async ({ request }) => {
    const res = await request.post(CONFIRM_CASH('1'))
    expect(res.status()).toBe(401)
  })

  test('POST with auth and non-numeric ID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CONFIRM_CASH('not-a-number'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST with auth and unknown order ID returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(CONFIRM_CASH('999999'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})

// ─── refuse-delivery ───────────────────────────────────────────────────────────

test.describe('orders — refuse-delivery (POD)', () => {
  test('POST requires auth', async ({ request }) => {
    const res = await request.post(REFUSE('1'))
    expect(res.status()).toBe(401)
  })

  test('POST with auth and non-numeric ID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(REFUSE('not-a-number'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST with auth and unknown order ID returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(REFUSE('999999'), {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})

// ─── confirm-receipt ───────────────────────────────────────────────────────────

test.describe('orders — confirm-receipt', () => {
  test('POST requires auth', async ({ request }) => {
    const res = await request.post(CONFIRM_RECEIPT('1'))
    expect(res.status()).toBe(401)
  })

  test('POST with auth and non-numeric ID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CONFIRM_RECEIPT('not-a-number'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST with auth and unknown order ID returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(CONFIRM_RECEIPT('999999'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})

// ─── status PATCH ─────────────────────────────────────────────────────────────

test.describe('orders — status PATCH', () => {
  test('PATCH requires auth', async ({ request }) => {
    const res = await request.patch(STATUS('1'), {
      data: { status: 'SHIPPED' },
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH with auth and non-numeric ID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS('not-a-number'), {
      data: { status: 'SHIPPED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH with auth and invalid body returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS('999999'), {
      data: { status: 'NOT_A_VALID_STATUS' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH with auth and unknown order ID returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.patch(STATUS('999999'), {
      data: { status: 'SHIPPED' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })
})
