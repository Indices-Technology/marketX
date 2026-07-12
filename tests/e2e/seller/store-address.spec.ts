import { test, expect } from '@playwright/test'

const SLUG = 'temi-beauty'

test.describe('memorable store address', () => {
  test('short /{slug} link resolves to the store page', async ({ page }) => {
    await page.goto(`/${SLUG}`)
    await expect(page).toHaveURL(new RegExp(`/sellers/profile/${SLUG}$`))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Temi Beauty',
      { timeout: 15000 },
    )
  })

  test('store page shows the memorable address', async ({ page }) => {
    await page.goto(`/sellers/profile/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Temi Beauty',
    )
    // Memorable store address is surfaced (brandDomain differs per env).
    await expect(
      page.locator('button', { hasText: new RegExp(`/${SLUG}$`) }).first(),
    ).toBeVisible()
  })
})
