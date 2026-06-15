// Confirms /sellers renders without the "Failed to resolve component: BaseImage"
// warning on a fresh build (verifies auto-import registration is correct).
import { test, expect } from '@playwright/test'

test('/sellers resolves BaseImage (no unresolved-component warning)', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (msg) => {
    const t = msg.text()
    if (/Failed to resolve component/i.test(t)) warnings.push(t)
  })

  await page.goto('/sellers')
  await page.waitForTimeout(2000) // let the page hydrate + render cards

  await expect(page.locator('body')).not.toContainText('Something went wrong')
  expect(warnings, warnings.join('\n')).toHaveLength(0)
})
