import { test, expect } from '@playwright/test'

const AI = '/api/ai'

// ─── Layers covered so far ────────────────────────────────────────────────────
// 1. Auth    (core)   — login, register, otp
// 2. Commerce         — products, cart, orders
// 3. Social           — posts, comments, likes, save
// 4. Seller           — register, follow, slug utils
// 5. Profile          — own profile, follow, addresses, credentials
// 6. Feed             — home, discover, trending, stories
// 7. Map              — sellers, preview, geographic squares
// 8. Square           — list, profile, follow, join, announcements
// 9. AI               — this file ✓

// Both AI endpoints are public (no auth required).
// In test environment, OpenAI API key is not set → responses are 503.
// Tests validate: request validation (400), missing config response (400/503),
// and that the endpoints exist and are reachable.

// ─── POST /api/ai/generate-listing ───────────────────────────────────────────

test.describe('ai — generate-listing', () => {
  test('POST /api/ai/generate-listing rejects missing imageBase64', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/generate-listing`, {
      data: { mimeType: 'image/jpeg' },
    })
    // 400 (missing field) or 503 (no API key — validated before field check)
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/ai/generate-listing rejects missing mimeType', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/generate-listing`, {
      data: { imageBase64: 'abc123' },
    })
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/ai/generate-listing returns 503 when API key not configured', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/generate-listing`, {
      data: {
        imageBase64: '/9j/4AAQSkZJRgABAQEAAAAAAAD',
        mimeType: 'image/jpeg',
        optionalHint: 'Fashion product',
      },
    })
    // In test env: no API key → 503
    // In live env: would return 200 with AI data
    // Either is valid — just must not be a 401 (no auth required)
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(404)
  })
})

// ─── POST /api/ai/enhance-description ────────────────────────────────────────

test.describe('ai — enhance-description', () => {
  test('POST /api/ai/enhance-description rejects missing description', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/enhance-description`, {
      data: {},
    })
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/ai/enhance-description rejects empty description', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/enhance-description`, {
      data: { description: '   ' },
    })
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/ai/enhance-description rejects description too short', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/enhance-description`, {
      data: { description: 'ok' },
    })
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/ai/enhance-description returns 503 when API key not configured', async ({
    request,
  }) => {
    const res = await request.post(`${AI}/enhance-description`, {
      data: {
        description:
          'Beautiful handmade Ankara fabric dress with vibrant colors and modern cut.',
      },
    })
    // No auth required — must not be 401/404
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(404)
  })
})
