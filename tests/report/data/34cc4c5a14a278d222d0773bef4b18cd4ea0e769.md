# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\commerce\payments\__tests__\payments.spec.ts >> pod-initialize — zone eligibility >> rejects when seller does not support POD
- Location: layers\commerce\server\api\commerce\payments\__tests__\payments.spec.ts:210:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not 403
```

# Test source

```ts
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
  155 | test.describe('payments — ownership (IDOR)', () => {
  156 |   test('POST /verify returns 403 when reference belongs to a different user', async ({ request }) => {
  157 |     // Step 1: initialize a payment as TEST_USER — creates order + reference in DB
  158 |     // even if Paystack fails (order is created before Paystack call)
  159 |     const { token: buyerToken } = await apiLogin(request, TEST_USER)
  160 |     const body = await orderBody(request)
  161 |     const initRes = await request.post(INIT, {
  162 |       data: { ...body, callback_url: 'http://localhost:3000/buyer/orders' },
  163 |       headers: { Authorization: `Bearer ${buyerToken}` },
  164 |     })
  165 | 
  166 |     // Skip if Paystack not configured in test env — we can't get the reference
  167 |     if (!initRes.ok()) {
  168 |       test.skip()
  169 |       return
  170 |     }
  171 | 
  172 |     const initBody = await initRes.json()
  173 |     const reference = initBody.data?.reference
  174 |     if (!reference) { test.skip(); return }
  175 | 
  176 |     // Step 2: try to verify the reference as TEST_SELLER → must be 403
  177 |     const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
  178 |     const verifyRes = await request.post(VERIFY, {
  179 |       data: { reference },
  180 |       headers: { Authorization: `Bearer ${sellerToken}` },
  181 |     })
  182 |     expect(verifyRes.status()).toBe(403)
  183 |   })
  184 | 
  185 |   test('POST /paypal/capture returns 403 when order belongs to a different user', async ({ request }) => {
  186 |     const { token: buyerToken } = await apiLogin(request, TEST_USER)
  187 |     const body = await orderBody(request, { callback_url: 'http://localhost:3000/buyer/orders' })
  188 |     const createRes = await request.post(PAYPAL_CREATE, {
  189 |       data: body,
  190 |       headers: { Authorization: `Bearer ${buyerToken}` },
  191 |     })
  192 | 
  193 |     if (!createRes.ok()) { test.skip(); return }
  194 |     const createBody = await createRes.json()
  195 |     const orderId = createBody.data?.orderId
  196 |     if (!orderId) { test.skip(); return }
  197 | 
  198 |     const { token: sellerToken } = await apiLogin(request, TEST_SELLER)
  199 |     const captureRes = await request.post(PAYPAL_CAPTURE, {
  200 |       data: { orderId, paypalOrderId: 'fake_paypal_token' },
  201 |       headers: { Authorization: `Bearer ${sellerToken}` },
  202 |     })
  203 |     expect(captureRes.status()).toBe(403)
  204 |   })
  205 | })
  206 | 
  207 | // ─── POD — zone eligibility ───────────────────────────────────────────────────
  208 | 
  209 | test.describe('pod-initialize — zone eligibility', () => {
  210 |   test('rejects when seller does not support POD', async ({ request }) => {
  211 |     const { token } = await apiLogin(request, TEST_USER)
  212 |     const body = await orderBody(request, {
  213 |       shippingCost: 150000, // valid shipping cost in kobo
  214 |       country: 'NG',
  215 |       shippingZone: 'Kano · North',
  216 |       county: 'Kano',
  217 |     })
  218 |     const res = await request.post(POD_INIT, {
  219 |       data: body,
  220 |       headers: { Authorization: `Bearer ${token}` },
  221 |     })
  222 |     // Either 400 (zone not eligible) or non-401 (auth passes, business logic runs)
  223 |     expect(res.status()).not.toBe(401)
> 224 |     expect(res.status()).not.toBe(403)
      |                              ^ Error: expect(received).not.toBe(expected) // Object.is equality
  225 |   })
  226 | })
  227 | 
  228 | // ─── Webhook — signature verification ────────────────────────────────────────
  229 | 
  230 | test.describe('Paystack webhook — signature', () => {
  231 |   test('returns 400 when x-paystack-signature header is missing', async ({ request }) => {
  232 |     const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'test_ref' } })
  233 |     const res = await request.post(WEBHOOK, {
  234 |       data: payload,
  235 |       headers: { 'Content-Type': 'application/json' },
  236 |     })
  237 |     // Either 400 (signature missing) or 500 (PAYSTACK_SECRET_KEY not set in test env)
  238 |     expect([400, 500]).toContain(res.status())
  239 |   })
  240 | 
  241 |   test('returns 401 when x-paystack-signature is wrong', async ({ request }) => {
  242 |     const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'test_ref' } })
  243 |     const res = await request.post(WEBHOOK, {
  244 |       data: payload,
  245 |       headers: {
  246 |         'Content-Type': 'application/json',
  247 |         'x-paystack-signature': 'completely_wrong_signature',
  248 |       },
  249 |     })
  250 |     // 401 if secret is configured, 500 if not
  251 |     expect([401, 500]).toContain(res.status())
  252 |   })
  253 | 
  254 |   test('returns 200 for valid signature and unknown reference (graceful no-op)', async ({ request }) => {
  255 |     const secret = process.env.PAYSTACK_SECRET_KEY
  256 |     if (!secret) { test.skip(); return }
  257 | 
  258 |     const payload = JSON.stringify({
  259 |       event: 'charge.success',
  260 |       data: { reference: `nonexistent_ref_${Date.now()}` },
  261 |     })
  262 |     const sig = crypto.createHmac('sha512', secret).update(payload).digest('hex')
  263 | 
  264 |     const res = await request.post(WEBHOOK, {
  265 |       data: payload,
  266 |       headers: {
  267 |         'Content-Type': 'application/json',
  268 |         'x-paystack-signature': sig,
  269 |       },
  270 |     })
  271 |     expect(res.status()).toBe(200)
  272 |   })
  273 | 
  274 |   test('is idempotent — duplicate charge.success does not double-process', async ({ request }) => {
  275 |     const secret = process.env.PAYSTACK_SECRET_KEY
  276 |     if (!secret) { test.skip(); return }
  277 | 
  278 |     const payload = JSON.stringify({
  279 |       event: 'charge.success',
  280 |       data: { reference: `idempotent_test_ref_${Date.now()}` },
  281 |     })
  282 |     const sig = crypto.createHmac('sha512', secret).update(payload).digest('hex')
  283 | 
  284 |     const headers = {
  285 |       'Content-Type': 'application/json',
  286 |       'x-paystack-signature': sig,
  287 |     }
  288 | 
  289 |     const [r1, r2] = await Promise.all([
  290 |       request.post(WEBHOOK, { data: payload, headers }),
  291 |       request.post(WEBHOOK, { data: payload, headers }),
  292 |     ])
  293 |     expect(r1.status()).toBe(200)
  294 |     expect(r2.status()).toBe(200)
  295 |   })
  296 | })
  297 | 
  298 | // ─── Integration: provider availability in test env ──────────────────────────
  299 | 
  300 | test.describe('payments — provider not configured', () => {
  301 |   test('POST /initialize returns non-401 (auth passes)', async ({ request }) => {
  302 |     const { token } = await apiLogin(request, TEST_USER)
  303 |     const body = await orderBody(request)
  304 |     const res = await request.post(INIT, {
  305 |       data: body,
  306 |       headers: { Authorization: `Bearer ${token}` },
  307 |     })
  308 |     expect(res.status()).not.toBe(401)
  309 |   })
  310 | 
  311 |   test('POST /paypal/create returns non-auth error when PayPal not configured', async ({ request }) => {
  312 |     const { token } = await apiLogin(request, TEST_USER)
  313 |     const body = await orderBody(request, { callback_url: 'http://localhost:3000/checkout' })
  314 |     const res = await request.post(PAYPAL_CREATE, {
  315 |       data: body,
  316 |       headers: { Authorization: `Bearer ${token}` },
  317 |     })
  318 |     expect(res.status()).not.toBe(401)
  319 |     expect(res.status()).not.toBe(403)
  320 |   })
  321 | })
  322 | 
```