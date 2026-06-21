// Square buyer-requests + seller-offers audit suite
// Covers: follower gate, content-guard masking, seller membership + product
// ownership on offers, buyer accept/decline IDOR, open-request rate limit.
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../../../../../tests/helpers/auth'

const SQUARE = 'balogun-market-lagos' // ACTIVE; balogun-fabrics + ada-styles are members
const REQS = `/api/squares/${SQUARE}/requests`
const FOLLOW = `/api/squares/${SQUARE}/follow`
const PRODUCTS = '/api/commerce/products'

const BUYER = { email: 'chidi@peppr.test', password: 'test1234' } // buyer-only, no seller profile
const NON_MEMBER_SELLER = { email: 'wuse@peppr.test', password: 'test1234' } // not in this square

async function authHeader(request: APIRequestContext, creds: any) {
  const { token } = await apiLogin(request, creds)
  return { Authorization: `Bearer ${token}` }
}

/** Buyer follows the square then posts a request; returns the created request. */
async function postRequest(
  request: APIRequestContext,
  headers: Record<string, string>,
  overrides: Record<string, unknown> = {},
) {
  await request.post(FOLLOW, { headers }) // idempotent-ish; ignore result
  const res = await request.post(REQS, {
    headers,
    data: { title: `Looking for aso-oke ${Date.now()}`, ...overrides },
  })
  return res
}

// ─── Auth + follower gate ─────────────────────────────────────────────────────

test.describe('POST requests — auth & follower gate', () => {
  test('unauthenticated → 401', async ({ request }) => {
    const res = await request.post(REQS, { data: { title: 'x' } })
    expect(res.status()).toBe(401)
  })

  test('non-follower → 403', async ({ request }) => {
    // A seller who has not followed this square. Unfollow first to be safe.
    const headers = await authHeader(request, NON_MEMBER_SELLER)
    await request.delete(FOLLOW, { headers })
    const res = await request.post(REQS, {
      headers,
      data: { title: 'Looking for something' },
    })
    expect(res.status()).toBe(403)
  })

  test('follower → 200 and request is OPEN', async ({ request }) => {
    const headers = await authHeader(request, BUYER)
    const res = await postRequest(request, headers, { title: 'Need a navy agbada, size XL' })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('OPEN')
    expect(body.data.id).toBeTruthy()
    // cleanup
    await request.delete(`${REQS}/${body.data.id}`, { headers })
  })
})

// ─── Content guard ────────────────────────────────────────────────────────────

test.describe('content guard — contact info masked', () => {
  test('phone number in note is masked on persist', async ({ request }) => {
    const headers = await authHeader(request, BUYER)
    const res = await postRequest(request, headers, {
      title: 'Looking for ankara fabric',
      note: 'please call me on 08012345678 abeg',
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.note).not.toContain('08012345678')
    expect(body.data.note).toContain('[hidden]')
    await request.delete(`${REQS}/${body.data.id}`, { headers })
  })
})

// ─── Offers — membership + ownership ──────────────────────────────────────────

test.describe('POST offers — membership & ownership', () => {
  let requestId: string
  let buyerHeaders: Record<string, string>
  let sellerProductId: number
  let sellerVariantId: number
  let foreignProductId: number
  let wuseProductId: number

  test.beforeAll(async ({ request }) => {
    buyerHeaders = await authHeader(request, BUYER)
    const reqRes = await postRequest(request, buyerHeaders, { title: 'Looking for lace, 5 yards' })
    requestId = (await reqRes.json()).data.id

    // Create a product owned by TEST_SELLER (balogun-fabrics, a member)
    const sellerHeaders = await authHeader(request, TEST_SELLER)
    const prodRes = await request.post(PRODUCTS, {
      headers: sellerHeaders,
      data: {
        title: `Offer Product ${Date.now()}`,
        price: 8000,
        description: 'Product used by the square offers test suite.',
        status: 'PUBLISHED',
        variants: [{ size: 'One Size', stock: 5 }],
      },
    })
    const prod = (await prodRes.json()).data
    sellerProductId = prod.id
    sellerVariantId = prod.variants[0].id

    // A product NOT owned by TEST_SELLER (ada-styles' seed product)
    const seed = await request.get('/api/commerce/products/by-slug/adire-tie-dye-maxi-dress')
    foreignProductId = (await seed.json()).data.id

    // A product owned by the NON-member seller (wuse) — used to test the
    // membership gate independently of product ownership
    const wuseHeaders = await authHeader(request, NON_MEMBER_SELLER)
    const wuseProd = await request.post(PRODUCTS, {
      headers: wuseHeaders,
      data: {
        title: `Wuse Offer Product ${Date.now()}`,
        price: 5000,
        description: 'Product owned by a non-member seller for the membership test.',
        status: 'PUBLISHED',
        variants: [{ size: 'One Size', stock: 5 }],
      },
    })
    wuseProductId = (await wuseProd.json()).data.id
  })

  test('non-member seller offering their OWN product → 403 (membership gate)', async ({ request }) => {
    const headers = await authHeader(request, NON_MEMBER_SELLER)
    const res = await request.post(`${REQS}/${requestId}/offers`, {
      headers,
      data: { productId: wuseProductId },
    })
    expect(res.status()).toBe(403)
  })

  test('member seller offering own product → 200', async ({ request }) => {
    const headers = await authHeader(request, TEST_SELLER)
    const res = await request.post(`${REQS}/${requestId}/offers`, {
      headers,
      data: { productId: sellerProductId, variantId: sellerVariantId, message: 'Got this in stock' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('PENDING')
    expect(body.data.productId).toBe(sellerProductId)
  })

  test('duplicate offer (same product) → 409', async ({ request }) => {
    const headers = await authHeader(request, TEST_SELLER)
    const res = await request.post(`${REQS}/${requestId}/offers`, {
      headers,
      data: { productId: sellerProductId },
    })
    expect(res.status()).toBe(409)
  })

  test('member seller offering another seller\'s product → 403', async ({ request }) => {
    const headers = await authHeader(request, TEST_SELLER)
    const res = await request.post(`${REQS}/${requestId}/offers`, {
      headers,
      data: { productId: foreignProductId },
    })
    expect(res.status()).toBe(403)
  })

  test.afterAll(async ({ request }) => {
    await request.delete(`${REQS}/${requestId}`, { headers: buyerHeaders })
    const sellerHeaders = await authHeader(request, TEST_SELLER)
    if (sellerProductId)
      await request.delete(`${PRODUCTS}/${sellerProductId}`, { headers: sellerHeaders })
    if (wuseProductId) {
      const wuseHeaders = await authHeader(request, NON_MEMBER_SELLER)
      await request.delete(`${PRODUCTS}/${wuseProductId}`, { headers: wuseHeaders })
    }
  })
})

// ─── Accept / decline ─────────────────────────────────────────────────────────

test.describe('PATCH offer — accept/decline IDOR', () => {
  let requestId: string
  let offerId: string
  let buyerHeaders: Record<string, string>
  let productId: number

  test.beforeAll(async ({ request }) => {
    buyerHeaders = await authHeader(request, BUYER)
    requestId = (await postRequest(request, buyerHeaders, { title: 'Looking for george wrapper' }).then((r) => r.json())).data.id

    const sellerHeaders = await authHeader(request, TEST_SELLER)
    const prodRes = await request.post(PRODUCTS, {
      headers: sellerHeaders,
      data: {
        title: `Accept Product ${Date.now()}`,
        price: 12000,
        description: 'Product used by the accept/decline test.',
        status: 'PUBLISHED',
        variants: [{ size: 'One Size', stock: 5 }],
      },
    })
    const prod = (await prodRes.json()).data
    productId = prod.id
    const offerRes = await request.post(`${REQS}/${requestId}/offers`, {
      headers: sellerHeaders,
      data: { productId, variantId: prod.variants[0].id },
    })
    offerId = (await offerRes.json()).data.id
  })

  test('non-owner cannot act on the offer → 403', async ({ request }) => {
    const headers = await authHeader(request, NON_MEMBER_SELLER)
    const res = await request.patch(`${REQS}/${requestId}/offers/${offerId}`, {
      headers,
      data: { action: 'ACCEPT' },
    })
    expect(res.status()).toBe(403)
  })

  test('buyer accepts → request FULFILLED, variant returned', async ({ request }) => {
    const res = await request.patch(`${REQS}/${requestId}/offers/${offerId}`, {
      headers: buyerHeaders,
      data: { action: 'ACCEPT' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('ACCEPTED')
    expect(body.data.productId).toBe(productId)

    // Request now FULFILLED — confirm via detail in the list
    const list = await request.get(`${REQS}?status=FULFILLED&limit=50`)
    const ids = (await list.json()).data.requests.map((r: { id: string }) => r.id)
    expect(ids).toContain(requestId)
  })

  test.afterAll(async ({ request }) => {
    const sellerHeaders = await authHeader(request, TEST_SELLER)
    if (productId) await request.delete(`${PRODUCTS}/${productId}`, { headers: sellerHeaders })
  })
})

// ─── Rate limit ───────────────────────────────────────────────────────────────

test.describe('open-request rate limit', () => {
  test('6th concurrent open request → 429', async ({ request }) => {
    const headers = await authHeader(request, BUYER)
    const created: string[] = []
    let sawLimit = false
    for (let i = 0; i < 7; i++) {
      const res = await request.post(REQS, {
        headers,
        data: { title: `Ratelimit probe ${i} ${Date.now()}` },
      })
      if (res.status() === 429) { sawLimit = true; break }
      if (res.ok()) created.push((await res.json()).data.id)
    }
    expect(sawLimit).toBe(true)
    // cleanup — close all created so the cap resets for the next run
    for (const id of created) await request.delete(`${REQS}/${id}`, { headers })
  })
})

// ─── Notification delivery — a new request notifies member sellers ────────────

test.describe('square request → SQUARE_REQUEST notification', () => {
  test('member seller receives a correctly-typed SQUARE_REQUEST notification', async ({ request }) => {
    const buyer = await authHeader(request, BUYER)
    await request.post(FOLLOW, { headers: buyer })

    const title = `Notif probe ${Date.now()}`
    const reqRes = await request.post(REQS, { headers: buyer, data: { title } })
    expect(reqRes.status()).toBe(200)
    const requestId = (reqRes.ok() ? (await reqRes.json()).data?.id : null)

    // TEST_SELLER (balogun-fabrics) is an ACTIVE member of this square → notified.
    // Delivery is via the BullMQ worker (Upstash Redis) or the inline fallback
    // when Redis is absent. Upstash REST round-trips add latency, so the poll
    // window is generous — this asserts delivery + correct typing, not speed.
    const sellerHeaders = await authHeader(request, TEST_SELLER)
    await expect(async () => {
      const res = await request.get('/api/shared/notifications?limit=30', { headers: sellerHeaders })
      expect(res.status()).toBe(200)
      const body = await res.json()
      const list = body?.data?.notifications ?? body?.data ?? body?.notifications ?? []
      const match = (Array.isArray(list) ? list : []).find(
        (n: any) => n.type === 'SQUARE_REQUEST' && (n.message ?? '').includes(title),
      )
      expect(match, 'SQUARE_REQUEST notification not found').toBeTruthy()
    }).toPass({ timeout: 30000, intervals: [1000, 2000, 3000] })

    if (requestId) await request.delete(`${REQS}/${requestId}`, { headers: buyer })
  })
})
