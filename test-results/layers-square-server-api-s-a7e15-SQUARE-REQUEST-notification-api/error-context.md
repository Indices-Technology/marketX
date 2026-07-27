# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\square\server\api\squares\__tests__\requests.spec.ts >> square request → SQUARE_REQUEST notification >> member seller receives a correctly-typed SQUARE_REQUEST notification
- Location: layers\square\server\api\squares\__tests__\requests.spec.ts:272:3

# Error details

```
Error: SQUARE_REQUEST notification not found

expect(received).toBeTruthy()

Received: undefined

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

# Test source

```ts
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
  227 |     const res = await request.patch(`${REQS}/${requestId}/offers/${offerId}`, {
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
> 295 |     }).toPass({ timeout: 30000, intervals: [1000, 2000, 3000] })
      |        ^ Error: SQUARE_REQUEST notification not found
  296 | 
  297 |     if (requestId) await request.delete(`${REQS}/${requestId}`, { headers: buyer })
  298 |   })
  299 | })
  300 | 
```