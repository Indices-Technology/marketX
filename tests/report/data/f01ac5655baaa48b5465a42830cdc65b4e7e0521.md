# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\commerce\affiliate\__tests__\affiliate-extended.spec.ts >> affiliate — code validation at checkout >> invalid affiliate code is ignored — order succeeds with zero cut
- Location: layers\commerce\server\api\commerce\affiliate\__tests__\affiliate-extended.spec.ts:248:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 200000
```

# Test source

```ts
  169 | 
  170 |   test('affiliateCut is 0 when no affiliate code provided', async ({ request }) => {
  171 |     const { token } = await apiLogin(request, TEST_SELLER)
  172 |     await clearCart(request, token)
  173 |     const variantId = await getFirstVariantId(request).catch(() => null)
  174 |     if (!variantId) { test.skip(); return }
  175 | 
  176 |     const res = await request.post(ORDERS, {
  177 |       data: {
  178 |         items: [{ variantId, quantity: 1 }],
  179 |         name: 'No-Affiliate Buyer',
  180 |         address: '1 Marina Street',
  181 |         zipcode: '100001',
  182 |         country: 'NG',
  183 |         shippingCost: 0,
  184 |       },
  185 |       headers: { Authorization: `Bearer ${token}` },
  186 |     })
  187 |     if (!res.ok()) { test.skip(); return }
  188 |     const order = (await res.json()).data
  189 |     expect(order.affiliateCut ?? 0).toBe(0)
  190 |   })
  191 | 
  192 |   test('self-referral is blocked — affiliateCut is 0', async ({ request }) => {
  193 |     // TEST_USER places an order using their OWN affiliate code
  194 |     const { token } = await apiLogin(request, TEST_USER)
  195 |     await clearCart(request, token)
  196 | 
  197 |     const enrollRes = await request.post(ENROLL, { headers: { Authorization: `Bearer ${token}` } })
  198 |     const affiliateCode: string = (await enrollRes.json()).data?.affiliateCode
  199 |     if (!affiliateCode) { test.skip(); return }
  200 | 
  201 |     const variantId = await getFirstVariantId(request).catch(() => null)
  202 |     if (!variantId) { test.skip(); return }
  203 | 
  204 |     const res = await request.post(ORDERS, {
  205 |       data: {
  206 |         items: [{ variantId, quantity: 1 }],
  207 |         name: 'Self Referral',
  208 |         address: '1 Marina Street',
  209 |         zipcode: '100001',
  210 |         country: 'NG',
  211 |         shippingCost: 0,
  212 |         affiliateCode,
  213 |       },
  214 |       headers: { Authorization: `Bearer ${token}` },
  215 |     })
  216 |     if (!res.ok()) { test.skip(); return }
  217 |     const order = (await res.json()).data
  218 |     // Self-referral is silently dropped — cut must be 0
  219 |     expect(order.affiliateCut ?? 0).toBe(0)
  220 |   })
  221 | })
  222 | 
  223 | // ─── Enroll idempotency & code validation (June audit) ────────────────────────
  224 | 
  225 | test.describe('affiliate — enroll idempotency', () => {
  226 |   test('repeat enroll returns the same affiliate code', async ({ request }) => {
  227 |     const { token } = await apiLogin(request, TEST_USER)
  228 | 
  229 |     const first = await request.post(ENROLL, {
  230 |       headers: { Authorization: `Bearer ${token}` },
  231 |     })
  232 |     expect(first.status()).toBeLessThan(300)
  233 |     const firstCode: string = (await first.json()).data?.affiliateCode
  234 |     expect(firstCode).toBeTruthy()
  235 | 
  236 |     const second = await request.post(ENROLL, {
  237 |       headers: { Authorization: `Bearer ${token}` },
  238 |     })
  239 |     expect(second.status()).toBeLessThan(300)
  240 |     const secondCode: string = (await second.json()).data?.affiliateCode
  241 | 
  242 |     // Idempotent — enrolling twice must not rotate the code
  243 |     expect(secondCode).toBe(firstCode)
  244 |   })
  245 | })
  246 | 
  247 | test.describe('affiliate — code validation at checkout', () => {
  248 |   test('invalid affiliate code is ignored — order succeeds with zero cut', async ({ request }) => {
  249 |     const { token } = await apiLogin(request, TEST_SELLER)
  250 |     await clearCart(request, token)
  251 |     const variantId = await getFirstVariantId(request).catch(() => null)
  252 |     if (!variantId) { test.skip(); return }
  253 | 
  254 |     const res = await request.post(ORDERS, {
  255 |       data: {
  256 |         items: [{ variantId, quantity: 1 }],
  257 |         name: 'Invalid Code Buyer',
  258 |         address: '1 Marina Street',
  259 |         zipcode: '100001',
  260 |         country: 'NG',
  261 |         shippingCost: 0,
  262 |         affiliateCode: 'definitely_not_a_real_code_xyz',
  263 |       },
  264 |       headers: { Authorization: `Bearer ${token}` },
  265 |     })
  266 |     if (!res.ok()) { test.skip(); return } // stock may be depleted in CI
  267 |     const order = (await res.json()).data
  268 |     // Unknown code must not crash the order or credit anyone
> 269 |     expect(order.affiliateCut ?? 0).toBe(0)
      |                                     ^ Error: expect(received).toBe(expected) // Object.is equality
  270 |   })
  271 | })
  272 | 
```