# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\commerce\orders\__tests__\orders-extended.spec.ts >> PATCH /api/commerce/orders/:id/status — authorization & transitions >> buyer cannot update order status (403)
- Location: layers\commerce\server\api\commerce\orders\__tests__\orders-extended.spec.ts:249:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 400
```

# Test source

```ts
  160 |   test('requires storeSlug param', async ({ request }) => {
  161 |     const { token } = await apiLogin(request, TEST_SELLER)
  162 |     const res = await request.get(SELLER_ORDERS, { headers: { Authorization: `Bearer ${token}` } })
  163 |     expect(res.status()).toBe(400)
  164 |   })
  165 | 
  166 |   test('TEST_USER cannot access TEST_SELLER store orders (403)', async ({ request }) => {
  167 |     const { token } = await apiLogin(request, TEST_USER)
  168 |     const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
  169 |       headers: { Authorization: `Bearer ${token}` },
  170 |     })
  171 |     expect(res.status()).toBe(403)
  172 |   })
  173 | 
  174 |   test('seller order list contains sellerBreakdown per order', async ({ request }) => {
  175 |     const { token } = await apiLogin(request, TEST_SELLER)
  176 |     const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
  177 |       headers: { Authorization: `Bearer ${token}` },
  178 |     })
  179 |     expect(res.status()).toBe(200)
  180 |     const { data } = await res.json()
  181 |     expect(Array.isArray(data.orders)).toBe(true)
  182 |     for (const order of data.orders) {
  183 |       expect(order).toHaveProperty('sellerBreakdown')
  184 |       expect(typeof order.sellerBreakdown.gross).toBe('number')
  185 |       expect(typeof order.sellerBreakdown.net).toBe('number')
  186 |       expect(order.sellerBreakdown.net).toBeLessThanOrEqual(order.sellerBreakdown.gross)
  187 |     }
  188 |   })
  189 | })
  190 | 
  191 | // ─── Cancel — IDOR & state ────────────────────────────────────────────────────
  192 | 
  193 | test.describe('POST /api/commerce/orders/:id/cancel — IDOR & state', () => {
  194 |   test('seller cannot cancel a buyer\'s order (403)', async ({ request }) => {
  195 |     const { token: userToken } = await apiLogin(request, TEST_USER)
  196 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
  197 |     const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
  198 |     if (!orders.length) { test.skip(); return }
  199 | 
  200 |     const orderId = orders[0].id
  201 |     const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
  202 |     const res = await request.post(CANCEL(orderId), {
  203 |       headers: { Authorization: `Bearer ${sellerToken}` },
  204 |     })
  205 |     expect(res.status()).toBe(403)
  206 |   })
  207 | })
  208 | 
  209 | // ─── Confirm receipt — IDOR & state ──────────────────────────────────────────
  210 | 
  211 | test.describe('POST /api/commerce/orders/:id/confirm-receipt', () => {
  212 |   test('seller cannot confirm receipt for a buyer\'s order (403)', async ({ request }) => {
  213 |     const { token: userToken } = await apiLogin(request, TEST_USER)
  214 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
  215 |     const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
  216 |     if (!orders.length) { test.skip(); return }
  217 | 
  218 |     const orderId = orders[0].id
  219 |     const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
  220 |     const res = await request.post(CONFIRM_RECEIPT(orderId), {
  221 |       headers: { Authorization: `Bearer ${sellerToken}` },
  222 |     })
  223 |     expect(res.status()).toBe(403)
  224 |   })
  225 | 
  226 |   test('returns 400 for order not in a confirmable state (PENDING)', async ({ request }) => {
  227 |     // Find a PENDING or CANCELLED order to confirm — should be rejected
  228 |     const { token } = await apiLogin(request, TEST_USER)
  229 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
  230 |     const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
  231 |     const invalid = orders.find((o) => ['PENDING', 'CANCELLED', 'RETURNED'].includes(o.status))
  232 |     if (!invalid) { test.skip(); return }
  233 | 
  234 |     const res = await request.post(CONFIRM_RECEIPT(invalid.id), {
  235 |       headers: { Authorization: `Bearer ${token}` },
  236 |     })
  237 |     // Already DELIVERED returns 200 (idempotent); otherwise 400
  238 |     if (invalid.status === 'DELIVERED') {
  239 |       expect(res.status()).toBe(200)
  240 |     } else {
  241 |       expect(res.status()).toBe(400)
  242 |     }
  243 |   })
  244 | })
  245 | 
  246 | // ─── Status PATCH — seller-only & valid transitions ──────────────────────────
  247 | 
  248 | test.describe('PATCH /api/commerce/orders/:id/status — authorization & transitions', () => {
  249 |   test('buyer cannot update order status (403)', async ({ request }) => {
  250 |     const { token: userToken } = await apiLogin(request, TEST_USER)
  251 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${userToken}` } })
  252 |     const orders: Array<{ id: number }> = (await listRes.json()).data?.orders ?? []
  253 |     if (!orders.length) { test.skip(); return }
  254 | 
  255 |     const orderId = orders[0].id
  256 |     const res = await request.patch(STATUS(orderId), {
  257 |       data: { status: 'DELIVERED' },
  258 |       headers: { Authorization: `Bearer ${userToken}` },
  259 |     })
> 260 |     expect(res.status()).toBe(403)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  261 |   })
  262 | 
  263 |   test('rejects invalid status value (400)', async ({ request }) => {
  264 |     const { token } = await apiLogin(request, TEST_SELLER)
  265 |     const res = await request.patch(STATUS(999999999), {
  266 |       data: { status: 'PROCESSING' },
  267 |       headers: { Authorization: `Bearer ${token}` },
  268 |     })
  269 |     // Zod rejects unknown enum value before the 404 check
  270 |     expect(res.status()).toBe(400)
  271 |   })
  272 | 
  273 |   test('seller order list orders have known status values', async ({ request }) => {
  274 |     const { token } = await apiLogin(request, TEST_SELLER)
  275 |     const res = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
  276 |       headers: { Authorization: `Bearer ${token}` },
  277 |     })
  278 |     const { data } = await res.json()
  279 |     const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'PROCESSING'])
  280 |     for (const order of data.orders) {
  281 |       expect(VALID_STATUSES.has(order.status)).toBe(true)
  282 |     }
  283 |   })
  284 | 
  285 |   test('cannot move order backward: non-existent order returns 404 before transition check', async ({ request }) => {
  286 |     // Transition check only fires after order is found — 404 for ghost ID regardless
  287 |     const { token } = await apiLogin(request, TEST_SELLER)
  288 |     const res = await request.patch(STATUS(999999999), {
  289 |       data: { status: 'CONFIRMED' },
  290 |       headers: { Authorization: `Bearer ${token}` },
  291 |     })
  292 |     expect(res.status()).toBe(404)
  293 |   })
  294 | 
  295 |   test('valid backward transition (DELIVERED → CONFIRMED) is rejected for real order', async ({ request }) => {
  296 |     // Find a DELIVERED order on TEST_SELLER's store
  297 |     const { token } = await apiLogin(request, TEST_SELLER)
  298 |     const listRes = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}`, {
  299 |       headers: { Authorization: `Bearer ${token}` },
  300 |     })
  301 |     const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
  302 |     const delivered = orders.find((o) => o.status === 'DELIVERED')
  303 |     if (!delivered) { test.skip(); return }
  304 | 
  305 |     const res = await request.patch(STATUS(delivered.id), {
  306 |       data: { status: 'CONFIRMED' },
  307 |       headers: { Authorization: `Bearer ${token}` },
  308 |     })
  309 |     expect(res.status()).toBe(400)
  310 |   })
  311 | 
  312 |   test('adding tracking to a SHIPPED order (same status) returns 200', async ({ request }) => {
  313 |     // Seller should be able to add/update tracking without re-transitioning the status
  314 |     const { token } = await apiLogin(request, TEST_SELLER)
  315 |     const listRes = await request.get(`${SELLER_ORDERS}?storeSlug=${TEST_SELLER.storeSlug}&status=SHIPPED`, {
  316 |       headers: { Authorization: `Bearer ${token}` },
  317 |     })
  318 |     const orders: Array<{ id: number; status: string }> = (await listRes.json()).data?.orders ?? []
  319 |     if (!orders.length) { test.skip(); return }
  320 | 
  321 |     const res = await request.patch(STATUS(orders[0].id), {
  322 |       data: { status: 'SHIPPED', shipper: 'DHL', trackingNumber: 'TEST123456' },
  323 |       headers: { Authorization: `Bearer ${token}` },
  324 |     })
  325 |     expect(res.status()).toBe(200)
  326 |   })
  327 | })
  328 | 
  329 | // ─── Refuse delivery — POD-only guard ────────────────────────────────────────
  330 | 
  331 | test.describe('POST /api/commerce/orders/:id/refuse-delivery', () => {
  332 |   test('rejects non-POD order (400)', async ({ request }) => {
  333 |     // Find any non-POD order belonging to TEST_USER
  334 |     const { token } = await apiLogin(request, TEST_USER)
  335 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
  336 |     const orders: Array<{ id: number; paymentMethod: string }> = (await listRes.json()).data?.orders ?? []
  337 |     const nonPOD = orders.find((o) => o.paymentMethod !== 'pay_on_delivery')
  338 |     if (!nonPOD) { test.skip(); return }
  339 | 
  340 |     const res = await request.post(REFUSE(nonPOD.id), {
  341 |       data: {},
  342 |       headers: { Authorization: `Bearer ${token}` },
  343 |     })
  344 |     expect(res.status()).toBe(400)
  345 |     const body = await res.json()
  346 |     expect(body.statusMessage ?? body.message ?? '').toMatch(/POD|Pay on Delivery|pay_on_delivery/i)
  347 |   })
  348 | 
  349 |   test('refuses delivery only when order is in CONFIRMED or SHIPPED state', async ({ request }) => {
  350 |     const { token } = await apiLogin(request, TEST_USER)
  351 |     const listRes = await request.get(ORDERS, { headers: { Authorization: `Bearer ${token}` } })
  352 |     const orders: Array<{ id: number; paymentMethod: string; status: string }> = (await listRes.json()).data?.orders ?? []
  353 |     const podPending = orders.find(
  354 |       (o) => o.paymentMethod === 'pay_on_delivery' && o.status === 'PENDING',
  355 |     )
  356 |     if (!podPending) { test.skip(); return }
  357 | 
  358 |     const res = await request.post(REFUSE(podPending.id), {
  359 |       data: {},
  360 |       headers: { Authorization: `Bearer ${token}` },
```