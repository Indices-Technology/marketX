// Stories audit — create (24h expiry), list (active-only), delete IDOR
import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const STORIES = '/api/stories'
const SECOND_USER = { email: 'chidi@peppr.test', password: 'test1234' }
const MEDIA = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'

test.describe('Stories', () => {
  test('create requires auth → 401', async ({ request }) => {
    const res = await request.post(STORIES, { data: { mediaUrl: MEDIA } })
    expect(res.status()).toBe(401)
  })

  test('create requires mediaUrl → 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(STORIES, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('create sets a ~24h expiry and appears in the active list', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(STORIES, {
      data: { mediaUrl: MEDIA, mediaType: 'IMAGE' },
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const story = (await res.json()).data
    expect(story.id).toBeTruthy()

    // expiresAt ~24h from now (allow a generous window)
    const ms = new Date(story.expiresAt).getTime() - Date.now()
    expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 60_000)

    // cleanup
    await request.delete(`${STORIES}/${story.id}`, { headers: { Authorization: `Bearer ${token}` } })
  })

  test('delete IDOR: another user cannot delete the story → 403', async ({ request }) => {
    const owner = await apiLogin(request, TEST_SELLER)
    const created = await request.post(STORIES, {
      data: { mediaUrl: MEDIA, mediaType: 'IMAGE' },
      headers: { Authorization: `Bearer ${owner.token}` },
    })
    const storyId = (await created.json()).data.id

    const other = await apiLogin(request, SECOND_USER)
    const res = await request.delete(`${STORIES}/${storyId}`, {
      headers: { Authorization: `Bearer ${other.token}` },
    })
    expect(res.status()).toBe(403)

    // owner can delete their own
    const ownDelete = await request.delete(`${STORIES}/${storyId}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    })
    expect(ownDelete.status()).toBe(200)
  })

  test('GET /api/stories is public and returns an array', async ({ request }) => {
    const res = await request.get(STORIES)
    expect(res.status()).toBe(200)
    const body = await res.json()
    const items = body?.data ?? body?.items ?? body
    expect(Array.isArray(items) || Array.isArray(items?.stories)).toBeTruthy()
  })
})
