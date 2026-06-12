import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const T = { timeout: 15000 }

// Stable reference to the single search input inside the sticky header
const stickyInput = (page: Page) =>
  page.locator('.discover-sticky-header input[type="text"]')

// Tab buttons live in the sticky header — scoping avoids name collisions with
// filter options and modal buttons elsewhere on the page
const tab = (page: Page, name: string) =>
  page.locator('.discover-sticky-header').getByRole('button', { name, exact: true })

// Navigate straight to a tab via deep link — clicking tabs before Vue hydration
// silently no-ops, so URL navigation is the reliable path for tab selection
const gotoTab = async (page: Page, key: string) => {
  await page.goto(`/discover?tab=${key}`)
}

test.describe('Commerce — Browse & Discovery', () => {
  // ── /discover ─────────────────────────────────────────────────────────────
  test.describe('/discover', () => {
    test('renders heading, search input, and tab bar', async ({ page }) => {
      await page.goto('/discover')
      await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible(T)
      await expect(stickyInput(page)).toBeVisible()
      for (const name of ['Browse', 'Products', 'Deals', 'Pre-loved']) {
        await expect(tab(page, name)).toBeVisible()
      }
    })

    test('sticky header stays in viewport on scroll', async ({ page }) => {
      await page.goto('/discover')
      await expect(page.locator('.discover-sticky-header')).toBeVisible(T)
      await page.evaluate(() => window.scrollTo(0, 500))
      await expect(page.locator('.discover-sticky-header')).toBeInViewport()
    })

    test('Products tab: shows grid or empty state, no JS error', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Products').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
      await expect(page.locator('body')).not.toContainText('Something went wrong')
    })

    test('Deals tab: shows content', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Deals').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    })

    test('Pre-loved tab: shows content', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Pre-loved').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    })

    test('Fresh Drops tab: shows content', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Fresh Drops').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    })

    test('Sellers tab: shows grid or empty state', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Sellers').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    })

    test('People tab: prompts to search by username when no input', async ({ page }) => {
      // URL navigation is more reliable than clicking a tab in a scrollable container
      await page.goto('/discover?tab=people')
      await expect(
        page.locator('p').filter({ hasText: 'Search by username or name' }).first(),
      ).toBeVisible(T)
    })

    test('search returns "No products found" for garbage input', async ({ page }) => {
      await page.goto('/discover')
      // networkidle ensures Vue has hydrated tab-button click handlers
      await page.waitForLoadState('networkidle')
      await tab(page, 'Products').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)

      const input = stickyInput(page)
      await expect(input).toBeVisible(T)
      await input.fill('zzz_nomatch_xyz_12345')
      // 350 ms debounce + network round-trip; give full 15 s on slow dev servers
      await expect(page.getByText(/No products found/i)).toBeVisible(T)
    })

    test('"Clear search" button removes no-results state', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page, 'Products').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)

      const input = stickyInput(page)
      await input.fill('zzz_nomatch_xyz_12345')
      await expect(page.getByText(/No products found/i)).toBeVisible(T)

      // hasText matches text content only — avoids colliding with the search
      // input's X button which carries aria-label="Clear search"
      await page.locator('button', { hasText: 'Clear search' }).click()
      await expect(page.getByText(/No products found/i)).not.toBeVisible()
    })

    test('tab switch resets search input', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Products').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)

      const input = stickyInput(page)
      await input.fill('aso-oke')
      // Switch tabs — the watch resets searchInput
      await tab(page, 'Deals').click()
      await expect(input).toHaveValue('', T)
    })

    test('Squares tab: shows grid or empty state', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('networkidle')
      await tab(page,'Squares').click()
      await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    })
  })

  // ── /discover?tab= deep-links ─────────────────────────────────────────────
  test('deep-linking ?tab=fresh loads Fresh Drops content', async ({ page }) => {
    await page.goto('/discover?tab=fresh')
    await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('deep-linking ?tab=deals loads Deals content', async ({ page }) => {
    await page.goto('/discover?tab=deals')
    await expect(page.locator('.grid, [class*="py-24"]').first()).toBeVisible(T)
  })

  // ── Standalone listing pages ───────────────────────────────────────────────
  test('/deals page loads without errors', async ({ page }) => {
    await page.goto('/deals')
    await expect(page.locator('.grid, [class*="py-"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('/fresh-drops page loads without errors', async ({ page }) => {
    await page.goto('/fresh-drops')
    await expect(page.locator('.grid, [class*="py-"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('/pre-loved page loads without errors', async ({ page }) => {
    await page.goto('/pre-loved')
    await expect(page.locator('.grid, [class*="py-"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('/thrift permanently redirects to /pre-loved', async ({ page }) => {
    await page.goto('/thrift')
    await expect(page).toHaveURL(/\/pre-loved/)
  })
})

// ── /discover filter sidebar (desktop only) ───────────────────────────────────
test.describe('/discover — filter sidebar', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  const filterSidebar = (page: Page) => page.getByTestId('discover-filters')

  test('filter panel is visible on desktop', async ({ page }) => {
    await page.goto('/discover')
    await expect(filterSidebar(page)).toBeVisible(T)
  })

  test('Browse tab (default) shows Time range section', async ({ page }) => {
    await page.goto('/discover')
    await expect(filterSidebar(page).getByText(/time range/i)).toBeVisible(T)
  })

  test('Products tab shows sort and Price range sections', async ({ page }) => {
    await gotoTab(page, 'products')
    await expect(filterSidebar(page).getByText(/filter by/i)).toBeVisible(T)
    // exact — "price range" also appears in the helper text below the inputs
    await expect(filterSidebar(page).getByText('Price range', { exact: true })).toBeVisible(T)
  })

  test('selecting a non-default sort option activates it (aria-pressed)', async ({ page }) => {
    await gotoTab(page, 'products')
    // Option clicks need hydrated handlers
    await page.waitForLoadState('networkidle')
    const popular = filterSidebar(page).getByRole('button', { name: 'Popular' })
    await popular.click()
    await expect(popular).toHaveAttribute('aria-pressed', 'true', T)
  })

  test('"Clear all" button resets active filters', async ({ page }) => {
    await gotoTab(page, 'products')
    await page.waitForLoadState('networkidle')
    await filterSidebar(page).getByRole('button', { name: 'Popular' }).click()
    const clearBtn = filterSidebar(page).getByRole('button', { name: 'Clear all' })
    await expect(clearBtn).toBeVisible(T)
    await clearBtn.click()
    await expect(clearBtn).not.toBeVisible(T)
  })

  test('Deals tab shows Min discount section', async ({ page }) => {
    await gotoTab(page, 'deals')
    await expect(filterSidebar(page).getByText(/min discount/i)).toBeVisible(T)
  })

  test('Pre-loved tab shows eco badge note', async ({ page }) => {
    await gotoTab(page, 'preloved')
    await expect(filterSidebar(page).getByText(/thrift items only/i)).toBeVisible(T)
  })

  test('Sellers tab shows "Has active deals" toggle', async ({ page }) => {
    await gotoTab(page, 'sellers')
    await expect(filterSidebar(page).getByText('Has active deals')).toBeVisible(T)
  })

  test('Tags tab shows "Sort tags by" section', async ({ page }) => {
    await gotoTab(page, 'tags')
    await expect(filterSidebar(page).getByText(/sort tags by/i)).toBeVisible(T)
  })

  test('People tab shows no-filters placeholder', async ({ page }) => {
    await gotoTab(page, 'people')
    await expect(filterSidebar(page).getByText(/use the search bar/i)).toBeVisible(T)
  })

  test('filter sidebar sections swap when the tab changes', async ({ page }) => {
    await gotoTab(page, 'products')
    // Tab clicks need hydrated handlers before the swap can happen
    await page.waitForLoadState('networkidle')
    await expect(filterSidebar(page).getByText('Price range', { exact: true })).toBeVisible(T)
    await tab(page, 'Deals').click()
    await expect(filterSidebar(page).getByText(/min discount/i)).toBeVisible(T)
  })
})
