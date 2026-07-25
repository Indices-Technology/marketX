# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\square\server\api\squares\__tests__\requests.spec.ts >> PATCH offer — accept/decline IDOR >> buyer accepts → request FULFILLED, variant returned
- Location: layers\square\server\api\squares\__tests__\requests.spec.ts:226:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: apiRequestContext.patch: Request context disposed.
Call log:
  - → PATCH http://localhost:3000/api/squares/balogun-market-lagos/requests/70e88e69-bc05-41a7-b216-21e247337ea3/offers/1a610861-38b0-42be-a505-e5901c77297f
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NGNiZTU1ZC1mNmRkLTRkMTYtOWJiNi02ZmZlMWRkYzZkM2YiLCJlbWFpbCI6ImNoaWRpQHBlcHByLnRlc3QiLCJyb2xlIjoiYnV5ZXIiLCJzZXNzaW9uSWQiOiJlMTFiZjE2Yy0wZTY2LTQ1ZGYtOGRiMS1lMTBlNGJiMjk5YjAiLCJpYXQiOjE3ODQ5MDAyMjEsImV4cCI6MTc4NDkwMzgyMX0.BJnTpeHv3c5AQCWcdpx6kYifjidC7miXJ6zG8v_FNR8
    - content-type: application/json
    - content-length: 19

```

# Test source

```ts
  127 |         status: 'PUBLISHED',
  128 |         variants: [{ size: 'One Size', stock: 5 }],
  129 |       },
  130 |     })
  131 |     wuseProductId = (await wuseProd.json()).data.id
  132 |   })
  133 | 
  134 |   test('non-member seller offering their OWN product → 403 (membership gate)', async ({ request }) => {
  135 |     const headers = await authHeader(request, NON_MEMBER_SELLER)
  136 |     const res = await request.post(`${REQS}/${requestId}/offers`, {
  137 |       headers,
  138 |       data: { productId: wuseProductId },
  139 |     })
  140 |     expect(res.status()).toBe(403)
  141 |   })
  142 | 
  143 |   test('member seller offering own product → 200', async ({ request }) => {
  144 |     const headers = await authHeader(request, TEST_SELLER)
  145 |     const res = await request.post(`${REQS}/${requestId}/offers`, {
  146 |       headers,
  147 |       data: { productId: sellerProductId, variantId: sellerVariantId, message: 'Got this in stock' },
  148 |     })
  149 |     expect(res.status()).toBe(200)
  150 |     const body = await res.json()
  151 |     expect(body.data.status).toBe('PENDING')
  152 |     expect(body.data.productId).toBe(sellerProductId)
  153 |   })
  154 | 
  155 |   test('duplicate offer (same product) → 409', async ({ request }) => {
  156 |     const headers = await authHeader(request, TEST_SELLER)
  157 |     const res = await request.post(`${REQS}/${requestId}/offers`, {
  158 |       headers,
  159 |       data: { productId: sellerProductId },
  160 |     })
  161 |     expect(res.status()).toBe(409)
  162 |   })
  163 | 
  164 |   test('member seller offering another seller\'s product → 403', async ({ request }) => {
  165 |     const headers = await authHeader(request, TEST_SELLER)
  166 |     const res = await request.post(`${REQS}/${requestId}/offers`, {
  167 |       headers,
  168 |       data: { productId: foreignProductId },
  169 |     })
  170 |     expect(res.status()).toBe(403)
  171 |   })
  172 | 
  173 |   test.afterAll(async ({ request }) => {
  174 |     await request.delete(`${REQS}/${requestId}`, { headers: buyerHeaders })
  175 |     const sellerHeaders = await authHeader(request, TEST_SELLER)
  176 |     if (sellerProductId)
  177 |       await request.delete(`${PRODUCTS}/${sellerProductId}`, { headers: sellerHeaders })
  178 |     if (wuseProductId) {
  179 |       const wuseHeaders = await authHeader(request, NON_MEMBER_SELLER)
  180 |       await request.delete(`${PRODUCTS}/${wuseProductId}`, { headers: wuseHeaders })
  181 |     }
  182 |   })
  183 | })
  184 | 
  185 | // ─── Accept / decline ─────────────────────────────────────────────────────────
  186 | 
  187 | test.describe('PATCH offer — accept/decline IDOR', () => {
  188 |   let requestId: string
  189 |   let offerId: string
  190 |   let buyerHeaders: Record<string, string>
  191 |   let productId: number
  192 | 
  193 |   test.beforeAll(async ({ request }) => {
  194 |     buyerHeaders = await authHeader(request, BUYER)
  195 |     requestId = (await postRequest(request, buyerHeaders, { title: 'Looking for george wrapper' }).then((r) => r.json())).data.id
  196 | 
  197 |     const sellerHeaders = await authHeader(request, TEST_SELLER)
  198 |     const prodRes = await request.post(PRODUCTS, {
  199 |       headers: sellerHeaders,
  200 |       data: {
  201 |         title: `Accept Product ${Date.now()}`,
  202 |         price: 12000,
  203 |         description: 'Product used by the accept/decline test.',
  204 |         status: 'PUBLISHED',
  205 |         variants: [{ size: 'One Size', stock: 5 }],
  206 |       },
  207 |     })
  208 |     const prod = (await prodRes.json()).data
  209 |     productId = prod.id
  210 |     const offerRes = await request.post(`${REQS}/${requestId}/offers`, {
  211 |       headers: sellerHeaders,
  212 |       data: { productId, variantId: prod.variants[0].id },
  213 |     })
  214 |     offerId = (await offerRes.json()).data.id
  215 |   })
  216 | 
  217 |   test('non-owner cannot act on the offer → 403', async ({ request }) => {
  218 |     const headers = await authHeader(request, NON_MEMBER_SELLER)
  219 |     const res = await request.patch(`${REQS}/${requestId}/offers/${offerId}`, {
  220 |       headers,
  221 |       data: { action: 'ACCEPT' },
  222 |     })
  223 |     expect(res.status()).toBe(403)
  224 |   })
  225 | 
  226 |   test('buyer accepts → request FULFILLED, variant returned', async ({ request }) => {
> 227 |     const res = await request.patch(`${REQS}/${requestId}/offers/${offerId}`, {
      |                               ^ Error: apiRequestContext.patch: Request context disposed.
  228 |       headers: buyerHeaders,
  229 |       data: { action: 'ACCEPT' },
  230 |     })
  231 |     expect(res.status()).toBe(200)
  232 |     const body = await res.json()
  233 |     expect(body.data.status).toBe('ACCEPTED')
  234 |     expect(body.data.productId).toBe(productId)
  235 | 
  236 |     // Request now FULFILLED — confirm via detail in the list
  237 |     const list = await request.get(`${REQS}?status=FULFILLED&limit=50`)
  238 |     const ids = (await list.json()).data.requests.map((r: { id: string }) => r.id)
  239 |     expect(ids).toContain(requestId)
  240 |   })
  241 | 
  242 |   test.afterAll(async ({ request }) => {
  243 |     const sellerHeaders = await authHeader(request, TEST_SELLER)
  244 |     if (productId) await request.delete(`${PRODUCTS}/${productId}`, { headers: sellerHeaders })
  245 |   })
  246 | })
  247 | 
  248 | // ─── Rate limit ───────────────────────────────────────────────────────────────
  249 | 
  250 | test.describe('open-request rate limit', () => {
  251 |   test('6th concurrent open request → 429', async ({ request }) => {
  252 |     const headers = await authHeader(request, BUYER)
  253 |     const created: string[] = []
  254 |     let sawLimit = false
  255 |     for (let i = 0; i < 7; i++) {
  256 |       const res = await request.post(REQS, {
  257 |         headers,
  258 |         data: { title: `Ratelimit probe ${i} ${Date.now()}` },
  259 |       })
  260 |       if (res.status() === 429) { sawLimit = true; break }
  261 |       if (res.ok()) created.push((await res.json()).data.id)
  262 |     }
  263 |     expect(sawLimit).toBe(true)
  264 |     // cleanup — close all created so the cap resets for the next run
  265 |     for (const id of created) await request.delete(`${REQS}/${id}`, { headers })
  266 |   })
  267 | })
  268 | 
  269 | // ─── Notification delivery — a new request notifies member sellers ────────────
  270 | 
  271 | test.describe('square request → SQUARE_REQUEST notification', () => {
  272 |   test('member seller receives a correctly-typed SQUARE_REQUEST notification', async ({ request }) => {
  273 |     const buyer = await authHeader(request, BUYER)
  274 |     await request.post(FOLLOW, { headers: buyer })
  275 | 
  276 |     const title = `Notif probe ${Date.now()}`
  277 |     const reqRes = await request.post(REQS, { headers: buyer, data: { title } })
  278 |     expect(reqRes.status()).toBe(200)
  279 |     const requestId = (reqRes.ok() ? (await reqRes.json()).data?.id : null)
  280 | 
  281 |     // TEST_SELLER (balogun-fabrics) is an ACTIVE member of this square → notified.
  282 |     // Delivery is via the BullMQ worker (Upstash Redis) or the inline fallback
  283 |     // when Redis is absent. Upstash REST round-trips add latency, so the poll
  284 |     // window is generous — this asserts delivery + correct typing, not speed.
  285 |     const sellerHeaders = await authHeader(request, TEST_SELLER)
  286 |     await expect(async () => {
  287 |       const res = await request.get('/api/shared/notifications?limit=30', { headers: sellerHeaders })
  288 |       expect(res.status()).toBe(200)
  289 |       const body = await res.json()
  290 |       const list = body?.data?.notifications ?? body?.data ?? body?.notifications ?? []
  291 |       const match = (Array.isArray(list) ? list : []).find(
  292 |         (n: any) => n.type === 'SQUARE_REQUEST' && (n.message ?? '').includes(title),
  293 |       )
  294 |       expect(match, 'SQUARE_REQUEST notification not found').toBeTruthy()
  295 |     }).toPass({ timeout: 30000, intervals: [1000, 2000, 3000] })
  296 | 
  297 |     if (requestId) await request.delete(`${REQS}/${requestId}`, { headers: buyer })
  298 |   })
  299 | })
  300 | 
```