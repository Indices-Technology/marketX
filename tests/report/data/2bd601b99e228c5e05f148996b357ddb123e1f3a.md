# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\profile\server\api\chat\__tests__\chat.spec.ts >> chat — conversations >> GET /api/chat/conversations supports pagination
- Location: layers\profile\server\api\chat\__tests__\chat.spec.ts:58:3

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3000/api/auth/login
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 48

```

# Test source

```ts
  1   | import type { APIRequestContext, Page } from '@playwright/test'
  2   | 
  3   | export const BASE = 'http://localhost:3000'
  4   | 
  5   | // Seed credentials — matches prisma/seed.ts
  6   | export const TEST_USER = {
  7   |   email: 'ada@peppr.test',
  8   |   password: 'test1234',
  9   |   username: 'ada_styles',
  10  | }
  11  | 
  12  | export const TEST_SELLER = {
  13  |   email: 'balogun@peppr.test',
  14  |   password: 'test1234',
  15  |   username: 'balogun_fabrics',
  16  |   storeSlug: 'balogun-fabrics',
  17  | }
  18  | 
  19  | // Unique email for registration tests — avoids seed conflicts
  20  | export const uniqueEmail = () =>
  21  |   `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`
  22  | 
  23  | export const uniqueUsername = () =>
  24  |   `user_${Date.now().toString(36)}`
  25  | 
  26  | /**
  27  |  * Login via API and return the access token.
  28  |  * Reuse this in any test that needs an authenticated request.
  29  |  */
  30  | export async function apiLogin(
  31  |   request: APIRequestContext,
  32  |   credentials = TEST_USER,
  33  | ) {
> 34  |   const res = await request.post('/api/auth/login', {
      |                             ^ Error: apiRequestContext.post: read ECONNRESET
  35  |     data: { email: credentials.email, password: credentials.password },
  36  |   })
  37  |   const body = await res.json()
  38  |   return { res, token: body.accessToken as string, user: body.user }
  39  | }
  40  | 
  41  | /**
  42  |  * Login via the UI login form.
  43  |  * Returns after the redirect to / completes.
  44  |  *
  45  |  * NOTE: The redirect to / takes 15-30s on a cold server because
  46  |  * syncUserToProfile opens SSE/WS connections before the setTimeout fires.
  47  |  * Prefer pageLogin() for e2e tests — it seeds localStorage directly.
  48  |  */
  49  | export async function uiLogin(
  50  |   page: Page,
  51  |   credentials = TEST_USER,
  52  | ) {
  53  |   await page.goto('/user-login')
  54  |   await page.fill('input[type="email"]', credentials.email)
  55  |   await page.fill('input[type="password"]', credentials.password)
  56  |   await page.click('button[type=submit]')
  57  |   await page.waitForURL('/', { timeout: 30000 })
  58  | }
  59  | 
  60  | /**
  61  |  * Fast browser login: seeds localStorage with API tokens then navigates to /.
  62  |  * The auth-init plugin reads the tokens and hydrates the profile store.
  63  |  * Much faster than uiLogin — avoids the syncUserToProfile + setTimeout delay.
  64  |  */
  65  | export async function pageLogin(
  66  |   page: Page,
  67  |   request: APIRequestContext,
  68  |   credentials = TEST_USER,
  69  | ) {
  70  |   const res = await request.post('/api/auth/login', {
  71  |     data: { email: credentials.email, password: credentials.password },
  72  |   })
  73  |   const body = await res.json()
  74  |   const accessToken: string = body.accessToken
  75  |   const refreshToken: string = body.refreshToken
  76  | 
  77  |   // Navigate to the app to get access to the origin's localStorage
  78  |   await page.goto('/')
  79  |   await page.evaluate(
  80  |     ({ at, rt }) => {
  81  |       localStorage.setItem('accessToken', at)
  82  |       if (rt) localStorage.setItem('refreshToken', rt)
  83  |     },
  84  |     { at: accessToken, rt: refreshToken ?? '' },
  85  |   )
  86  | 
  87  |   // Reload and wait for auth-init to fetch /api/profile (proves hydration complete).
  88  |   // Cannot use 'networkidle' — SSE connections keep the network permanently active.
  89  |   await Promise.all([
  90  |     page.waitForResponse(
  91  |       (r) => r.url().includes('/api/profile') && r.request().method() === 'GET',
  92  |       { timeout: 15000 },
  93  |     ),
  94  |     page.reload({ waitUntil: 'load' }),
  95  |   ])
  96  | }
  97  | 
  98  | /**
  99  |  * Resets all in-memory rate limit counters on the server.
  100 |  * Only works in dev/test — safe to call at the start of any spec that creates users.
  101 |  */
  102 | export async function resetRateLimits(
  103 |   request: APIRequestContext,
  104 | ): Promise<void> {
  105 |   await request.post('/api/__test__/reset-rate-limits')
  106 | }
  107 | 
  108 | /**
  109 |  * Resolves a product slug that exists in the test DB.
  110 |  * Tries the seed slug first (fast path), then falls back to the first product in the list.
  111 |  */
  112 | export async function getFirstProductSlug(
  113 |   request: APIRequestContext,
  114 |   preferred = 'adire-tie-dye-maxi-dress',
  115 | ): Promise<string> {
  116 |   const probe = await request.get(`/api/commerce/products/by-slug/${preferred}`)
  117 |   if (probe.ok()) return preferred
  118 | 
  119 |   const listRes = await request.get('/api/commerce/products?limit=1')
  120 |   const body = await listRes.json()
  121 |   const slug = body.data?.products?.[0]?.slug as string | undefined
  122 |   if (!slug) throw new Error('No products in test DB — run: npx prisma db seed')
  123 |   return slug
  124 | }
  125 | 
  126 | /**
  127 |  * Returns the first IN-STOCK variant ID for a product that exists in the test DB.
  128 |  * Uses getFirstProductSlug so the slug is always valid. Falls back to the first
  129 |  * variant when everything is sold out (callers asserting stock errors still work).
  130 |  */
  131 | export async function getFirstVariantId(
  132 |   request: APIRequestContext,
  133 |   slug?: string,
  134 | ): Promise<number> {
```