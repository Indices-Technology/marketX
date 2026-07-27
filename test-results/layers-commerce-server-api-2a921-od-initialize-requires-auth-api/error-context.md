# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\commerce\payments\__tests__\payments.spec.ts >> payments — auth guards >> POST /pod-initialize requires auth
- Location: layers\commerce\server\api\commerce\payments\__tests__\payments.spec.ts:52:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 403
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import crypto from 'crypto'
  3   | import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../../tests/helpers/auth'
  4   | 
  5   | const INIT        = '/api/commerce/payments/initialize'
  6   | const VERIFY      = '/api/commerce/payments/verify'
  7   | const PAYPAL_CREATE   = '/api/commerce/payments/paypal/create'
  8   | const PAYPAL_CAPTURE  = '/api/commerce/payments/paypal/capture'
  9   | const POD_INIT    = '/api/commerce/payments/pod-initialize'
  10  | const POD_VERIFY  = '/api/commerce/payments/pod-verify'
  11  | const WEBHOOK     = '/api/commerce/payments/webhook'
  12  | 
  13  | // Minimal valid order body — uses seed variant
  14  | const orderBody = async (request: any, overrides = {}) => {
  15  |   const varRes = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
  16  |   const varBody = await varRes.json()
  17  |   const variantId = varBody.data?.variants?.[0]?.id ?? 1
  18  |   return {
  19  |     items: [{ variantId, quantity: 1 }],
  20  |     name: 'Test Buyer',
  21  |     address: '1 Marina Street',
  22  |     zipcode: '100001',
  23  |     country: 'NG',
  24  |     shippingCost: 0,
  25  |     ...overrides,
  26  |   }
  27  | }
  28  | 
  29  | // ─── Auth guards ──────────────────────────────────────────────────────────────
  30  | 
  31  | test.describe('payments — auth guards', () => {
  32  |   test('POST /initialize requires auth', async ({ request }) => {
  33  |     const res = await request.post(INIT, { data: { items: [] } })
  34  |     expect(res.status()).toBe(401)
  35  |   })
  36  | 
  37  |   test('POST /verify requires auth', async ({ request }) => {
  38  |     const res = await request.post(VERIFY, { data: { reference: 'ref_123' } })
  39  |     expect(res.status()).toBe(401)
  40  |   })
  41  | 
  42  |   test('POST /paypal/create requires auth', async ({ request }) => {
  43  |     const res = await request.post(PAYPAL_CREATE, { data: {} })
  44  |     expect(res.status()).toBe(401)
  45  |   })
  46  | 
  47  |   test('POST /paypal/capture requires auth', async ({ request }) => {
  48  |     const res = await request.post(PAYPAL_CAPTURE, { data: {} })
  49  |     expect(res.status()).toBe(401)
  50  |   })
  51  | 
  52  |   test('POST /pod-initialize requires auth', async ({ request }) => {
  53  |     const res = await request.post(POD_INIT, { data: {} })
> 54  |     expect(res.status()).toBe(401)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  55  |   })
  56  | 
  57  |   test('POST /pod-verify requires auth', async ({ request }) => {
  58  |     const res = await request.post(POD_VERIFY, { data: { reference: 'ref_123' } })
  59  |     expect(res.status()).toBe(401)
  60  |   })
  61  | })
  62  | 
  63  | // ─── Input validation ─────────────────────────────────────────────────────────
  64  | 
  65  | test.describe('payments — validation', () => {
  66  |   test('POST /initialize rejects missing items', async ({ request }) => {
  67  |     const { token } = await apiLogin(request, TEST_USER)
  68  |     const res = await request.post(INIT, {
  69  |       data: { name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
  70  |       headers: { Authorization: `Bearer ${token}` },
  71  |     })
  72  |     expect(res.status()).toBe(400)
  73  |   })
  74  | 
  75  |   test('POST /initialize rejects empty items array', async ({ request }) => {
  76  |     const { token } = await apiLogin(request, TEST_USER)
  77  |     const res = await request.post(INIT, {
  78  |       data: { items: [], name: 'Test', address: '1 Main', zipcode: '100', country: 'NG' },
  79  |       headers: { Authorization: `Bearer ${token}` },
  80  |     })
  81  |     expect(res.status()).toBe(400)
  82  |   })
  83  | 
  84  |   test('POST /pod-initialize rejects zero shippingCost', async ({ request }) => {
  85  |     const { token } = await apiLogin(request, TEST_USER)
  86  |     const body = await orderBody(request, { shippingCost: 0, country: 'NG' })
  87  |     const res = await request.post(POD_INIT, {
  88  |       data: body,
  89  |       headers: { Authorization: `Bearer ${token}` },
  90  |     })
  91  |     expect(res.status()).toBe(400)
  92  |   })
  93  | 
  94  |   test('POST /verify rejects missing reference', async ({ request }) => {
  95  |     const { token } = await apiLogin(request, TEST_USER)
  96  |     const res = await request.post(VERIFY, {
  97  |       data: {},
  98  |       headers: { Authorization: `Bearer ${token}` },
  99  |     })
  100 |     expect(res.status()).toBe(400)
  101 |   })
  102 | 
  103 |   test('POST /pod-verify rejects missing reference', async ({ request }) => {
  104 |     const { token } = await apiLogin(request, TEST_USER)
  105 |     const res = await request.post(POD_VERIFY, {
  106 |       data: {},
  107 |       headers: { Authorization: `Bearer ${token}` },
  108 |     })
  109 |     expect(res.status()).toBe(400)
  110 |   })
  111 | 
  112 |   test('POST /paypal/capture rejects missing fields', async ({ request }) => {
  113 |     const { token } = await apiLogin(request, TEST_USER)
  114 |     const res = await request.post(PAYPAL_CAPTURE, {
  115 |       data: { orderId: 'not-a-number' },
  116 |       headers: { Authorization: `Bearer ${token}` },
  117 |     })
  118 |     expect(res.status()).toBe(400)
  119 |   })
  120 | })
  121 | 
  122 | // ─── Not found ────────────────────────────────────────────────────────────────
  123 | 
  124 | test.describe('payments — reference not found', () => {
  125 |   test('POST /verify returns 404 for unknown reference', async ({ request }) => {
  126 |     const { token } = await apiLogin(request, TEST_USER)
  127 |     const res = await request.post(VERIFY, {
  128 |       data: { reference: `fake_ref_${Date.now()}` },
  129 |       headers: { Authorization: `Bearer ${token}` },
  130 |     })
  131 |     expect(res.status()).toBe(404)
  132 |   })
  133 | 
  134 |   test('POST /pod-verify returns 404 for unknown reference', async ({ request }) => {
  135 |     const { token } = await apiLogin(request, TEST_USER)
  136 |     const res = await request.post(POD_VERIFY, {
  137 |       data: { reference: `fake_pod_ref_${Date.now()}` },
  138 |       headers: { Authorization: `Bearer ${token}` },
  139 |     })
  140 |     expect(res.status()).toBe(404)
  141 |   })
  142 | 
  143 |   test('POST /paypal/capture returns 404 for unknown orderId', async ({ request }) => {
  144 |     const { token } = await apiLogin(request, TEST_USER)
  145 |     const res = await request.post(PAYPAL_CAPTURE, {
  146 |       data: { orderId: 999999999, paypalOrderId: 'fake_paypal_id' },
  147 |       headers: { Authorization: `Bearer ${token}` },
  148 |     })
  149 |     expect(res.status()).toBe(404)
  150 |   })
  151 | })
  152 | 
  153 | // ─── IDOR: another user cannot access another's payment reference ─────────────
  154 | 
```