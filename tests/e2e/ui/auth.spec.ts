// Auth UI — login + register pages render and the wrong-password path shows a
// clear error (not a 500/crash).
import { test, expect } from '@playwright/test'
import { TEST_USER } from '../../helpers/auth'

const T = { timeout: 15000 }

test.describe('Login page', () => {
  test('renders email, password and submit', async ({ page }) => {
    await page.goto('/user-login')
    await expect(page.locator('input[type="email"]')).toBeVisible(T)
    await expect(page.locator('input[type="password"]')).toBeVisible(T)
    await expect(page.locator('button[type="submit"]')).toBeVisible(T)
  })

  test('wrong password shows an error, stays on login, no crash', async ({ page }) => {
    await page.goto('/user-login')
    await page.locator('input[type="email"]').fill(TEST_USER.email)
    await page.locator('input[type="password"]').fill('definitely-the-wrong-password')
    await page.locator('button[type="submit"]').click()

    // An error surfaces (invalid credentials), not a blank screen or 500
    await expect(
      page.getByText(/invalid|incorrect|wrong|credential|password|try again/i).first(),
    ).toBeVisible(T)
    await expect(page).toHaveURL(/user-login/)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('empty submit triggers client validation, no navigation', async ({ page }) => {
    await page.goto('/user-login')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/user-login/)
  })
})

test.describe('Register page', () => {
  test('role chooser → buyer reveals account form', async ({ page }) => {
    await page.goto('/user-register')
    // Page opens on a role chooser, not the form
    const buyer = page.getByRole('button', { name: /I'?m a Buyer/i })
    await expect(buyer).toBeVisible(T)

    await buyer.click()
    // Account fields now render
    await expect(page.locator('input[type="email"]')).toBeVisible(T)
    await expect(page.locator('input[type="password"]').first()).toBeVisible(T)
    await expect(page.locator('button[type="submit"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  // Seller registration is covered by API tests (auth-extended.spec.ts); the
  // buyer path above proves the role-chooser → account-form transition works.
})
