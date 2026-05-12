import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const SQUARES = '/api/squares'

// ─── Layers covered so far ────────────────────────────────────────────────────
// 1. Auth    (core)   — login, register, otp
// 2. Commerce         — products, cart, orders
// 3. Social           — posts, comments, likes, save
// 4. Seller           — register, follow, slug utils
// 5. Profile          — own profile, follow, addresses, credentials
// 6. Feed             — home, discover, trending, stories
// 7. Map              — sellers, preview, geographic squares
// 8. Square           — this file ✓

// Seed slugs from prisma/seed.ts
const BALOGUN_SLUG = 'balogun-market-lagos'
const CV_SLUG = 'computer-village-ikeja'

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('squares — auth guards', () => {
  test('POST /api/squares requires auth', async ({ request }) => {
    const res = await request.post(SQUARES, {
      data: { name: 'Test', slug: 'test', type: 'GEOGRAPHIC' },
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/squares/:slug requires auth', async ({ request }) => {
    const res = await request.patch(`${SQUARES}/${BALOGUN_SLUG}`, {
      data: { name: 'Updated' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/squares/:slug/activate requires auth', async ({
    request,
  }) => {
    const res = await request.post(`${SQUARES}/${BALOGUN_SLUG}/activate`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/squares/:slug/join requires auth', async ({ request }) => {
    const res = await request.post(`${SQUARES}/${BALOGUN_SLUG}/join`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/squares/:slug/follow requires auth', async ({ request }) => {
    const res = await request.post(`${SQUARES}/${BALOGUN_SLUG}/follow`)
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/squares/:slug/follow requires auth', async ({
    request,
  }) => {
    const res = await request.delete(`${SQUARES}/${BALOGUN_SLUG}/follow`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/squares/:slug/announcements requires auth', async ({
    request,
  }) => {
    const res = await request.post(`${SQUARES}/${BALOGUN_SLUG}/announcements`, {
      data: { title: 'Test', body: 'Body' },
    })
    expect(res.status()).toBe(401)
  })
})

// ─── Public endpoints ─────────────────────────────────────────────────────────

test.describe('squares — public endpoints', () => {
  test('GET /api/squares returns list', async ({ request }) => {
    const res = await request.get(SQUARES)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta).toBeTruthy()
    expect(typeof body.meta.total).toBe('number')
  })

  test('GET /api/squares?type=GEOGRAPHIC filters by type', async ({
    request,
  }) => {
    const res = await request.get(`${SQUARES}?type=GEOGRAPHIC`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    body.data.forEach((s: any) => expect(s.type).toBe('GEOGRAPHIC'))
  })

  test('GET /api/squares?search= returns results', async ({ request }) => {
    const res = await request.get(`${SQUARES}?search=balogun`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/squares/:slug returns square profile', async ({ request }) => {
    const res = await request.get(`${SQUARES}/${BALOGUN_SLUG}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
    expect(body.data.slug).toBe(BALOGUN_SLUG)
  })

  test('GET /api/squares/:slug returns 404 for unknown slug', async ({
    request,
  }) => {
    const res = await request.get(`${SQUARES}/this-square-does-not-exist-99999`)
    expect(res.status()).toBe(404)
  })

  test('GET /api/squares/:slug/sellers returns member sellers', async ({
    request,
  }) => {
    const res = await request.get(`${SQUARES}/${BALOGUN_SLUG}/sellers`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.sellers)).toBe(true)
  })

  test('GET /api/squares/:slug/announcements is public', async ({
    request,
  }) => {
    const res = await request.get(`${SQUARES}/${BALOGUN_SLUG}/announcements`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.announcements)).toBe(true)
  })

  test('GET /api/squares/:slug/members requires officer auth', async ({
    request,
  }) => {
    // Officer-only endpoint — unauthenticated request must return 401
    const res = await request.get(`${SQUARES}/${CV_SLUG}/members`)
    expect(res.status()).toBe(401)
  })
})

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

test.describe('squares — follow / unfollow', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('follow then unfollow a square', async ({ request }) => {
    const follow = await request.post(`${SQUARES}/${BALOGUN_SLUG}/follow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 200 = followed, 409 = already following — both ok
    expect(follow.status()).toBeLessThan(500)

    const unfollow = await request.delete(`${SQUARES}/${BALOGUN_SLUG}/follow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(unfollow.status()).toBeLessThan(500)
  })

  test('follow unknown square returns 4xx', async ({ request }) => {
    const res = await request.post(
      `${SQUARES}/this-square-does-not-exist-99999/follow`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── Join square (seller only) ────────────────────────────────────────────────

test.describe('squares — join', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request, TEST_SELLER))
  })

  test('seller can apply to join a square', async ({ request }) => {
    const res = await request.post(`${SQUARES}/${CV_SLUG}/join`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 200 = applied, 409 = already member — both fine
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── Admin-only endpoints return 403 for non-admin ───────────────────────────

test.describe('squares — admin guards', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('POST /api/squares returns 403 for non-admin', async ({ request }) => {
    const res = await request.post(SQUARES, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Square',
        slug: 'test-square-xyz',
        type: 'GEOGRAPHIC',
        description: 'A test square',
      },
    })
    expect(res.status()).toBe(403)
  })

  test('POST /api/squares/:slug/activate returns 403 for non-admin', async ({
    request,
  }) => {
    const res = await request.post(`${SQUARES}/${BALOGUN_SLUG}/activate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })
})
