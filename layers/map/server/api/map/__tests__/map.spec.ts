import { test, expect } from '@playwright/test'
import { TEST_SELLER } from '../../../../../../tests/helpers/auth'

const MAP = '/api/map'

// ─── Layers covered so far ────────────────────────────────────────────────────
// 1. Auth    (core)   — login, register, otp
// 2. Commerce         — products, cart, orders
// 3. Social           — posts, comments, likes, save
// 4. Seller           — register, follow, slug utils
// 5. Profile          — own profile, follow, addresses, credentials
// 6. Feed             — home, discover, trending, stories
// 7. Map              — this file ✓

// All map endpoints are public — no auth required.

// ─── /api/map/sellers ─────────────────────────────────────────────────────────

test.describe('map — sellers', () => {
  test('GET /api/map/sellers returns 400 without lat/lng', async ({
    request,
  }) => {
    const res = await request.get(`${MAP}/sellers`)
    expect(res.status()).toBe(400)
  })

  test('GET /api/map/sellers returns 400 with only lat', async ({
    request,
  }) => {
    const res = await request.get(`${MAP}/sellers?lat=6.5244`)
    expect(res.status()).toBe(400)
  })

  test('GET /api/map/sellers returns sellers for Lagos coords', async ({
    request,
  }) => {
    const res = await request.get(`${MAP}/sellers?lat=6.5244&lng=3.3792`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/map/sellers respects radius param', async ({ request }) => {
    const res = await request.get(
      `${MAP}/sellers?lat=6.5244&lng=3.3792&radius=10`,
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('GET /api/map/sellers accepts search param', async ({ request }) => {
    const res = await request.get(
      `${MAP}/sellers?lat=6.5244&lng=3.3792&search=fabric`,
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('GET /api/map/sellers accepts filter param', async ({ request }) => {
    const res = await request.get(
      `${MAP}/sellers?lat=6.5244&lng=3.3792&filter=verified`,
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('GET /api/map/sellers ignores invalid filter (returns all)', async ({
    request,
  }) => {
    const res = await request.get(
      `${MAP}/sellers?lat=6.5244&lng=3.3792&filter=invalid-value`,
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─── /api/map/sellers/:slug/preview ───────────────────────────────────────────

test.describe('map — seller preview', () => {
  test('GET /api/map/sellers/:slug/preview handles missing lat/lng gracefully', async ({
    request,
  }) => {
    // lat/lng are optional on preview (distanceKm defaults to 0). A seller with
    // GPS → 200; a seller with no GPS on record → 404. Never 400/500.
    const res = await request.get(
      `${MAP}/sellers/${TEST_SELLER.storeSlug}/preview`,
    )
    expect([200, 404]).toContain(res.status())
  })

  test('GET /api/map/sellers/:slug/preview returns data for known seller', async ({
    request,
  }) => {
    const res = await request.get(
      `${MAP}/sellers/${TEST_SELLER.storeSlug}/preview?lat=6.5244&lng=3.3792`,
    )
    // 200 if seller exists; 404 if no gps on record — both valid
    expect([200, 404]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toBeTruthy()
    }
  })

  test('GET /api/map/sellers/:slug/preview returns 404 for unknown slug', async ({
    request,
  }) => {
    const res = await request.get(
      `${MAP}/sellers/this-slug-does-not-exist-99999/preview?lat=6.5244&lng=3.3792`,
    )
    expect(res.status()).toBe(404)
  })
})

// ─── /api/map/squares ─────────────────────────────────────────────────────────

test.describe('map — squares', () => {
  test('GET /api/map/squares returns geographic squares', async ({
    request,
  }) => {
    const res = await request.get(`${MAP}/squares`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    // All items must have coordinates (filter in handler ensures this)
    body.data.forEach((s: any) => {
      expect(s.latitude).not.toBeNull()
      expect(s.longitude).not.toBeNull()
    })
  })
})
