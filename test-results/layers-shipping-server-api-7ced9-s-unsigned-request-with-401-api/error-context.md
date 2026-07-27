# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\shipping\server\api\shipping\__tests__\shipping-extended.spec.ts >> POST webhook/shippo — signature verification >> rejects unsigned request with 401
- Location: layers\shipping\server\api\shipping\__tests__\shipping-extended.spec.ts:144:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

# Test source

```ts
  49  |   expect(prodRes.status()).toBe(200)
  50  |   const product = (await prodRes.json()).data
  51  | 
  52  |   const orderRes = await request.post(ORDERS, {
  53  |     data: {
  54  |       items: [{ variantId: product.variants[0].id, quantity: 1 }],
  55  |       ...SHIPPING_TO,
  56  |     },
  57  |     headers: { Authorization: `Bearer ${buyer.token}` },
  58  |   })
  59  |   expect(orderRes.status()).toBe(200)
  60  |   const order = (await orderRes.json()).data
  61  | 
  62  |   return {
  63  |     productId: product.id as number,
  64  |     orderId: order.id as number,
  65  |     sellerToken: seller.token,
  66  |     buyerToken: buyer.token,
  67  |   }
  68  | }
  69  | 
  70  | async function archiveProduct(
  71  |   request: APIRequestContext,
  72  |   token: string,
  73  |   id: number | null | undefined,
  74  | ) {
  75  |   if (!id) return
  76  |   await request.delete(`${PRODUCTS}/${id}`, {
  77  |     headers: { Authorization: `Bearer ${token}` },
  78  |   })
  79  | }
  80  | 
  81  | // ─── Create shipment — auth & state guards ────────────────────────────────────
  82  | 
  83  | test.describe('POST /api/shipping/create — guards', () => {
  84  |   let ctx: Awaited<ReturnType<typeof setupOrder>>
  85  | 
  86  |   test.beforeAll(async ({ request }) => {
  87  |     test.setTimeout(120_000) // first request after an HMR rebuild can be slow
  88  |     ctx = await setupOrder(request)
  89  |   })
  90  | 
  91  |   test('requires authentication', async ({ request }) => {
  92  |     const res = await request.post(CREATE, {
  93  |       data: { orderId: 1, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
  94  |     })
  95  |     expect(res.status()).toBe(401)
  96  |   })
  97  | 
  98  |   test('rejects missing fields', async ({ request }) => {
  99  |     const res = await request.post(CREATE, {
  100 |       data: { orderId: ctx.orderId },
  101 |       headers: { Authorization: `Bearer ${ctx.sellerToken}` },
  102 |     })
  103 |     expect(res.status()).toBe(400)
  104 |   })
  105 | 
  106 |   test('404 for unknown order', async ({ request }) => {
  107 |     const res = await request.post(CREATE, {
  108 |       data: { orderId: 999999999, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
  109 |       headers: { Authorization: `Bearer ${ctx.sellerToken}` },
  110 |     })
  111 |     expect(res.status()).toBe(404)
  112 |   })
  113 | 
  114 |   test('403 for a user unrelated to the order', async ({ request }) => {
  115 |     const { token } = await apiLogin(request, BUYER_ONLY)
  116 |     const res = await request.post(CREATE, {
  117 |       data: { orderId: ctx.orderId, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
  118 |       headers: { Authorization: `Bearer ${token}` },
  119 |     })
  120 |     expect(res.status()).toBe(403)
  121 |   })
  122 | 
  123 |   test('400 for an order that is not CONFIRMED (state guard)', async ({ request }) => {
  124 |     // Order is freshly placed → PENDING. Seller in the order is authorized but
  125 |     // booking must be blocked until the order is confirmed.
  126 |     const res = await request.post(CREATE, {
  127 |       data: { orderId: ctx.orderId, rateId: 'rate_x', from: ADDRESS, to: ADDRESS },
  128 |       headers: { Authorization: `Bearer ${ctx.sellerToken}` },
  129 |     })
  130 |     expect(res.status()).toBe(400)
  131 |     const body = await res.json().catch(() => ({}))
  132 |     expect(JSON.stringify(body)).toMatch(/PENDING/i)
  133 |   })
  134 | 
  135 |   test.afterAll(async ({ request }) => {
  136 |     if (!ctx) return
  137 |     await archiveProduct(request, ctx.sellerToken, ctx.productId)
  138 |   })
  139 | })
  140 | 
  141 | // ─── Webhooks — signature gate (shippo: secret configured in dev .env) ────────
  142 | 
  143 | test.describe('POST webhook/shippo — signature verification', () => {
  144 |   test('rejects unsigned request with 401', async ({ request }) => {
  145 |     const res = await request.post(WEBHOOK_SHIPPO, {
  146 |       data: JSON.stringify({ event: 'ping', data: {} }),
  147 |       headers: { 'Content-Type': 'application/json' },
  148 |     })
> 149 |     expect(res.status()).toBe(401)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  150 |   })
  151 | 
  152 |   test('rejects request with a garbage signature', async ({ request }) => {
  153 |     const res = await request.post(WEBHOOK_SHIPPO, {
  154 |       data: JSON.stringify({ event: 'ping', data: {} }),
  155 |       headers: {
  156 |         'Content-Type': 'application/json',
  157 |         'X-Shippo-Signature': 'deadbeef'.repeat(8),
  158 |       },
  159 |     })
  160 |     expect(res.status()).toBe(401)
  161 |   })
  162 | })
  163 | 
  164 | // ─── Webhook — payload hardening (sendbox: secret unset in dev → skip) ────────
  165 | 
  166 | test.describe('POST webhook/sendbox — payload hardening', () => {
  167 |   test('rejects invalid JSON with 400', async ({ request }) => {
  168 |     // text/plain so Playwright does not JSON-serialize the string into valid JSON
  169 |     const res = await request.post(WEBHOOK_SENDBOX, {
  170 |       data: 'not-json{{{',
  171 |       headers: { 'Content-Type': 'text/plain' },
  172 |     })
  173 |     expect(res.status()).toBe(400)
  174 |   })
  175 | 
  176 |   test('acknowledges payload without tracking number (no-op)', async ({ request }) => {
  177 |     const res = await request.post(WEBHOOK_SENDBOX, {
  178 |       data: JSON.stringify({ event: 'ping', data: {} }),
  179 |       headers: { 'Content-Type': 'application/json' },
  180 |     })
  181 |     expect(res.status()).toBe(200)
  182 |     const body = await res.json()
  183 |     expect(body.received).toBe(true)
  184 |   })
  185 | 
  186 |   test('acknowledges payload with unknown tracking number', async ({ request }) => {
  187 |     const res = await request.post(WEBHOOK_SENDBOX, {
  188 |       data: JSON.stringify({
  189 |         event: 'status_updated',
  190 |         data: { tracking_number: 'NO-SUCH-TRACKING-123', status: 'delivered' },
  191 |       }),
  192 |       headers: { 'Content-Type': 'application/json' },
  193 |     })
  194 |     expect(res.status()).toBe(200)
  195 |     const body = await res.json()
  196 |     expect(body.received).toBe(true)
  197 |   })
  198 | })
  199 | 
  200 | // ─── Webhook — full status flow + no-downgrade guard ──────────────────────────
  201 | 
  202 | test.describe('webhook/sendbox — order status transitions', () => {
  203 |   let ctx: Awaited<ReturnType<typeof setupOrder>>
  204 |   const trackingNumber = `AUDIT-TRK-${Date.now()}`
  205 | 
  206 |   test.beforeAll(async ({ request }) => {
  207 |     test.setTimeout(120_000) // first request after an HMR rebuild can be slow
  208 |     ctx = await setupOrder(request)
  209 | 
  210 |     // Walk the order to SHIPPED with our tracking number attached
  211 |     for (const status of ['CONFIRMED', 'SHIPPED']) {
  212 |       const res = await request.patch(`${ORDERS}/${ctx.orderId}/status`, {
  213 |         data: { status, ...(status === 'SHIPPED' ? { trackingNumber } : {}) },
  214 |         headers: { Authorization: `Bearer ${ctx.sellerToken}` },
  215 |       })
  216 |       expect(res.status()).toBe(200)
  217 |     }
  218 |   })
  219 | 
  220 |   test('DELIVERED event marks the order delivered', async ({ request }) => {
  221 |     const res = await request.post(WEBHOOK_SENDBOX, {
  222 |       data: JSON.stringify({
  223 |         event: 'status_updated',
  224 |         data: { tracking_number: trackingNumber, status: 'delivered' },
  225 |       }),
  226 |       headers: { 'Content-Type': 'application/json' },
  227 |     })
  228 |     expect(res.status()).toBe(200)
  229 | 
  230 |     const orderRes = await request.get(`${ORDERS}/${ctx.orderId}`, {
  231 |       headers: { Authorization: `Bearer ${ctx.buyerToken}` },
  232 |     })
  233 |     const order = (await orderRes.json()).data
  234 |     expect(order.status).toBe('DELIVERED')
  235 |   })
  236 | 
  237 |   test('late IN_TRANSIT event does not downgrade a DELIVERED order', async ({ request }) => {
  238 |     const res = await request.post(WEBHOOK_SENDBOX, {
  239 |       data: JSON.stringify({
  240 |         event: 'status_updated',
  241 |         data: { tracking_number: trackingNumber, status: 'in_transit' },
  242 |       }),
  243 |       headers: { 'Content-Type': 'application/json' },
  244 |     })
  245 |     expect(res.status()).toBe(200)
  246 | 
  247 |     const orderRes = await request.get(`${ORDERS}/${ctx.orderId}`, {
  248 |       headers: { Authorization: `Bearer ${ctx.buyerToken}` },
  249 |     })
```