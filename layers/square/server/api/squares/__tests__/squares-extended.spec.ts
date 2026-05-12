import { test, expect } from '@playwright/test'
import { apiLogin, TEST_USER, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const OFFICERS = (slug: string) => `/api/squares/${slug}/officers`

// Officers endpoint: POST /api/squares/:slug/officers
// requireAuth is OUTSIDE the try/catch so 401 propagates naturally.
// Non-chairman access returns 403 from squareService.addOfficer.

test.describe('squares — officers', () => {
  test('POST /api/squares/:slug/officers requires auth', async ({ request }) => {
    const res = await request.post(OFFICERS('balogun-market-lagos'), {
      data: { profileId: '00000000-0000-4000-8000-000000000001', role: 'MODERATOR' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/squares/:slug/officers with invalid body returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    // Empty body fails addOfficerSchema (profileId + role both required)
    const res = await request.post(OFFICERS('balogun-market-lagos'), {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/squares/:slug/officers for non-chairman returns 403', async ({ request }) => {
    // TEST_USER is not a chairman of balogun-market-lagos
    const { token } = await apiLogin(request, TEST_USER)
    const res = await request.post(OFFICERS('balogun-market-lagos'), {
      data: { profileId: '00000000-0000-4000-8000-000000000001', role: 'MODERATOR' },
      headers: { Authorization: `Bearer ${token}` },
    })
    // squareService.addOfficer throws 403 for non-chairman
    expect(res.status()).toBe(403)
  })
})
