import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER, uniqueEmail, uniqueUsername } from '../../../../../../tests/helpers/auth'

const PROFILE = '/api/profile'

// ─── Layers covered so far ────────────────────────────────────────────────────
// 1. Auth    (core)   — login, register, otp
// 2. Commerce         — products, cart, orders
// 3. Social           — posts, comments, likes, save
// 4. Seller           — register, follow, slug utils
// 5. Profile          — this file ✓

// ─── Auth guards ──────────────────────────────────────────────────────────────

test.describe('profile — auth guards', () => {
  test('GET /api/profile requires auth', async ({ request }) => {
    const res = await request.get(PROFILE)
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/profile requires auth', async ({ request }) => {
    const res = await request.patch(PROFILE, { data: { bio: 'x' } })
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/profile requires auth', async ({ request }) => {
    const res = await request.delete(PROFILE, {
      data: { password: 'x', confirmation: 'DELETE MY ACCOUNT' },
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/profile/email requires auth', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/email`, {
      data: { newEmail: uniqueEmail(), password: 'x' },
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/profile/password requires auth', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/password`, {
      data: { currentPassword: 'x', newPassword: 'NewPass123!' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/followers requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/followers`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/following requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/following`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/profile/:username/follow requires auth', async ({ request }) => {
    const res = await request.post(`${PROFILE}/${TEST_SELLER.username}/follow`)
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/profile/:username/unfollow requires auth', async ({ request }) => {
    const res = await request.delete(`${PROFILE}/${TEST_SELLER.username}/unfollow`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/addresses requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/addresses`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/profile/addresses requires auth', async ({ request }) => {
    const res = await request.post(`${PROFILE}/addresses`, {
      data: { name: 'Josh', address: '1 Main St', country: 'NG' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/profile/settings requires auth', async ({ request }) => {
    const res = await request.get(`${PROFILE}/settings`)
    expect(res.status()).toBe(401)
  })
})

// ─── Public endpoints ─────────────────────────────────────────────────────────

test.describe('profile — public endpoints', () => {
  test('GET /api/profile/:username returns public profile', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.username).toBe(TEST_USER.username)
    // Must NOT leak sensitive fields
    expect(body.data.email).toBeUndefined()
    expect(body.data.password_hash).toBeUndefined()
  })

  test('GET /api/profile/:username returns 404 for unknown user', async ({ request }) => {
    const res = await request.get(`${PROFILE}/definitely-not-a-real-user-99999`)
    expect(res.status()).toBe(404)
  })

  test('GET /api/profile/:username/followers is public', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/followers`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
  })

  test('GET /api/profile/:username/following is public', async ({ request }) => {
    const res = await request.get(`${PROFILE}/${TEST_USER.username}/following`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─── Own profile ──────────────────────────────────────────────────────────────

test.describe('profile — own profile', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('GET /api/profile returns own profile', async ({ request }) => {
    const res = await request.get(PROFILE, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
  })

  test('PATCH /api/profile updates bio', async ({ request }) => {
    const res = await request.patch(PROFILE, {
      headers: { Authorization: `Bearer ${token}` },
      data: { bio: 'Updated by Phase 3 test' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('PATCH /api/profile rejects username shorter than 3 chars', async ({ request }) => {
    const res = await request.patch(PROFILE, {
      headers: { Authorization: `Bearer ${token}` },
      data: { username: 'ab' },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH /api/profile rejects username with invalid chars', async ({ request }) => {
    const res = await request.patch(PROFILE, {
      headers: { Authorization: `Bearer ${token}` },
      data: { username: 'has spaces!' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/profile/settings returns settings object', async ({ request }) => {
    const res = await request.get(`${PROFILE}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
  })

  test('GET /api/profile/followers returns list', async ({ request }) => {
    const res = await request.get(`${PROFILE}/followers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('GET /api/profile/following returns list', async ({ request }) => {
    const res = await request.get(`${PROFILE}/following`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─── Follow / Unfollow users ──────────────────────────────────────────────────

test.describe('profile — follow / unfollow', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('follow then unfollow another user', async ({ request }) => {
    const follow = await request.post(`${PROFILE}/${TEST_SELLER.username}/follow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 200 or 409 (already following) are both fine
    expect(follow.status()).toBeLessThan(500)

    const unfollow = await request.delete(`${PROFILE}/${TEST_SELLER.username}/unfollow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(unfollow.status()).toBeLessThan(500)
  })

  test('follow non-existent user returns 4xx', async ({ request }) => {
    const res = await request.post(`${PROFILE}/this-user-does-not-exist-99999/follow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── Addresses ────────────────────────────────────────────────────────────────

test.describe('profile — addresses', () => {
  let token: string
  let addressId: number

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('POST /api/profile/addresses creates an address', async ({ request }) => {
    const res = await request.post(`${PROFILE}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Recipient',
        address: '12 Test Street',
        state: 'Lagos',
        country: 'NG',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data?.id).toBeTruthy()
    addressId = body.data.id
  })

  test('GET /api/profile/addresses returns list with new address', async ({ request }) => {
    const res = await request.get(`${PROFILE}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  test('POST /api/profile/addresses rejects missing required fields', async ({ request }) => {
    const res = await request.post(`${PROFILE}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { state: 'Lagos' }, // missing name, address, country
    })
    expect(res.status()).toBe(400)
  })

  test.afterAll(async ({ request }) => {
    if (!addressId) return
    await request.delete(`${PROFILE}/addresses/${addressId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  })
})

// ─── Password / Email validation ─────────────────────────────────────────────

test.describe('profile — credential update validation', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    ;({ token } = await apiLogin(request))
  })

  test('PATCH /api/profile/password rejects missing currentPassword', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { newPassword: 'NewPass123!' },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH /api/profile/password rejects weak new password', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currentPassword: TEST_USER.password, newPassword: 'weak' },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH /api/profile/email rejects invalid email format', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/email`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { newEmail: 'not-an-email', password: TEST_USER.password },
    })
    expect(res.status()).toBe(400)
  })

  test('PATCH /api/profile/email rejects missing password', async ({ request }) => {
    const res = await request.patch(`${PROFILE}/email`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { newEmail: uniqueEmail() },
    })
    expect(res.status()).toBe(400)
  })
})
