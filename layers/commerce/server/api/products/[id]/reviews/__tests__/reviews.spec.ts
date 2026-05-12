import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../../tests/helpers/auth'

// Resolve a real product ID from seed slug at test time
async function getSeedProductId(request: any): Promise<number> {
  const res = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
  const body = await res.json()
  const id = body.data?.id
  if (!id) throw new Error('Seed product not found')
  return id as number
}

function getSeedSellerSlug(): string {
  return 'balogun-fabrics'
}

// ─── Product reviews ──────────────────────────────────────────────────────────

test.describe('product reviews — public', () => {
  test('GET /api/products/:id/reviews returns list', async ({ request }) => {
    const productId = await getSeedProductId(request)
    const res = await request.get(`/api/products/${productId}/reviews`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
    expect(body).toHaveProperty('meta')
  })

  test('GET /api/products/:id/reviews returns 400 for invalid id', async ({ request }) => {
    const res = await request.get('/api/products/abc/reviews')
    expect(res.status()).toBe(400)
  })

  test('GET /api/products/:id/reviews supports pagination', async ({ request }) => {
    const productId = await getSeedProductId(request)
    const res = await request.get(`/api/products/${productId}/reviews?limit=5&offset=0`)
    expect(res.status()).toBe(200)
  })
})

test.describe('product reviews — auth guards', () => {
  test('POST /api/products/:id/reviews requires auth', async ({ request }) => {
    const res = await request.post('/api/products/1/reviews', {
      data: { rating: 5 },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('product reviews — validation', () => {
  test('POST /api/products/:id/reviews rejects rating out of range', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const productId = await getSeedProductId(request)
    const res = await request.post(`/api/products/${productId}/reviews`, {
      data: { rating: 6 },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/products/:id/reviews rejects missing rating', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const productId = await getSeedProductId(request)
    const res = await request.post(`/api/products/${productId}/reviews`, {
      data: { body: 'Great product' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })
})

// ─── Seller reviews ───────────────────────────────────────────────────────────

test.describe('seller reviews — public', () => {
  test('GET /api/seller/:id/reviews returns list', async ({ request }) => {
    const sellerId = getSeedSellerSlug()
    const res = await request.get(`/api/seller/${sellerId}/reviews`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/seller/:id/reviews/eligibility requires auth', async ({ request }) => {
    const sellerId = getSeedSellerSlug()
    const res = await request.get(`/api/seller/${sellerId}/reviews/eligibility`)
    expect(res.status()).toBe(401)
  })
})

test.describe('seller reviews — auth guards', () => {
  test('POST /api/seller/:id/reviews requires auth', async ({ request }) => {
    const res = await request.post('/api/seller/fake-id/reviews', {
      data: { rating: 5 },
    })
    expect(res.status()).toBe(401)
  })
})

// ─── Bank accounts ────────────────────────────────────────────────────────────

test.describe('bank accounts — auth guards', () => {
  test('GET /api/seller/bank-accounts requires auth', async ({ request }) => {
    const res = await request.get('/api/seller/bank-accounts')
    expect(res.status()).toBe(401)
  })

  test('POST /api/seller/bank-accounts requires auth', async ({ request }) => {
    const res = await request.post('/api/seller/bank-accounts', { data: {} })
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/seller/bank-accounts/:id requires auth', async ({ request }) => {
    const res = await request.delete('/api/seller/bank-accounts/00000000-0000-4000-8000-000000000000')
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/seller/bank-accounts/:id/set-default requires auth', async ({ request }) => {
    const res = await request.patch('/api/seller/bank-accounts/00000000-0000-4000-8000-000000000000/set-default')
    expect(res.status()).toBe(401)
  })
})

test.describe('bank accounts — seller', () => {
  test('GET /api/seller/bank-accounts returns list', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.get('/api/seller/bank-accounts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('GET /api/seller/bank-accounts returns empty for non-seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.get('/api/seller/bank-accounts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  test('POST /api/seller/bank-accounts rejects invalid sellerId', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post('/api/seller/bank-accounts', {
      data: {
        sellerId: 'not-a-uuid',
        bankName: 'GTBank',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Test Account',
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/seller/bank-accounts rejects account for another seller', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post('/api/seller/bank-accounts', {
      data: {
        sellerId: '00000000-0000-4000-8000-000000000001',
        bankName: 'GTBank',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Test Account',
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })
})
