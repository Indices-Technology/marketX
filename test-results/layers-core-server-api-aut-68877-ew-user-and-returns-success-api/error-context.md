# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\core\server\api\auth\__tests__\register.spec.ts >> POST /api/auth/register — happy path >> creates a new user and returns success
- Location: layers\core\server\api\auth\__tests__\register.spec.ts:13:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 429
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { resetRateLimits, uniqueEmail, uniqueUsername } from '../../../../../../tests/helpers/auth'
  3   | 
  4   | const ENDPOINT = '/api/auth/register'
  5   | 
  6   | test.beforeAll(async ({ request }) => {
  7   |   await resetRateLimits(request)
  8   | })
  9   | 
  10  | // ─── Happy path ────────────────────────────────────────────────────────────────
  11  | 
  12  | test.describe('POST /api/auth/register — happy path', () => {
  13  |   test('creates a new user and returns success', async ({ request }) => {
  14  |     const res = await request.post(ENDPOINT, {
  15  |       data: {
  16  |         email: uniqueEmail(),
  17  |         username: uniqueUsername(),
  18  |         password: 'ValidPass123!',
  19  |         confirmPassword: 'ValidPass123!',
  20  |       },
  21  |     })
  22  | 
> 23  |     expect(res.status()).toBe(200)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  24  |     const body = await res.json()
  25  |     expect(body.success).toBe(true)
  26  |     expect(body.message).toBeTruthy()
  27  |     expect(body.user).toBeTruthy()
  28  |   })
  29  | 
  30  |   test('response does not include password hash', async ({ request }) => {
  31  |     const res = await request.post(ENDPOINT, {
  32  |       data: {
  33  |         email: uniqueEmail(),
  34  |         username: uniqueUsername(),
  35  |         password: 'ValidPass123!',
  36  |         confirmPassword: 'ValidPass123!',
  37  |       },
  38  |     })
  39  |     const body = await res.json()
  40  |     expect(body.user?.password_hash).toBeUndefined()
  41  |     expect(body.user?.password).toBeUndefined()
  42  |   })
  43  | })
  44  | 
  45  | // ─── Input validation ──────────────────────────────────────────────────────────
  46  | 
  47  | test.describe('POST /api/auth/register — input validation', () => {
  48  |   test('rejects missing email', async ({ request }) => {
  49  |     const res = await request.post(ENDPOINT, {
  50  |       data: { username: uniqueUsername(), password: 'ValidPass123!' },
  51  |     })
  52  |     expect(res.status()).toBe(400)
  53  |   })
  54  | 
  55  |   test('rejects missing username', async ({ request }) => {
  56  |     const res = await request.post(ENDPOINT, {
  57  |       data: { email: uniqueEmail(), password: 'ValidPass123!' },
  58  |     })
  59  |     expect(res.status()).toBe(400)
  60  |   })
  61  | 
  62  |   test('rejects missing password', async ({ request }) => {
  63  |     const res = await request.post(ENDPOINT, {
  64  |       data: { email: uniqueEmail(), username: uniqueUsername() },
  65  |     })
  66  |     expect(res.status()).toBe(400)
  67  |   })
  68  | 
  69  |   test('rejects malformed email', async ({ request }) => {
  70  |     const res = await request.post(ENDPOINT, {
  71  |       data: {
  72  |         email: 'not-valid',
  73  |         username: uniqueUsername(),
  74  |         password: 'ValidPass123!',
  75  |       },
  76  |     })
  77  |     expect(res.status()).toBe(400)
  78  |   })
  79  | 
  80  |   test('rejects weak password', async ({ request }) => {
  81  |     const res = await request.post(ENDPOINT, {
  82  |       data: {
  83  |         email: uniqueEmail(),
  84  |         username: uniqueUsername(),
  85  |         password: '123',
  86  |       },
  87  |     })
  88  |     expect(res.status()).toBe(400)
  89  |   })
  90  | })
  91  | 
  92  | // ─── Conflict handling ─────────────────────────────────────────────────────────
  93  | 
  94  | test.describe('POST /api/auth/register — conflicts', () => {
  95  |   test('rejects duplicate email', async ({ request }) => {
  96  |     const email = uniqueEmail()
  97  |     const username = uniqueUsername()
  98  | 
  99  |     // First registration
  100 |     await request.post(ENDPOINT, {
  101 |       data: { email, username, password: 'ValidPass123!', confirmPassword: 'ValidPass123!' },
  102 |     })
  103 | 
  104 |     // Duplicate
  105 |     const res = await request.post(ENDPOINT, {
  106 |       data: {
  107 |         email,
  108 |         username: uniqueUsername(), // different username
  109 |         password: 'ValidPass123!',
  110 |         confirmPassword: 'ValidPass123!',
  111 |       },
  112 |     })
  113 |     expect(res.status()).toBeGreaterThanOrEqual(400)
  114 |   })
  115 | 
  116 |   test('rejects duplicate username', async ({ request }) => {
  117 |     const username = uniqueUsername()
  118 | 
  119 |     // First registration
  120 |     await request.post(ENDPOINT, {
  121 |       data: { email: uniqueEmail(), username, password: 'ValidPass123!', confirmPassword: 'ValidPass123!' },
  122 |     })
  123 | 
```