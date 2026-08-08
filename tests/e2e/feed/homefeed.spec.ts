/**
 * Home feed tests — covers MinimalHome (guest, and authenticated default)
 * and SocialFeed (authenticated, opt-in "detailed" setting).
 *
 * MinimalHome: full-screen, one post/product/reel at a time; search/verify
 *              lives behind a persistent top-bar icon, not inline copy.
 * SocialFeed:  personalised social feed, opt-in via feedDisplayStyle=detailed.
 *
 * Rewritten after the Feed/nav pivot retired TrustMarketHome — see project
 * memory "Feed/nav pivot decision" for the reasoning.
 */
import { test, expect } from '../../helpers/fixtures'
import { pageLogin, apiLogin } from '../../helpers/auth'

const T = { timeout: 15000 }

// ── GUEST / UNAUTHENTICATED ──────────────────────────────────────────────────

test.describe('home — guest (MinimalHome)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('renders feed content or empty fallback — not stuck loading', async ({
    page,
  }) => {
    await expect(
      page
        .locator('.feed-slide')
        .first()
        .or(page.getByText(/nothing here yet/i)),
    ).toBeVisible({ timeout: 30000 })
  })

  test('search/verify icon opens the find-or-verify sheet', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /search or verify a seller/i })
      .click()
    await expect(page.getByRole('tab', { name: /find a trader/i })).toBeVisible(
      T,
    )
    await expect(
      page.getByRole('tab', { name: /verify any seller/i }),
    ).toBeVisible(T)
  })

  test('Verify tab routes to /verify', async ({ page }) => {
    await page
      .getByRole('button', { name: /search or verify a seller/i })
      .click()
    await page.getByRole('tab', { name: /verify any seller/i }).click()
    await page.getByPlaceholder(/instagram_handle/i).fill('swankyshoes')
    await page.getByRole('button', { name: /^verify seller$/i }).click()
    await expect(page).toHaveURL(/\/verify\?q=/, T)
  })

  test('Squares nav link navigates to /squares', async ({ page }) => {
    const link = page.locator('a[href="/squares"]').first()
    await expect(link).toBeVisible(T)
    await link.click()
    await expect(page).toHaveURL('/squares', T)
  })

  test('sign-in nav link navigates to /user-login', async ({ page }) => {
    // Both the (desktop-visible) SideNav and the (mobile-only, CSS-hidden at
    // this project's desktop viewport) mobile header have a matching href —
    // ':visible' picks whichever one actually renders for this viewport.
    const link = page.locator('a[href="/user-login"]:visible').first()
    await expect(link).toBeVisible(T)
    await link.click()
    await expect(page).toHaveURL(/user-login/, T)
  })

  test('no accessibility violations on guest home', async ({
    page,
    makeAxeBuilder,
  }) => {
    // Wait for content past the loading spinner before auditing.
    await expect(
      page
        .locator('.feed-slide')
        .first()
        .or(page.getByText(/nothing here yet/i)),
    ).toBeVisible({ timeout: 30000 })
    const results = await makeAxeBuilder().analyze()
    expect(results.violations).toEqual([])
  })
})

// ── AUTHENTICATED, DEFAULT SETTING (MinimalHome) ─────────────────────────────

test.describe('home — authenticated, minimal (default)', () => {
  test.beforeEach(async ({ page, request }) => {
    // Explicitly reset to the default so this spec doesn't depend on
    // leftover state from the "detailed" describe block below.
    const { token } = await apiLogin(request)
    await request.patch('/api/profile/settings', {
      data: { feed_display_style: 'minimal' },
      headers: { Authorization: `Bearer ${token}` },
    })
    await pageLogin(page, request)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('renders MinimalHome, not SocialFeed', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /search or verify a seller/i }),
    ).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('tab', { name: /for you/i })).not.toBeVisible()
  })
})

// ── AUTHENTICATED, DETAILED (opt-in, SocialFeed) ─────────────────────────────

test.describe('home — authenticated, detailed (opt-in)', () => {
  test.beforeEach(async ({ page, request }) => {
    const { token } = await apiLogin(request)
    await request.patch('/api/profile/settings', {
      data: { feed_display_style: 'detailed' },
      headers: { Authorization: `Bearer ${token}` },
    })
    await pageLogin(page, request)
    // SSE/WS connections after login never reach networkidle — use domcontentloaded
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test.afterEach(async ({ request }) => {
    // Don't leak "detailed" into other specs that assume the default.
    const { token } = await apiLogin(request)
    await request.patch('/api/profile/settings', {
      data: { feed_display_style: 'minimal' },
      headers: { Authorization: `Bearer ${token}` },
    })
  })

  test('renders social feed — SplashScreen clears after auth', async ({
    page,
  }) => {
    const splash = page.locator('.fixed.inset-0.z-\\[100\\]')
    await expect(splash).not.toBeVisible({ timeout: 30000 })
  })

  test('feed is not stuck on SplashScreen after auth', async ({ page }) => {
    const splash = page.locator('.fixed.inset-0.z-\\[100\\]')
    await expect(splash).not.toBeVisible({ timeout: 30000 })
    // Wait for SocialFeed to actually mount (the feed filter tabs are
    // SocialFeed-only).
    await expect(page.getByRole('tab', { name: /for you/i })).toBeVisible({
      timeout: 30000,
    })
    // MinimalHome's search icon is guest/minimal-only — should NOT be visible
    // once SocialFeed (detailed) is shown.
    await expect(
      page.getByRole('button', { name: /search or verify a seller/i }),
    ).not.toBeVisible()
  })
})

// ── VISUAL SNAPSHOT ───────────────────────────────────────────────────────────

test('guest home — visual snapshot', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // NOTE: after the TrustMarketHome → MinimalHome switch the baseline
  // home-guest.png must be regenerated — run this spec once with --update-snapshots.
  await expect(
    page
      .locator('.feed-slide')
      .first()
      .or(page.getByText(/nothing here yet/i)),
  ).toBeVisible({ timeout: 30000 })
  // Hide images + animate elements so layout is stable across runs with dynamic content
  await page.addStyleTag({
    content: `
      img, video { visibility: hidden !important; }
      * { animation: none !important; transition: none !important; }
    `,
  })
  await expect(page).toHaveScreenshot('home-guest.png', {
    maxDiffPixelRatio: 0.1,
  })
})
