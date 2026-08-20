// Cookie consent — the promise the privacy page makes, enforced.
//
// With no tracker configured (the current deployment) there is nothing optional
// to consent to, so there must be no banner AND no third-party tracker. The
// consent logic itself is unit-tested; this guards the deployed default.
import { test, expect } from '@playwright/test'

const T = { timeout: 15000 }

test.describe('Cookie consent', () => {
  test('loads no third-party tracker and asks nothing when none is configured', async ({
    page,
  }) => {
    const thirdParty: string[] = []
    page.on('request', (r) => {
      const url = r.url()
      if (/facebook\.net|facebook\.com|connect\.facebook/.test(url)) {
        thirdParty.push(url)
      }
    })

    await page.goto('/')
    await expect(page.locator('body')).toBeVisible(T)
    await page.waitForTimeout(2500)

    expect(thirdParty).toEqual([])
    await expect(page.getByText(/Can we measure our ads/i)).toHaveCount(0)
  })

  test('the privacy page describes the optional tracker honestly', async ({
    page,
  }) => {
    await page.goto('/privacy')

    // The old copy claimed no third-party advertising cookies were used at all,
    // which stops being true the moment the pixel is switched on.
    await expect(page.getByText(/We do not use third-party/i)).toHaveCount(0)
    await expect(
      page.getByText(/off unless you allow it/i).first(),
    ).toBeVisible(T)
  })
})
