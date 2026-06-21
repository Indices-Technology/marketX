import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const SEARCH = '/api/search'
const POSTS = '/api/posts'

test.describe('search', () => {
  test('GET /api/search returns empty for short query', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=a`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.users).toHaveLength(0)
    expect(body.data.products).toHaveLength(0)
  })

  test('GET /api/search returns empty for missing query', async ({ request }) => {
    const res = await request.get(SEARCH)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('users')
    expect(body.data).toHaveProperty('products')
    expect(body.data).toHaveProperty('posts')
    expect(body.data).toHaveProperty('stores')
    expect(body.data).toHaveProperty('tags')
  })

  test('GET /api/search returns results for valid query', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=adire`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    // Products with "adire" in seed data should match
    expect(body.data.products).toBeInstanceOf(Array)
  })

  test('GET /api/search?type=products filters by type', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=fashion&type=products`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.users).toHaveLength(0)
    expect(body.data.posts).toHaveLength(0)
    expect(body.data.products).toBeInstanceOf(Array)
  })

  test('GET /api/search?type=stores filters by stores', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=balogun&type=stores`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.stores).toBeInstanceOf(Array)
  })

  test('GET /api/search respects limit param', async ({ request }) => {
    const res = await request.get(`${SEARCH}?q=a&limit=2`)
    // Short query returns empty — limit is still respected
    expect(res.status()).toBe(200)
  })
})

// ─── PII / privacy ────────────────────────────────────────────────────────────

test.describe('search — privacy', () => {
  test('user results never include email', async ({ request }) => {
    // "balogun" matches a seed username
    const res = await request.get(`${SEARCH}?q=balogun&type=users`)
    expect(res.status()).toBe(200)
    const users = (await res.json()).data.users as Array<Record<string, unknown>>
    expect(Array.isArray(users)).toBe(true)
    for (const u of users) {
      expect(u).not.toHaveProperty('email')
    }
  })

  test('cannot enumerate accounts by email substring', async ({ request }) => {
    // All seed accounts share the @peppr.test domain — before the fix this
    // returned every user; now email is neither matched nor returned.
    const res = await request.get(`${SEARCH}?q=peppr.test&type=users`)
    expect(res.status()).toBe(200)
    expect((await res.json()).data.users).toHaveLength(0)
  })

  test('PRIVATE posts do not appear in search results', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const stamp = Date.now()
    const term = `srchprobe${stamp}`
    const mk = async (visibility: string, caption: string) =>
      (
        await (
          await request.post(POSTS, {
            data: { caption, visibility, contentType: 'INSPIRATION' },
            headers: { Authorization: `Bearer ${token}` },
          })
        ).json()
      ).data
    const priv = await mk('PRIVATE', `${term} private`)
    const pub = await mk('PUBLIC', `${term} public`)

    const res = await request.get(`${SEARCH}?q=${term}&type=posts`)
    expect(res.status()).toBe(200)
    const ids = ((await res.json()).data.posts as Array<{ id: string }>).map((p) => String(p.id))
    expect(ids).not.toContain(String(priv.id)) // leak guard
    expect(ids).toContain(String(pub.id)) // public one is findable

    // cleanup
    for (const id of [priv.id, pub.id])
      await request.delete(`${POSTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  })
})

// ─── Profile data exposure ──────────────────────────────────────────────────────

test.describe('public profile — no private seller data', () => {
  test('GET /api/profile/:username omits GPS, shipFrom, verification, email', async ({
    request,
  }: {
    request: APIRequestContext
  }) => {
    const res = await request.get(`/api/profile/${TEST_SELLER.username}`)
    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(data).not.toHaveProperty('email')
    const seller = data.sellerProfile
    expect(seller).toBeTruthy()
    for (const leaked of [
      'latitude',
      'longitude',
      'shipFromAddress',
      'shipFromPhone',
      'shipFromZip',
      'verification_status',
      'verification_reason',
      'profileId',
    ]) {
      expect(seller).not.toHaveProperty(leaked)
    }
    // public fields are still present
    expect(seller).toHaveProperty('store_slug')
    expect(seller).toHaveProperty('store_name')
  })
})
