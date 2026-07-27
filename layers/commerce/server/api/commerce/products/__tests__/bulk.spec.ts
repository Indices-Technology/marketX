import { test, expect } from '@playwright/test'
import {
  apiLogin,
  resetRateLimits,
  TEST_SELLER,
} from '../../../../../../../tests/helpers/auth'

/**
 * POST /api/commerce/products/bulk — offline gallery bulk import.
 *
 * Asserts the §3 footgun fixes behave: rows import as DRAFT, per-row partial
 * success, in-batch duplicate titles get unique slugs, and colliding SKUs are
 * rejected per-row rather than aborting the batch.
 */

const BULK = '/api/commerce/products/bulk'
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

// Unique per run/worker so slug/SKU/public_id assertions never collide with
// prior runs' data or with a parallel worker that imported at the same ms.
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

// Each row needs a distinct media public_id — Media.public_id is globally unique,
// exactly as Cloudinary assigns one per upload in production.
let _seq = 0
const row = (over: Record<string, unknown> = {}) => ({
  title: `Bulk Test ${RUN}`,
  price: 4500,
  mediaItems: [
    {
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      public_id: `demo/sample-${RUN}-${_seq++}`,
      type: 'IMAGE',
    },
  ],
  ...over,
})

test.describe('products bulk import', () => {
  test.beforeEach(async ({ request }) => {
    await resetRateLimits(request)
  })

  test('requires auth', async ({ request }) => {
    const res = await request.post(BULK, { data: { rows: [row()] } })
    expect(res.status()).toBe(401)
  })

  test('400 when rows[] is missing or empty', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(BULK, { ...auth(token), data: { rows: [] } })
    expect(res.status()).toBe(400)
  })

  test('creates draft products and returns a summary', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(BULK, {
      ...auth(token),
      data: {
        storeSlug: TEST_SELLER.storeSlug,
        rows: [row({ title: `Alpha ${RUN}` }), row({ title: `Beta ${RUN}` })],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.summary).toMatchObject({ total: 2, created: 2, failed: 0 })
    expect(body.data.created).toHaveLength(2)
    expect(body.data.created[0]).toMatchObject({
      id: expect.any(Number),
      slug: expect.any(String),
    })
  })

  test('partial success: a bad row fails without sinking the good one', async ({
    request,
  }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post(BULK, {
      ...auth(token),
      data: {
        rows: [
          row({ title: `Good ${RUN}` }),
          row({ title: 'x' }), // title min length is 2 → invalid
        ],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.summary).toMatchObject({ total: 2, created: 1, failed: 1 })
    expect(body.data.errors[0].index).toBe(1)
  })

  test('duplicate titles in one batch get distinct slugs', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const title = `Dup ${RUN}`
    const res = await request.post(BULK, {
      ...auth(token),
      data: { rows: [row({ title }), row({ title })] },
    })
    const body = await res.json()
    expect(body.data.created).toHaveLength(2)
    const [a, b] = body.data.created
    expect(a.slug).not.toBe(b.slug)
  })

  test('colliding SKU in a batch is rejected per-row', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    const sku = `SKU-${RUN}`
    const res = await request.post(BULK, {
      ...auth(token),
      data: {
        rows: [
          row({ title: `SkuA ${RUN}`, SKU: sku }),
          row({ title: `SkuB ${RUN}`, SKU: sku }), // same SKU → second rejected
        ],
      },
    })
    const body = await res.json()
    expect(body.data.summary.created).toBe(1)
    expect(body.data.errors.some((e: any) => /SKU/.test(e.error))).toBe(true)
  })
})
