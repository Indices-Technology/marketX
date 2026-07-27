# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\products\[id]\reviews\__tests__\reviews.spec.ts >> seller reviews — auth guards >> POST /api/seller/:id/reviews requires auth
- Location: layers\commerce\server\api\products\[id]\reviews\__tests__\reviews.spec.ts:93:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../../tests/helpers/auth'
  3   | 
  4   | // Resolve a real product ID from seed slug at test time
  5   | async function getSeedProductId(request: any): Promise<number> {
  6   |   const res = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
  7   |   const body = await res.json()
  8   |   const id = body.data?.id
  9   |   if (!id) throw new Error('Seed product not found')
  10  |   return id as number
  11  | }
  12  | 
  13  | function getSeedSellerSlug(): string {
  14  |   return 'balogun-fabrics'
  15  | }
  16  | 
  17  | // ─── Product reviews ──────────────────────────────────────────────────────────
  18  | 
  19  | test.describe('product reviews — public', () => {
  20  |   test('GET /api/products/:id/reviews returns list', async ({ request }) => {
  21  |     const productId = await getSeedProductId(request)
  22  |     const res = await request.get(`/api/products/${productId}/reviews`)
  23  |     expect(res.status()).toBe(200)
  24  |     const body = await res.json()
  25  |     expect(body.success).toBe(true)
  26  |     expect(body.data).toBeInstanceOf(Array)
  27  |     expect(body).toHaveProperty('meta')
  28  |   })
  29  | 
  30  |   test('GET /api/products/:id/reviews returns 400 for invalid id', async ({ request }) => {
  31  |     const res = await request.get('/api/products/abc/reviews')
  32  |     expect(res.status()).toBe(400)
  33  |   })
  34  | 
  35  |   test('GET /api/products/:id/reviews supports pagination', async ({ request }) => {
  36  |     const productId = await getSeedProductId(request)
  37  |     const res = await request.get(`/api/products/${productId}/reviews?limit=5&offset=0`)
  38  |     expect(res.status()).toBe(200)
  39  |   })
  40  | })
  41  | 
  42  | test.describe('product reviews — auth guards', () => {
  43  |   test('POST /api/products/:id/reviews requires auth', async ({ request }) => {
  44  |     const res = await request.post('/api/products/1/reviews', {
  45  |       data: { rating: 5 },
  46  |     })
  47  |     expect(res.status()).toBe(401)
  48  |   })
  49  | })
  50  | 
  51  | test.describe('product reviews — validation', () => {
  52  |   test('POST /api/products/:id/reviews rejects rating out of range', async ({ request }) => {
  53  |     const { token } = await apiLogin(request, TEST_USER)
  54  |     const productId = await getSeedProductId(request)
  55  |     const res = await request.post(`/api/products/${productId}/reviews`, {
  56  |       data: { rating: 6 },
  57  |       headers: { Authorization: `Bearer ${token}` },
  58  |     })
  59  |     expect(res.status()).toBe(400)
  60  |   })
  61  | 
  62  |   test('POST /api/products/:id/reviews rejects missing rating', async ({ request }) => {
  63  |     const { token } = await apiLogin(request, TEST_USER)
  64  |     const productId = await getSeedProductId(request)
  65  |     const res = await request.post(`/api/products/${productId}/reviews`, {
  66  |       data: { body: 'Great product' },
  67  |       headers: { Authorization: `Bearer ${token}` },
  68  |     })
  69  |     expect(res.status()).toBe(400)
  70  |   })
  71  | })
  72  | 
  73  | // ─── Seller reviews ───────────────────────────────────────────────────────────
  74  | 
  75  | test.describe('seller reviews — public', () => {
  76  |   test('GET /api/seller/:id/reviews returns list', async ({ request }) => {
  77  |     const sellerId = getSeedSellerSlug()
  78  |     const res = await request.get(`/api/seller/${sellerId}/reviews`)
  79  |     expect(res.status()).toBe(200)
  80  |     const body = await res.json()
  81  |     expect(body.success).toBe(true)
  82  |     expect(body.data).toBeInstanceOf(Array)
  83  |   })
  84  | 
  85  |   test('GET /api/seller/:id/reviews/eligibility requires auth', async ({ request }) => {
  86  |     const sellerId = getSeedSellerSlug()
  87  |     const res = await request.get(`/api/seller/${sellerId}/reviews/eligibility`)
  88  |     expect(res.status()).toBe(401)
  89  |   })
  90  | })
  91  | 
  92  | test.describe('seller reviews — auth guards', () => {
  93  |   test('POST /api/seller/:id/reviews requires auth', async ({ request }) => {
  94  |     const res = await request.post('/api/seller/fake-id/reviews', {
  95  |       data: { rating: 5 },
  96  |     })
> 97  |     expect(res.status()).toBe(401)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  98  |   })
  99  | })
  100 | 
  101 | // ─── Bank accounts ────────────────────────────────────────────────────────────
  102 | 
  103 | test.describe('bank accounts — auth guards', () => {
  104 |   test('GET /api/seller/bank-accounts requires auth', async ({ request }) => {
  105 |     const res = await request.get('/api/seller/bank-accounts')
  106 |     expect(res.status()).toBe(401)
  107 |   })
  108 | 
  109 |   test('POST /api/seller/bank-accounts requires auth', async ({ request }) => {
  110 |     const res = await request.post('/api/seller/bank-accounts', { data: {} })
  111 |     expect(res.status()).toBe(401)
  112 |   })
  113 | 
  114 |   test('DELETE /api/seller/bank-accounts/:id requires auth', async ({ request }) => {
  115 |     const res = await request.delete('/api/seller/bank-accounts/00000000-0000-4000-8000-000000000000')
  116 |     expect(res.status()).toBe(401)
  117 |   })
  118 | 
  119 |   test('PATCH /api/seller/bank-accounts/:id/set-default requires auth', async ({ request }) => {
  120 |     const res = await request.patch('/api/seller/bank-accounts/00000000-0000-4000-8000-000000000000/set-default')
  121 |     expect(res.status()).toBe(401)
  122 |   })
  123 | })
  124 | 
  125 | test.describe('bank accounts — seller', () => {
  126 |   test('GET /api/seller/bank-accounts returns list', async ({ request }) => {
  127 |     const { token } = await apiLogin(request, TEST_SELLER)
  128 |     const res = await request.get('/api/seller/bank-accounts', {
  129 |       headers: { Authorization: `Bearer ${token}` },
  130 |     })
  131 |     expect(res.status()).toBe(200)
  132 |     const body = await res.json()
  133 |     expect(body.success).toBe(true)
  134 |     expect(body.data).toBeInstanceOf(Array)
  135 |   })
  136 | 
  137 |   test('GET /api/seller/bank-accounts returns empty for non-seller', async ({ request }) => {
  138 |     const { token } = await apiLogin(request, TEST_USER)
  139 |     const res = await request.get('/api/seller/bank-accounts', {
  140 |       headers: { Authorization: `Bearer ${token}` },
  141 |     })
  142 |     expect(res.status()).toBe(200)
  143 |     const body = await res.json()
  144 |     expect(body.data).toHaveLength(0)
  145 |   })
  146 | 
  147 |   test('POST /api/seller/bank-accounts rejects invalid sellerId', async ({ request }) => {
  148 |     const { token } = await apiLogin(request, TEST_SELLER)
  149 |     const res = await request.post('/api/seller/bank-accounts', {
  150 |       data: {
  151 |         sellerId: 'not-a-uuid',
  152 |         bankName: 'GTBank',
  153 |         bankCode: '058',
  154 |         accountNumber: '0123456789',
  155 |         accountName: 'Test Account',
  156 |       },
  157 |       headers: { Authorization: `Bearer ${token}` },
  158 |     })
  159 |     expect(res.status()).toBe(400)
  160 |   })
  161 | 
  162 |   test('POST /api/seller/bank-accounts rejects account for another seller', async ({ request }) => {
  163 |     const { token } = await apiLogin(request, TEST_USER)
  164 |     const res = await request.post('/api/seller/bank-accounts', {
  165 |       data: {
  166 |         sellerId: '00000000-0000-4000-8000-000000000001',
  167 |         bankName: 'GTBank',
  168 |         bankCode: '058',
  169 |         accountNumber: '0123456789',
  170 |         accountName: 'Test Account',
  171 |       },
  172 |       headers: { Authorization: `Bearer ${token}` },
  173 |     })
  174 |     expect(res.status()).toBe(403)
  175 |   })
  176 | })
  177 | 
```