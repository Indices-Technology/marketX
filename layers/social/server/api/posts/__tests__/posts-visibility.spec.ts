// Posts & Feed audit — visibility leak + edit/delete IDOR
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const POSTS = '/api/posts'
const HOME = '/api/feed/home?limit=50'
const DISCOVER = '/api/feed/discover?limit=50'
const SECOND_USER = { email: 'chidi@peppr.test', password: 'test1234' }

async function createPost(
  request: APIRequestContext,
  token: string,
  visibility: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS',
  caption: string,
) {
  const res = await request.post(POSTS, {
    data: { caption, visibility, contentType: 'INSPIRATION' },
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.status()).toBeLessThan(300)
  return (await res.json()).data
}

function idsOf(body: any): string[] {
  const items = body?.items ?? body?.data?.items ?? []
  return items.map((i: any) => String(i.id))
}

// ─── Visibility leak — PRIVATE posts must never reach public feeds ────────────

test.describe('feed visibility — private posts do not leak', () => {
  let privateId: string
  let publicId: string
  let token: string

  test.beforeAll(async ({ request }) => {
    token = (await apiLogin(request, TEST_SELLER)).token
    const stamp = Date.now()
    privateId = (await createPost(request, token, 'PRIVATE', `PRIVATE leak probe ${stamp}`)).id
    publicId = (await createPost(request, token, 'PUBLIC', `PUBLIC probe ${stamp}`)).id
  })

  test('home feed (guest) excludes the PRIVATE post', async ({ request }) => {
    const res = await request.get(HOME)
    expect(res.status()).toBe(200)
    expect(idsOf(await res.json())).not.toContain(privateId)
  })

  test('discover feed excludes the PRIVATE post', async ({ request }) => {
    const res = await request.get(DISCOVER)
    expect(res.status()).toBe(200)
    expect(idsOf(await res.json())).not.toContain(privateId)
  })

  test('public user feed excludes the PRIVATE post', async ({ request }) => {
    const me = (await apiLogin(request, TEST_SELLER)).user
    const res = await request.get(`/api/feed/user/${me.id}?limit=100`)
    expect(res.status()).toBe(200)
    const ids = idsOf(await res.json())
    expect(ids).not.toContain(privateId)
    expect(ids).toContain(publicId) // public one is visible
  })

  test.afterAll(async ({ request }) => {
    for (const id of [privateId, publicId]) {
      if (id) await request.delete(`${POSTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    }
  })
})

// ─── Edit / delete IDOR ───────────────────────────────────────────────────────

test.describe('post edit/delete — cross-user IDOR', () => {
  let postId: string
  let ownerToken: string

  test.beforeAll(async ({ request }) => {
    ownerToken = (await apiLogin(request, TEST_SELLER)).token
    postId = (await createPost(request, ownerToken, 'PUBLIC', `IDOR probe ${Date.now()}`)).id
  })

  test('another user cannot edit the post → 403', async ({ request }) => {
    const { token } = await apiLogin(request, SECOND_USER)
    const res = await request.patch(`${POSTS}/${postId}`, {
      data: { caption: 'hijacked' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('another user cannot delete the post → 403', async ({ request }) => {
    const { token } = await apiLogin(request, SECOND_USER)
    const res = await request.delete(`${POSTS}/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })

  test('owner can edit their own post → 200', async ({ request }) => {
    const res = await request.patch(`${POSTS}/${postId}`, {
      data: { caption: `edited ${Date.now()}` },
      headers: { Authorization: `Bearer ${ownerToken}` },
    })
    expect(res.status()).toBe(200)
  })

  test.afterAll(async ({ request }) => {
    if (postId) await request.delete(`${POSTS}/${postId}`, { headers: { Authorization: `Bearer ${ownerToken}` } })
  })
})
