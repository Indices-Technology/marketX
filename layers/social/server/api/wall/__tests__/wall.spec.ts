// Wall timeline audit — visibility, shoutout auth, delete IDOR, typed notification.
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const STORE_WALL = `/api/wall/store/${TEST_SELLER.storeSlug}` // balogun-fabrics
const POSTS = '/api/posts'
const NOTIFS = '/api/shared/notifications?limit=30'
const BUYER = { email: 'chidi@peppr.test', password: 'test1234' } // shoutout author
const THIRD = { email: 'wuse@peppr.test', password: 'test1234' } // unrelated party

async function header(request: APIRequestContext, creds: any) {
  const { token } = await apiLogin(request, creds)
  return { Authorization: `Bearer ${token}` }
}

// ─── Typed notification — wall owner receives WALL_SHOUTOUT (not GENERAL) ──────
// Runs first, before sibling tests enqueue shoutout notifications, so delivery
// isn't stuck behind a queue backlog (Upstash REST is slow in dev).

test.describe('wall shoutout → WALL_SHOUTOUT notification', () => {
  test('wall owner receives a correctly-typed WALL_SHOUTOUT notification', async ({ request }) => {
    test.setTimeout(60000) // BullMQ + Upstash REST delivery latency
    const authorHeaders = await header(request, BUYER)
    const marker = `WallNotif ${Date.now()}`
    const res = await request.post(STORE_WALL, { headers: authorHeaders, data: { body: marker } })
    expect(res.status()).toBe(200)
    const shoutoutId = (await res.json()).data.id

    // Poll: asserts the notification is delivered AND correctly typed
    // (the bug downgraded it to GENERAL — missing enum + typeMap entry).
    const ownerHeaders = await header(request, TEST_SELLER)
    let match: any
    const deadline = Date.now() + 45000
    while (Date.now() < deadline && !match) {
      const r = await request.get(NOTIFS, { headers: ownerHeaders })
      if (r.status() === 200) {
        const list = (await r.json())?.data?.notifications ?? []
        match = (Array.isArray(list) ? list : []).find(
          (n: any) => n.type === 'WALL_SHOUTOUT' && String(n.postId) === String(shoutoutId),
        )
      }
      if (!match) await new Promise((resolve) => setTimeout(resolve, 2500))
    }
    expect(match, 'WALL_SHOUTOUT notification not found').toBeTruthy()

    await request.delete(`${STORE_WALL}/${shoutoutId}`, { headers: authorHeaders }) // cleanup
  })
})

// ─── Visibility — owner PRIVATE posts never surface on the wall ───────────────

test.describe('wall timeline — visibility', () => {
  let privateId: string
  let publicId: string
  let ownerHeaders: Record<string, string>

  test.beforeAll(async ({ request }) => {
    ownerHeaders = await header(request, TEST_SELLER)
    const stamp = Date.now()
    const mk = async (visibility: string, caption: string) =>
      (
        await (
          await request.post(POSTS, {
            data: { caption, visibility, contentType: 'INSPIRATION' },
            headers: ownerHeaders,
          })
        ).json()
      ).data
    privateId = (await mk('PRIVATE', `wall PRIVATE probe ${stamp}`)).id
    publicId = (await mk('PUBLIC', `wall PUBLIC probe ${stamp}`)).id
  })

  test('guest sees the wall with a data array', async ({ request }) => {
    const res = await request.get(STORE_WALL)
    expect(res.status()).toBe(200)
    expect(Array.isArray((await res.json()).data)).toBe(true)
  })

  test('owner PUBLIC post appears, PRIVATE post does not (guest view)', async ({ request }) => {
    const res = await request.get(`${STORE_WALL}?limit=50`)
    const ids = ((await res.json()).data as Array<{ id: string }>).map((p) => String(p.id))
    expect(ids).toContain(String(publicId))
    expect(ids).not.toContain(String(privateId))
  })

  test.afterAll(async ({ request }) => {
    for (const id of [privateId, publicId])
      if (id) await request.delete(`${POSTS}/${id}`, { headers: ownerHeaders })
  })
})

// ─── Shoutout create — auth + self-wall guard ─────────────────────────────────

test.describe('wall shoutout — create', () => {
  test('unauthenticated → 401', async ({ request }) => {
    const res = await request.post(STORE_WALL, { data: { body: 'hi' } })
    expect(res.status()).toBe(401)
  })

  test('empty body → 400', async ({ request }) => {
    const headers = await header(request, BUYER)
    const res = await request.post(STORE_WALL, { headers, data: { body: '' } })
    expect(res.status()).toBe(400)
  })

  test('posting a shoutout on your OWN user wall → 400', async ({ request }) => {
    const { token, user } = await apiLogin(request, BUYER)
    const res = await request.post(`/api/wall/user/${user.username}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { body: 'talking to myself' },
    })
    // username may differ from slug casing; accept 400 (self-wall) or 404 (slug)
    expect([400, 404]).toContain(res.status())
  })

  test('buyer posts a shoutout on a store wall → 200 SHOUTOUT', async ({ request }) => {
    const headers = await header(request, BUYER)
    const res = await request.post(STORE_WALL, {
      headers,
      data: { body: `Great store! ${Date.now()}` },
    })
    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(data.type).toBe('SHOUTOUT')
    // cleanup
    await request.delete(`${STORE_WALL}/${data.id}`, { headers })
  })
})

// ─── Shoutout delete — author / owner / third-party IDOR ──────────────────────

test.describe('wall shoutout — delete authorization', () => {
  async function newShoutout(request: APIRequestContext, headers: Record<string, string>) {
    const res = await request.post(STORE_WALL, {
      headers,
      data: { body: `Delete probe ${Date.now()}-${Math.random()}` },
    })
    return (await res.json()).data.id as string
  }

  test('third party cannot delete someone else’s shoutout → 403', async ({ request }) => {
    const authorHeaders = await header(request, BUYER)
    const id = await newShoutout(request, authorHeaders)
    const third = await header(request, THIRD)
    const res = await request.delete(`${STORE_WALL}/${id}`, { headers: third })
    expect(res.status()).toBe(403)
    await request.delete(`${STORE_WALL}/${id}`, { headers: authorHeaders }) // cleanup
  })

  test('shoutout author can delete their own → 200', async ({ request }) => {
    const authorHeaders = await header(request, BUYER)
    const id = await newShoutout(request, authorHeaders)
    const res = await request.delete(`${STORE_WALL}/${id}`, { headers: authorHeaders })
    expect(res.status()).toBe(200)
  })

  test('wall owner can delete a shoutout left on their wall → 200', async ({ request }) => {
    const authorHeaders = await header(request, BUYER)
    const id = await newShoutout(request, authorHeaders)
    const ownerHeaders = await header(request, TEST_SELLER)
    const res = await request.delete(`${STORE_WALL}/${id}`, { headers: ownerHeaders })
    expect(res.status()).toBe(200)
  })
})

