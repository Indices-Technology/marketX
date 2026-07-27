# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\ai\server\api\ai\__tests__\ai.spec.ts >> ai — enhance-description >> POST /api/ai/enhance-description rejects description too short
- Location: layers\ai\server\api\ai\__tests__\ai.spec.ts:82:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 401
Received array: [400, 503]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const AI = '/api/ai'
  4   | 
  5   | // ─── Layers covered so far ────────────────────────────────────────────────────
  6   | // 1. Auth    (core)   — login, register, otp
  7   | // 2. Commerce         — products, cart, orders
  8   | // 3. Social           — posts, comments, likes, save
  9   | // 4. Seller           — register, follow, slug utils
  10  | // 5. Profile          — own profile, follow, addresses, credentials
  11  | // 6. Feed             — home, discover, trending, stories
  12  | // 7. Map              — sellers, preview, geographic squares
  13  | // 8. Square           — list, profile, follow, join, announcements
  14  | // 9. AI               — this file ✓
  15  | 
  16  | // Both AI endpoints are public (no auth required).
  17  | // In test environment, OpenAI API key is not set → responses are 503.
  18  | // Tests validate: request validation (400), missing config response (400/503),
  19  | // and that the endpoints exist and are reachable.
  20  | 
  21  | // ─── POST /api/ai/generate-listing ───────────────────────────────────────────
  22  | 
  23  | test.describe('ai — generate-listing', () => {
  24  |   test('POST /api/ai/generate-listing rejects missing imageBase64', async ({
  25  |     request,
  26  |   }) => {
  27  |     const res = await request.post(`${AI}/generate-listing`, {
  28  |       data: { mimeType: 'image/jpeg' },
  29  |     })
  30  |     // 400 (missing field) or 503 (no API key — validated before field check)
  31  |     expect([400, 503]).toContain(res.status())
  32  |   })
  33  | 
  34  |   test('POST /api/ai/generate-listing rejects missing mimeType', async ({
  35  |     request,
  36  |   }) => {
  37  |     const res = await request.post(`${AI}/generate-listing`, {
  38  |       data: { imageBase64: 'abc123' },
  39  |     })
  40  |     expect([400, 503]).toContain(res.status())
  41  |   })
  42  | 
  43  |   test('POST /api/ai/generate-listing returns 503 when API key not configured', async ({
  44  |     request,
  45  |   }) => {
  46  |     const res = await request.post(`${AI}/generate-listing`, {
  47  |       data: {
  48  |         imageBase64: '/9j/4AAQSkZJRgABAQEAAAAAAAD',
  49  |         mimeType: 'image/jpeg',
  50  |         optionalHint: 'Fashion product',
  51  |       },
  52  |     })
  53  |     // In test env: no API key → 503
  54  |     // In live env: would return 200 with AI data
  55  |     // Either is valid — just must not be a 401 (no auth required)
  56  |     expect(res.status()).not.toBe(401)
  57  |     expect(res.status()).not.toBe(404)
  58  |   })
  59  | })
  60  | 
  61  | // ─── POST /api/ai/enhance-description ────────────────────────────────────────
  62  | 
  63  | test.describe('ai — enhance-description', () => {
  64  |   test('POST /api/ai/enhance-description rejects missing description', async ({
  65  |     request,
  66  |   }) => {
  67  |     const res = await request.post(`${AI}/enhance-description`, {
  68  |       data: {},
  69  |     })
  70  |     expect([400, 503]).toContain(res.status())
  71  |   })
  72  | 
  73  |   test('POST /api/ai/enhance-description rejects empty description', async ({
  74  |     request,
  75  |   }) => {
  76  |     const res = await request.post(`${AI}/enhance-description`, {
  77  |       data: { description: '   ' },
  78  |     })
  79  |     expect([400, 503]).toContain(res.status())
  80  |   })
  81  | 
  82  |   test('POST /api/ai/enhance-description rejects description too short', async ({
  83  |     request,
  84  |   }) => {
  85  |     const res = await request.post(`${AI}/enhance-description`, {
  86  |       data: { description: 'ok' },
  87  |     })
> 88  |     expect([400, 503]).toContain(res.status())
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  89  |   })
  90  | 
  91  |   test('POST /api/ai/enhance-description returns 503 when API key not configured', async ({
  92  |     request,
  93  |   }) => {
  94  |     const res = await request.post(`${AI}/enhance-description`, {
  95  |       data: {
  96  |         description:
  97  |           'Beautiful handmade Ankara fabric dress with vibrant colors and modern cut.',
  98  |       },
  99  |     })
  100 |     // No auth required — must not be 401/404
  101 |     expect(res.status()).not.toBe(401)
  102 |     expect(res.status()).not.toBe(404)
  103 |   })
  104 | })
  105 | 
```