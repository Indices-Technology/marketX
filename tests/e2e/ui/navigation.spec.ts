/**
 * Global navigation tests — desktop SideNav + mobile BottomNavMobile
 *
 * Desktop (1440×900): fixed left sidebar with Home, Discover, Reels, Squares.
 *   Near Me moved OUT of the rail and into the ☰ More popup (see MoreMenu.vue) —
 *   the rail holds primary destinations only, More holds app-level secondary ones.
 *   1440px puts us safely above the xl: breakpoint (1280px + ~17px scrollbar = ~1297px).
 * Mobile (390×844):   fixed bottom bar with Home, Near Me, Create, Squares, Profile.
 *
 * Locator strategy: scope to the `<aside class="fixed left-0">` sidebar or
 * `nav.bottom-nav` to avoid matching duplicate links in main content areas.
 */
import { test, expect } from '../../helpers/fixtures'
import { pageLogin } from '../../helpers/auth'

const T = { timeout: 15000 }

// Helpers
const sideNav = (page: any) => page.locator('aside.fixed.left-0')
const bottomNav = (page: any) => page.locator('nav.bottom-nav')

// ── DESKTOP SIDENAV ───────────────────────────────────────────────────────────

test.describe('desktop SideNav — guest', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('sidebar is visible', async ({ page }) => {
    await expect(sideNav(page)).toBeVisible(T)
  })

  test('logo "MX" is visible inside sidebar', async ({ page }) => {
    await expect(sideNav(page).getByText('MX').first()).toBeVisible(T)
  })

  test('Home nav link is present', async ({ page }) => {
    await expect(
      sideNav(page).getByRole('link', { name: /^home$/i }),
    ).toBeVisible(T)
  })

  test('Discover nav link is present', async ({ page }) => {
    await expect(
      sideNav(page).getByRole('link', { name: /^discover$/i }),
    ).toBeVisible(T)
  })

  test('Reels nav link is present', async ({ page }) => {
    await expect(sideNav(page).locator('a[href="/reels"]')).toBeVisible(T)
  })

  test('More button is present for guests', async ({ page }) => {
    await expect(
      sideNav(page).locator('button[aria-label="More"]'),
    ).toBeVisible(T)
  })

  test('Squares nav link is present', async ({ page }) => {
    await expect(sideNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  })

  test('Discover link navigates to /discover', async ({ page }) => {
    await sideNav(page)
      .getByRole('link', { name: /^discover$/i })
      .click()
    await expect(page).toHaveURL('/discover', T)
  })

  test('Squares link navigates to /squares', async ({ page }) => {
    await sideNav(page).locator('a[href="/squares"]').click()
    await expect(page).toHaveURL('/squares', T)
  })

  test('Reels link navigates to /reels', async ({ page }) => {
    await sideNav(page).locator('a[href="/reels"]').click()
    await expect(page).toHaveURL('/reels', T)
  })

  test('guest sees Create link pointing to /user-register', async ({
    page,
  }) => {
    await expect(sideNav(page).locator('a[href="/user-register"]')).toBeVisible(
      T,
    )
  })
})

// ── DESKTOP ☰ MORE MENU ───────────────────────────────────────────────────────
// Driven from /discover, not /. The home route renders SplashScreen as its
// ClientOnly fallback — a `fixed inset-0 z-[100]` overlay that swallows every
// click until hydration completes, which is also why the three pre-existing
// "link navigates to X" tests above fail. /discover hydrates normally, and the
// rail under test is identical on both routes.
test.describe('desktop SideNav — More menu (guest)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'networkidle' })
  })

  test('Near Me is reachable from the More menu', async ({ page }) => {
    // Near Me lives in ☰ More now, not the rail. It must still be reachable by a
    // GUEST — that is the whole reason More renders for logged-out visitors.
    await expect(sideNav(page).locator('a[href="/map"]')).toHaveCount(0)
    await sideNav(page).locator('button[aria-label="More"]').click()
    await expect(sideNav(page).locator('a[href="/map"]')).toBeVisible(T)
  })

  test('Help is reachable from the More menu', async ({ page }) => {
    await sideNav(page).locator('button[aria-label="More"]').click()
    await expect(sideNav(page).locator('a[href="/help"]')).toBeVisible(T)
  })

  test('More menu navigates to /map', async ({ page }) => {
    await sideNav(page).locator('button[aria-label="More"]').click()
    await sideNav(page).locator('a[href="/map"]').click()
    await expect(page).toHaveURL('/map', T)
  })
})

test.describe('desktop SideNav — active state', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Home link has active class when on /', async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Two a[href="/"] exist: logo + nav-button. Target only the nav-button.
    await expect(sideNav(page).locator('a.nav-button[href="/"]')).toHaveClass(
      /active/,
      T,
    )
  })

  test('Discover link has active class when on /discover', async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'networkidle' })
    await expect(sideNav(page).locator('a[href="/discover"]')).toHaveClass(
      /active/,
      T,
    )
  })

  test('Squares link has active class when on /squares', async ({ page }) => {
    await page.goto('/squares', { waitUntil: 'networkidle' })
    await expect(sideNav(page).locator('a[href="/squares"]')).toHaveClass(
      /active/,
      T,
    )
  })
})

// ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────────────

test.describe('mobile BottomNav — guest', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('bottom nav bar is visible', async ({ page }) => {
    await expect(bottomNav(page)).toBeVisible(T)
  })

  test('Home icon link is present in bottom nav', async ({ page }) => {
    await expect(bottomNav(page).locator('a[href="/"]')).toBeVisible(T)
  })

  test('Near Me icon link is present in bottom nav', async ({ page }) => {
    await expect(bottomNav(page).locator('a[href="/map"]')).toBeVisible(T)
  })

  test('Squares icon link is present in bottom nav', async ({ page }) => {
    await expect(bottomNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  })

  test('guest sees "Start selling" CTA in bottom nav (goes to /user-register)', async ({
    page,
  }) => {
    await expect(
      bottomNav(page).locator('a[href="/user-register"]'),
    ).toBeVisible(T)
  })
})

// ── MOBILE HEADER — aria-labels ──────────────────────────────────────────────

test.describe('mobile header — aria-labels', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('Cart button has aria-label="Cart"', async ({ page }) => {
    await expect(page.locator('button[aria-label="Cart"]')).toBeVisible(T)
  })

  test('Search control has aria-label="Search"', async ({ page }) => {
    await expect(page.locator('[aria-label="Search"]')).toBeVisible(T)
  })

  test('guest sees a Sign in CTA in the mobile header', async ({ page }) => {
    const header = page.locator('header.mobile-header')
    await expect(header.getByRole('link', { name: /sign in/i })).toBeVisible(T)
  })
})

// ── MOBILE BOTTOM NAV — aria-labels ──────────────────────────────────────────

test.describe('mobile BottomNav — aria-labels', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('Home link has aria-label="Home"', async ({ page }) => {
    await expect(bottomNav(page).locator('[aria-label="Home"]')).toBeVisible(T)
  })

  test('Near Me link has aria-label="Near Me"', async ({ page }) => {
    await expect(bottomNav(page).locator('[aria-label="Near Me"]')).toBeVisible(
      T,
    )
  })

  test('Squares link has aria-label="Squares"', async ({ page }) => {
    await expect(bottomNav(page).locator('[aria-label="Squares"]')).toBeVisible(
      T,
    )
  })

  test('guest: Create link has aria-label="Start selling"', async ({
    page,
  }) => {
    await expect(
      bottomNav(page).locator('[aria-label="Start selling"]'),
    ).toBeVisible(T)
  })

  test('guest: Sign in link has aria-label="Sign in"', async ({ page }) => {
    await expect(bottomNav(page).locator('[aria-label="Sign in"]')).toBeVisible(
      T,
    )
  })
})

// ── AUTH STATE DIFFERENCES ────────────────────────────────────────────────────

test.describe('navigation — authenticated differences', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('authenticated user sees Create <button> in nav (not a link)', async ({
    page,
    request,
  }) => {
    await pageLogin(page, request)
    // SSE/Pusher connections on authenticated home never reach networkidle
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Logged-in Create is a <button> that opens a modal, not an <a href="/user-register">
    await expect(
      sideNav(page).locator('a[href="/user-register"]'),
    ).not.toBeVisible()
    const createBtn = sideNav(page)
      .locator('button')
      .filter({ hasText: /create/i })
    await expect(createBtn).toBeVisible(T)
  })
})

// ── PAGE META / SEO ───────────────────────────────────────────────────────────

test.describe('page meta tags', () => {
  for (const { route, label } of [
    { route: '/', label: 'home' },
    { route: '/discover', label: 'discover' },
    { route: '/squares', label: 'squares' },
  ]) {
    test(`${label} page has a non-empty <title>`, async ({ page }) => {
      // Home's MinimalHome video slides never reach 'networkidle'; the other
      // two routes are fine with it.
      await page.goto(route, {
        waitUntil: route === '/' ? 'domcontentloaded' : 'networkidle',
      })
      const title = await page.title()
      expect(title.trim().length).toBeGreaterThan(0)
    })
  }

  test('home page has meta description', async ({ page }) => {
    // MinimalHome's autoplaying/looping video slides keep the network busy
    // indefinitely, same as SSE/WS pages elsewhere in this suite — never
    // reaches 'networkidle'.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const content = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(content?.trim().length ?? 0).toBeGreaterThan(0)
  })
})

// ── VISUAL SNAPSHOTS ──────────────────────────────────────────────────────────

// NOTE: after the TrustMarketHome/SocialFeed → MinimalHome default-home
// switch, both baselines below must be regenerated — run with --update-snapshots.

test('desktop SideNav — visual snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: /search or verify a seller/i }),
  ).toBeVisible({ timeout: 30000 })
  const box = await sideNav(page).boundingBox()
  await expect(page).toHaveScreenshot('desktop-sidenav.png', {
    maxDiffPixelRatio: 0.05,
    clip: box ?? undefined,
  })
})

test('mobile BottomNav — visual snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: /search or verify a seller/i }),
  ).toBeVisible({ timeout: 30000 })
  const box = await bottomNav(page).boundingBox()
  await expect(page).toHaveScreenshot('mobile-bottomnav.png', {
    maxDiffPixelRatio: 0.05,
    clip: box ?? undefined,
  })
})
