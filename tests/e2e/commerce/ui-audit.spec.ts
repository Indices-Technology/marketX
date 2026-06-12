// Commerce UI/UX audit — June pillar
// Behavioral verification of the AUDIT.md UI/UX checklist items that had no
// E2E coverage (cart drawer, out-of-stock gate, review gate, seller pages),
// plus a desktop + mobile screenshot gallery for human visual sign-off.
// Screenshots land in docs/ui-audit/.
import { test, expect } from '@playwright/test'
import type { Page, APIRequestContext } from '@playwright/test'
import {
  apiLogin,
  pageLogin,
  clearCart,
  getFirstVariantId,
  getFirstProductSlug,
  TEST_SELLER,
} from '../../helpers/auth'

const T = { timeout: 15000 }
const SHOTS = 'docs/ui-audit'

const openCart = async (page: Page) => {
  // Retry the click — it can land before Vue hydration, and the drawer itself
  // is a lazy async component that loads on first open
  await expect(async () => {
    await page.getByRole('button', { name: 'Cart' }).first().click()
    await expect(page.getByRole('button', { name: 'Close cart' })).toBeVisible({
      timeout: 3000,
    })
  }).toPass({ timeout: 25000 })
}

async function seedCart(request: APIRequestContext, quantity = 1) {
  const { token } = await apiLogin(request)
  await clearCart(request, token)
  const variantId = await getFirstVariantId(request)
  await request.post('/api/commerce/cart', {
    data: { variantId, quantity },
    headers: { Authorization: `Bearer ${token}` },
  })
  return token
}

// ─── Cart drawer ──────────────────────────────────────────────────────────────

test.describe('Cart drawer — behaviors', () => {
  test('quantity + updates and persists server-side', async ({ page, request }) => {
    const token = await seedCart(request)
    await pageLogin(page, request)

    await openCart(page)
    // Retry the + click until the server reflects it — clicks can land before
    // the drawer's handlers are interactive
    await expect(async () => {
      await page.getByRole('button', { name: 'Increase quantity' }).first().click()
      const res = await request.get('/api/commerce/cart', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const items: Array<{ quantity: number }> = (await res.json()).data?.items ?? []
      expect(items[0]?.quantity ?? 0).toBeGreaterThanOrEqual(2)
    }).toPass({ timeout: 20000 })
  })

  test('remove item leaves no ghost row and shows empty state', async ({ page, request }) => {
    await seedCart(request)
    await pageLogin(page, request)

    await openCart(page)
    await page.getByRole('button', { name: 'Remove from cart' }).first().click()
    await expect(page.getByText('Your cart is empty')).toBeVisible(T)
  })

  test('cart badge count reflects items after add', async ({ page, request }) => {
    await seedCart(request, 1)
    await pageLogin(page, request)
    // Badge renders cartCount > 0 next to the Cart button
    await expect(
      page.getByRole('button', { name: 'Cart' }).first().locator('..').getByText(/^\d+$/).first(),
    ).toBeVisible(T)
  })

  test('guest cart survives page refresh (cookie-persisted store)', async ({ page, request }) => {
    const slug = await getFirstProductSlug(request)
    await page.goto(`/product/${slug}`)
    await page.waitForLoadState('networkidle')

    const addBtn = page.getByRole('button', { name: /add to cart/i })
    await expect(addBtn).toBeEnabled(T)
    // Retry until the persisted Pinia cart store contains the item — the click
    // can land before hydration. pinia-plugin-persistedstate/nuxt v4 persists
    // to a COOKIE named after the store id, not localStorage.
    await expect(async () => {
      await addBtn.click()
      const cookies = await page.context().cookies()
      const cart = cookies.find((c) => c.name === 'cart')
      expect(decodeURIComponent(cart?.value ?? '')).toContain('"items":[{')
    }).toPass({ timeout: 20000 })

    await page.reload({ waitUntil: 'load' })
    await openCart(page)
    await expect(page.getByText('Your cart is empty')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove from cart' }).first()).toBeVisible(T)
  })
})

// ─── Product page — purchase gates ────────────────────────────────────────────

test.describe('Product page — gates', () => {
  let oosProductId: number | null = null
  let oosSlug: string | null = null

  test.beforeAll(async ({ request }) => {
    // Product whose only variant has zero stock
    const { token } = await apiLogin(request, TEST_SELLER)
    const res = await request.post('/api/commerce/products', {
      data: {
        title: `UI Audit OOS ${Date.now()}`,
        price: 2000,
        description: 'Out-of-stock product created by the UI audit suite.',
        status: 'PUBLISHED',
        variants: [{ size: 'One Size', stock: 0 }],
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    oosProductId = body.data?.id ?? null
    oosSlug = body.data?.slug ?? null
  })

  test('"Add to Cart" is blocked when the only variant is out of stock', async ({ page }) => {
    test.skip(!oosSlug, 'OOS product creation failed')
    await page.goto(`/product/${oosSlug}`)
    const addBtn = page.getByRole('button', { name: /add to cart|out of stock/i })
    await expect(addBtn).toBeVisible(T)
    // Either the button disables or it is replaced by an out-of-stock label —
    // both block the purchase
    const disabled = await addBtn.isDisabled()
    const oosText = await page.getByText(/out of stock/i).first().isVisible().catch(() => false)
    expect(disabled || oosText).toBe(true)
  })

  test('guest does not see a "Write a review" affordance', async ({ page, request }) => {
    const slug = await getFirstProductSlug(request)
    await page.goto(`/product/${slug}`)
    await expect(page.getByText(/customer reviews/i).first()).toBeVisible(T)
    await expect(page.getByRole('button', { name: /write a review/i })).not.toBeVisible()
  })

  test.afterAll(async ({ request }) => {
    if (!oosProductId) return
    const { token } = await apiLogin(request, TEST_SELLER)
    await request.delete(`/api/commerce/products/${oosProductId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  })
})

// ─── Seller dashboard pages render ────────────────────────────────────────────

test.describe('Seller dashboard — pages render', () => {
  test('orders page renders with status controls', async ({ page, request }) => {
    await pageLogin(page, request, TEST_SELLER)
    await page.goto(`/seller/${TEST_SELLER.storeSlug}/orders`)
    await expect(page.getByText(/orders/i).first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await page.screenshot({ path: `${SHOTS}/seller-orders-desktop.png`, fullPage: true })
  })

  test('product create wizard renders core fields', async ({ page, request }) => {
    await pageLogin(page, request, TEST_SELLER)
    await page.goto(`/seller/${TEST_SELLER.storeSlug}/products/create`)
    // Step 1 is the media upload step — its file input is hidden by design,
    // so assert any visible form control or the upload dropzone
    await expect(
      page.locator('input:visible, textarea:visible, [class*="drop"], [class*="upload" i]').first(),
    ).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await page.screenshot({ path: `${SHOTS}/seller-create-desktop.png`, fullPage: true })
  })

  test('dashboard renders without errors', async ({ page, request }) => {
    await pageLogin(page, request, TEST_SELLER)
    await page.goto(`/seller/${TEST_SELLER.storeSlug}/dashboard`)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await page.screenshot({ path: `${SHOTS}/seller-dashboard-desktop.png`, fullPage: true })
  })
})

// ─── Screenshot gallery for visual sign-off ───────────────────────────────────

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'discover', path: '/discover' },
  { name: 'deals', path: '/deals' },
]

test.describe('Screenshot gallery — desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const p of PAGES) {
    test(`desktop: ${p.name}`, async ({ page }) => {
      await page.goto(p.path)
      await page.waitForTimeout(2500) // let media settle
      await page.screenshot({ path: `${SHOTS}/${p.name}-desktop.png`, fullPage: false })
    })
  }

  test('desktop: product page', async ({ page, request }) => {
    const slug = await getFirstProductSlug(request)
    await page.goto(`/product/${slug}`)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${SHOTS}/product-desktop.png`, fullPage: true })
  })

  test('desktop: checkout with seeded cart', async ({ page, request }) => {
    await seedCart(request)
    await pageLogin(page, request)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible(T)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/checkout-desktop.png`, fullPage: true })
  })

  test('desktop: cart drawer open', async ({ page, request }) => {
    await seedCart(request)
    await pageLogin(page, request)
    await openCart(page)
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/cart-drawer-desktop.png`, fullPage: false })
  })
})

test.describe('Screenshot gallery — mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const p of PAGES) {
    test(`mobile: ${p.name}`, async ({ page }) => {
      await page.goto(p.path)
      await page.waitForTimeout(2500)
      await page.screenshot({ path: `${SHOTS}/${p.name}-mobile.png`, fullPage: false })
    })
  }

  test('mobile: product page', async ({ page, request }) => {
    const slug = await getFirstProductSlug(request)
    await page.goto(`/product/${slug}`)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${SHOTS}/product-mobile.png`, fullPage: true })
  })

  test('mobile: checkout with seeded cart', async ({ page, request }) => {
    await seedCart(request)
    await pageLogin(page, request)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible(T)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/checkout-mobile.png`, fullPage: true })
  })
})
