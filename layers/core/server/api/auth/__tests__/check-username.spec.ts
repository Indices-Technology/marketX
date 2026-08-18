import { test, expect } from '@playwright/test'
import {
  resetRateLimits,
  uniqueUsername,
} from '../../../../../../tests/helpers/auth'

const ENDPOINT = '/api/auth/check-username'

test.beforeAll(async ({ request }) => {
  await resetRateLimits(request)
})

test.describe('GET /api/auth/check-username', () => {
  test('reports a free username as available', async ({ request }) => {
    const res = await request.get(
      `${ENDPOINT}?username=${encodeURIComponent(uniqueUsername())}`,
    )

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.available).toBe(true)
    expect(body.suggestions).toEqual([])
  })

  // One registration covers both halves of the contract: what the endpoint
  // says before/after must match what register actually does, and the
  // suggestions it offers must be claimable. Registration is capped at 3/hour
  // per IP, so this spec spends only one of them.
  test('flips to taken once the name is registered, and suggests free ones', async ({
    request,
  }) => {
    const username = uniqueUsername()

    const before = await request.get(`${ENDPOINT}?username=${username}`)
    expect((await before.json()).available).toBe(true)

    const reg = await request.post('/api/auth/register', {
      data: {
        email: `${username}@test.com`,
        username,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
      },
    })
    expect(reg.status()).toBe(200)

    const after = await request.get(`${ENDPOINT}?username=${username}`)
    const body = await after.json()
    expect(body.available).toBe(false)
    expect(body.suggestions.length).toBeGreaterThan(0)

    // Usernames are one identity however they're typed — profile URLs already
    // resolve case-insensitively, so claiming must work the same way.
    const shouty = await request.get(
      `${ENDPOINT}?username=${username.toUpperCase()}`,
    )
    expect((await shouty.json()).available).toBe(false)

    const dupe = await request.post('/api/auth/register', {
      data: {
        email: `${username}_2@test.com`,
        username: username.toUpperCase(),
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
      },
    })
    expect(dupe.status()).toBe(400)

    for (const suggestion of body.suggestions) {
      const probe = await request.get(`${ENDPOINT}?username=${suggestion}`)
      expect((await probe.json()).available).toBe(true)
    }
  })

  test('answers malformed usernames inline instead of erroring', async ({
    request,
  }) => {
    const res = await request.get(`${ENDPOINT}?username=ab`)

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.message).toContain('3 characters')
  })

  test('rejects usernames with illegal characters', async ({ request }) => {
    const res = await request.get(
      `${ENDPOINT}?username=${encodeURIComponent('bad name!')}`,
    )

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
  })

  test('is public — no auth required', async ({ request }) => {
    const res = await request.get(`${ENDPOINT}?username=${uniqueUsername()}`)
    expect(res.status()).toBe(200)
  })
})
