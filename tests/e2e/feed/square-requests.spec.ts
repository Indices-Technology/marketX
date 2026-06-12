// Verifies the Requests tab on a Square renders and the composer opens.
import { test, expect } from '@playwright/test'
import { pageLogin } from '../../helpers/auth'

const SQUARE = '/squares/balogun-market-lagos'
const BUYER = { email: 'chidi@peppr.test', password: 'test1234' }
const T = { timeout: 15000 }

test.describe('Square — Requests tab', () => {
  test('guest: tab renders without error', async ({ page }) => {
    await page.goto(SQUARE)
    // Retry the tab click — it can land before Vue hydrates the handler
    await expect(async () => {
      await page.getByRole('button', { name: 'Requests', exact: true }).click()
      await expect(page.getByText(/Buyer requests/i)).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 20000 })
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await page.screenshot({ path: 'docs/ui-audit/square-requests-guest.png', fullPage: false })
  })

  test('buyer: can open the request composer', async ({ page, request }) => {
    await pageLogin(page, request, BUYER)
    await page.goto(SQUARE)

    // Click Requests and confirm the section actually switched (handlers live)
    await expect(async () => {
      await page.getByRole('button', { name: 'Requests', exact: true }).click()
      await expect(page.getByText(/Buyer requests/i)).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 20000 })

    // Either "Post a request" (already following) or "Follow to post"
    const postBtn = page.getByRole('button', { name: /post a request/i })
    const followBtn = page.getByRole('button', { name: /follow to post/i })

    if (await followBtn.isVisible().catch(() => false)) {
      await followBtn.click()
      await expect(postBtn).toBeVisible(T)
    }
    await postBtn.click()
    await expect(page.getByText(/What are you looking for/i)).toBeVisible(T)
    await page.screenshot({ path: 'docs/ui-audit/square-requests-composer.png', fullPage: false })
  })
})
