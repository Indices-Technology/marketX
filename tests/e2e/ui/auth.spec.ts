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

/**
 * Opens /user-register and advances past the role chooser.
 *
 * The chooser is server-rendered, so a click can land before Vue hydrates and
 * hit inert HTML — the step never advances. Retry the click until the account
 * form actually appears.
 */
async function openBuyerAccountForm(page: import('@playwright/test').Page) {
  await page.goto('/user-register')
  const buyer = page.getByRole('button', { name: /I'?m a Buyer/i })
  await expect(buyer).toBeVisible(T)

  await expect(async () => {
    await buyer.click()
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible({
      timeout: 2000,
    })
  }).toPass({ timeout: 30000 })
}

test.describe('Register page', () => {
  test('role chooser → buyer reveals account form', async ({ page }) => {
    await openBuyerAccountForm(page)
    // Account fields now render
    await expect(page.locator('input[type="email"]')).toBeVisible(T)
    await expect(page.locator('input[type="password"]').first()).toBeVisible(T)
    await expect(page.locator('button[type="submit"]').first()).toBeVisible(T)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  // Username availability used to surface only at submit, after the whole form
  // was filled in. These two cover the live verdict in both directions.
  test('a free username is confirmed while typing, before the rest of the form', async ({
    page,
  }) => {
    await openBuyerAccountForm(page)

    const username = page.locator('input[autocomplete="username"]')
    await username.fill(`e2e_${Date.now().toString(36)}`)

    // Email and password are still untouched at this point — that's the fix.
    await expect(page.getByText(/username available/i)).toBeVisible(T)
    await expect(page.locator('input[type="email"]')).toHaveValue('')
  })

  // Usernames are stored lowercase, so the field folds as you type rather than
  // quietly changing what you picked after you submit.
  test('the username field folds mixed case as you type', async ({ page }) => {
    await openBuyerAccountForm(page)

    const username = page.locator('input[autocomplete="username"]')
    await username.fill('MixedCase_Name')
    await expect(username).toHaveValue('mixedcase_name')
  })

  test('a taken username is flagged inline, with a suggestion that fills the field', async ({
    page,
  }) => {
    // Stubbed so the assertion doesn't depend on which accounts exist locally.
    await page.route('**/api/auth/check-username*', (route) =>
      route.fulfill({
        json: {
          success: true,
          username: 'taken_name',
          available: false,
          message: 'Username is already taken',
          suggestions: ['taken_name1'],
        },
      }),
    )

    await openBuyerAccountForm(page)

    const username = page.locator('input[autocomplete="username"]')
    await username.fill('taken_name')

    await expect(page.getByText(/already taken/i)).toBeVisible(T)

    await page.getByRole('button', { name: 'taken_name1' }).click()
    await expect(username).toHaveValue('taken_name1')
  })

  // Seller registration is covered by API tests (auth-extended.spec.ts); the
  // buyer path above proves the role-chooser → account-form transition works.
})
