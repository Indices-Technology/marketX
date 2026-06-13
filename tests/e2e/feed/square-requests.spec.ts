// Verifies the Requests tab on a Square renders and the composer opens.
import { test, expect } from '@playwright/test'
import { pageLogin, TEST_SELLER } from '../../helpers/auth'

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

  test('All tab shows the "Buyers looking for" strip when a request exists', async ({ page, request }) => {
    const { apiLogin } = await import('../../helpers/auth')
    const { token } = await apiLogin(request, BUYER)
    const h = { Authorization: `Bearer ${token}` }
    await request.post(`/api/squares/balogun-market-lagos/follow`, { headers: h })
    const title = `All-strip probe ${Date.now()}`
    const reqRes = await request.post(`/api/squares/balogun-market-lagos/requests`, {
      headers: h,
      data: { title },
    })
    const requestId = (await reqRes.json()).data?.id

    await page.goto(SQUARE) // All is the default tab
    await expect(page.getByText(/Buyers looking for/i)).toBeVisible(T)
    await expect(page.getByText(title)).toBeVisible(T)
    await page.screenshot({ path: 'docs/ui-audit/square-all-strip.png', fullPage: false })

    if (requestId)
      await request.delete(`/api/squares/balogun-market-lagos/requests/${requestId}`, { headers: h })
  })

  test('seller: respond picker opens with existing products', async ({ page, request }) => {
    // Seed an OPEN request as a buyer via API so the seller has something to respond to
    const { apiLogin } = await import('../../helpers/auth')
    const { token } = await apiLogin(request, BUYER)
    const h = { Authorization: `Bearer ${token}` }
    await request.post(`/api/squares/balogun-market-lagos/follow`, { headers: h })
    const reqRes = await request.post(`/api/squares/balogun-market-lagos/requests`, {
      headers: h,
      data: { title: `UI seller probe ${Date.now()}` },
    })
    const requestId = (await reqRes.json()).data?.id

    // TEST_SELLER (balogun-fabrics) is an ACTIVE member → sees "Respond with product"
    await pageLogin(page, request, TEST_SELLER)
    await page.goto(SQUARE)
    await expect(async () => {
      await page.getByRole('button', { name: 'Requests', exact: true }).click()
      await expect(page.getByText(/Buyer requests/i)).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 20000 })

    const respondBtn = page.getByRole('button', { name: /respond with product/i }).first()
    await expect(respondBtn).toBeVisible(T)
    await respondBtn.click()

    // Picker modal shows existing products + a quick-add fallback
    await expect(page.getByText('Respond with a product')).toBeVisible(T)
    await expect(page.getByRole('button', { name: /quick add new/i })).toBeVisible(T)
    await page.screenshot({ path: 'docs/ui-audit/square-respond-picker.png', fullPage: false })

    // cleanup
    const buyer = await apiLogin(request, BUYER)
    if (requestId)
      await request.delete(`/api/squares/balogun-market-lagos/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${buyer.token}` },
      })
  })
})
