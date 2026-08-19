// Seller onboarding — what a brand-new seller is offered once the store is
// live. Adding products one at a time is the slowest way in, so the success
// screen has to point at the bulk routes too.
//
// The registration call is NOT stubbed: a fake token trips BaseApiClient's 401
// handler, which force-logs-out and redirects to /user-login. So this drives
// the real wizard and creates a real store, with a unique slug per run.
import { test, expect } from '@playwright/test'

const T = { timeout: 15000 }

test.describe('Seller onboarding — next actions', () => {
  test('offers the bulk routes, not just "add first product"', async ({
    page,
  }) => {
    const unique = Date.now().toString(36)
    const storeName = `E2E Onboarding ${unique}`
    const storeSlug = `e2e-onboarding-${unique}`

    await page.goto('/user-register')

    // Signup is capped at 3/hour per IP. Reset from inside the page, not via
    // the request fixture — Node and the browser reach the dev server as
    // different clients, so a Node-side reset clears the wrong IP's counter.
    await page.evaluate(() =>
      fetch('/api/__test__/reset-rate-limits', { method: 'POST' }),
    )

    // The chooser is server-rendered; a click before hydration hits inert HTML.
    const seller = page.getByRole('button', { name: /I want to Sell/i })
    await expect(seller).toBeVisible(T)
    await expect(async () => {
      await seller.click()
      await expect(page.locator('input[autocomplete="username"]')).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 30000 })

    // Account step
    await page.locator('input[autocomplete="username"]').fill(`e2e_${unique}`)
    await page.locator('input[type="email"]').fill(`e2e_${unique}@test.com`)
    await page.locator('input[type="password"]').first().fill('ValidPass123!')
    await page.locator('input[type="password"]').nth(1).fill('ValidPass123!')
    await page.locator('#terms').check()
    await page.locator('button[type="submit"]').first().click()

    // Store step — the slug is derived from the name and checked live
    await page.getByPlaceholder('e.g. Lagos Streetwear Co.').fill(storeName)
    await expect(page.getByText('Available!')).toBeVisible(T)
    await page.getByRole('button', { name: /Launch my store/i }).click()

    await expect(page.getByText(/Your store is live/i)).toBeVisible({
      timeout: 30000,
    })

    // The point of the screen: three ways in, not one.
    await expect(
      page.getByRole('link', { name: /Add first product/i }),
    ).toHaveAttribute('href', `/seller/${storeSlug}/products/create`)

    await expect(
      page.getByRole('link', { name: /Bulk import/i }),
    ).toHaveAttribute('href', `/seller/${storeSlug}/products/bulk`)

    // Both social imports are listed but not linked: Facebook is still being
    // tested (reachable from Growth → Connected accounts), TikTok is waiting on
    // the video.list scope. Listed beats hidden — sellers should know it's coming.
    for (const source of [/Import from Facebook/i, /Import from TikTok/i]) {
      await expect(page.getByText(source)).toBeVisible()
      await expect(page.getByRole('link', { name: source })).toHaveCount(0)
    }

    // The Facebook deep link still works for when that link is switched back on:
    // this seller has no Page connected, so the import sources are scrolled into
    // view with their connect route, and the query is cleared so a refresh
    // doesn't reopen the picker.
    await page.goto(`/seller/${storeSlug}/products/bulk?source=facebook`)
    await expect(page.getByText(/From your socials/i)).toBeVisible(T)
    await expect(page.getByText(/Connect in Growth/i)).toBeVisible(T)
    await expect
      .poll(() => new URL(page.url()).searchParams.get('source'), T)
      .toBeNull()
  })

  // /sellers/create is auth-walled, so a signed-out visitor following it from
  // the home page hit the login wall instead of a way to sign up.
  test('home page sends signed-out visitors to registration, not the walled create page', async ({
    page,
  }) => {
    await page.goto('/')

    // Desktop renders "Become a Seller" in the hero header, the dense mobile
    // hero renders "Start selling" — whichever is on screen must point at
    // registration, and none of them may point at the walled page.
    const cta = page.getByRole('link', {
      name: /Become a Seller|Start selling/i,
    })
    await expect(cta.first()).toBeVisible(T)
    for (const link of await cta.all()) {
      await expect(link).toHaveAttribute('href', '/user-register')
    }

    // Nothing on the signed-out home page may point at the walled page —
    // covers the hero CTAs and the trust dock's "Become a verified seller".
    await expect(page.locator('a[href="/sellers/create"]')).toHaveCount(0)
  })

  test('the Facebook deep link lands on the import sources, not a dead end', async ({
    page,
  }) => {
    // Unauthenticated: the auth middleware should bounce this to login rather
    // than render a broken page. Proves the link target is a guarded real route.
    await page.goto('/seller/some-store/products/bulk?source=facebook')
    await expect(page).toHaveURL(/user-login/, T)
  })
})
