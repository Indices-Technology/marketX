import { test, expect } from '@playwright/test'
import { apiLogin, TEST_SELLER } from '../../helpers/auth'

const T = { timeout: 15000 }

test.describe('Growth — Product Embed', () => {
  let productId: number
  let productSlug: string
  let sellerToken: string
  let embedShortCode: string

  test.beforeAll(async ({ request }) => {
    const { token } = await apiLogin(request, TEST_SELLER)
    sellerToken = token

    const listRes = await request.get(
      `/api/commerce/products?store=${TEST_SELLER.storeSlug}&limit=1`,
    )
    const listBody = await listRes.json()
    const product = listBody.data?.products?.[0]
    if (!product) throw new Error('Seed seller has no products — run: npx prisma db seed')
    productId = product.id
    productSlug = product.slug
  })

  test('minting an embed link requires auth', async ({ request }) => {
    const res = await request.post('/api/growth/assets/embed', {
      data: { productId },
    })
    expect(res.status()).toBe(401)
  })

  test('the owning seller can mint an embed link', async ({ request }) => {
    const res = await request.post('/api/growth/assets/embed', {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { productId },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.data.slug).toBe(productSlug)
    expect(body.data.shortCode).toBeTruthy()
    expect(body.data.trackedUrl).toContain(`/r/${body.data.shortCode}`)
    embedShortCode = body.data.shortCode

    // Get-or-create: minting again for the same product returns the SAME code.
    const res2 = await request.post('/api/growth/assets/embed', {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { productId },
    })
    const body2 = await res2.json()
    expect(body2.data.shortCode).toBe(embedShortCode)
  })

  test('a different signed-in user cannot mint an embed link for someone else\'s product', async ({
    request,
  }) => {
    const { token } = await apiLogin(request) // TEST_USER, not the seller
    const res = await request.post('/api/growth/assets/embed', {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId },
    })
    expect(res.status()).toBe(404)
  })

  test('embed page renders the product publicly, no auth required', async ({
    page,
  }) => {
    await page.goto(`/embed/product/${productSlug}?code=${embedShortCode}`)
    await expect(page.locator('.title')).toHaveText(new RegExp('.+'), T)
    await expect(page.locator('.price')).toContainText('₦', T)
    await expect(page.locator('a.cta')).toHaveAttribute(
      'href',
      `/r/${embedShortCode}`,
    )
    // Opens in a new tab — an embed trapped inside its own iframe would be useless.
    await expect(page.locator('a.cta')).toHaveAttribute('target', '_blank')
  })

  test('embed page renders without site chrome (no nav)', async ({ page }) => {
    await page.goto(`/embed/product/${productSlug}?code=${embedShortCode}`)
    await expect(page.locator('.embed-root')).toBeVisible(T)
    await expect(page.locator('nav')).toHaveCount(0)
  })

  test('embed page without a code still renders, CTA falls back to the plain product URL', async ({
    page,
  }) => {
    await page.goto(`/embed/product/${productSlug}`)
    await expect(page.locator('.title')).toHaveText(new RegExp('.+'), T)
    await expect(page.locator('a.cta')).toHaveAttribute(
      'href',
      `/product/${productSlug}`,
    )
  })

  test('unknown slug shows a graceful empty state, not a crash', async ({
    page,
  }) => {
    await page.goto('/embed/product/this-slug-does-not-exist-xyz123abc')
    await expect(page.getByText('Product unavailable')).toBeVisible(T)
  })

  test('the /embed/** route serves a permissive frame-ancestors CSP', async ({
    request,
  }) => {
    const res = await request.get(`/embed/product/${productSlug}`)
    const csp = res.headers()['content-security-policy'] ?? ''
    expect(csp).toContain('frame-ancestors *')
  })

  test('every other route keeps the strict, non-embeddable CSP (no leakage)', async ({
    request,
  }) => {
    const res = await request.get(`/product/${productSlug}`)
    const csp = res.headers()['content-security-policy'] ?? ''
    expect(csp).not.toContain('frame-ancestors *')
    expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN')
  })

  test('clicking through the tracked link redirects to the real product page', async ({
    request,
  }) => {
    const res = await request.get(`/r/${embedShortCode}`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toContain(`/product/${productSlug}`)
  })

  test('an unknown embed code redirects nowhere (404), not a crash', async ({
    request,
  }) => {
    const res = await request.get('/r/this-code-does-not-exist')
    expect(res.status()).toBe(404)
  })

  test('impression logging accepts a known EMBED code', async ({ request }) => {
    const res = await request.post('/api/growth/embed/view', {
      data: { code: embedShortCode },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('impression logging degrades gracefully for an unknown code (no error surfaced)', async ({
    request,
  }) => {
    const res = await request.post('/api/growth/embed/view', {
      data: { code: 'not-a-real-code' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('impression logging ignores a non-EMBED distribution code (e.g. a CARD code)', async ({
    request,
  }) => {
    const cardRes = await request.post('/api/growth/assets', {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { productId },
    })
    expect(cardRes.ok()).toBeTruthy()
    const cardBody = await cardRes.json()
    const cardCode = (cardBody.data.trackedUrl as string).split('/r/')[1]

    const res = await request.post('/api/growth/embed/view', {
      data: { code: cardCode },
    })
    expect(res.ok()).toBeTruthy() // still 200 — silently ignored, not an error
  })
})
