// The home search dock — one box for "what can I buy" and "who is this".
// It used to be two tabs, which forced the buyer to classify their own intent
// before typing. These lock in the routing that replaced them, and the honesty
// rules around the verdict it now shows in place.
import { test, expect } from '@playwright/test'

const T = { timeout: 15000 }

const dock = (page: import('@playwright/test').Page) =>
  page.locator('input[placeholder*="paste a phone"]').first()

// Scoped to the dock's own row: the mobile top bar also has a button named
// "Search", so a by-role lookup is ambiguous there.
const primaryButton = (page: import('@playwright/test').Page) =>
  page.locator('div:has(> input[placeholder*="paste a phone"]) > button').last()

/** Pin the seller lookup so the verdict under test doesn't depend on seed data. */
const mockVerify = (
  page: import('@playwright/test').Page,
  body: unknown,
  status = 200,
) =>
  page.route('**/api/reputation/verify*', (route) =>
    status === 200
      ? route.fulfill({ json: body })
      : route.fulfill({ status, json: { error: true } }),
  )

const KNOWN_SELLER = {
  success: true,
  data: {
    status: 'verified',
    query: '08031234567',
    matchedBy: 'phone',
    seller: {
      store_slug: 'lagos-fabrics',
      store_name: 'Lagos Fabrics',
      store_logo: null,
      store_location: 'Lagos',
      publicId: 'MX-LAG-J8KP',
      is_verified: true,
      cac_verified: true,
      enoughEvidence: true,
      tier: 'TIER_2',
      headline: '48 protected orders completed',
    },
  },
}

test.describe('Home search dock', () => {
  test('is one box, not two tabs', async ({ page }) => {
    await page.goto('/')

    await expect(dock(page)).toBeVisible(T)
    await expect(page.getByRole('tab', { name: /Find a seller/i })).toHaveCount(
      0,
    )
    await expect(
      page.getByRole('tab', { name: /Verify any seller/i }),
    ).toHaveCount(0)
  })

  test('ordinary words search; the seller check stays out of the way', async ({
    page,
  }) => {
    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('shoes')

    await expect(primaryButton(page)).toHaveText('Search', T)
    await expect(page.getByText(/No MarketX record/i)).toHaveCount(0)
    await expect(page.getByText(/Checking this/i)).toHaveCount(0)
  })

  test('a known seller is named in place, with what the record shows', async ({
    page,
  }) => {
    await mockVerify(page, KNOWN_SELLER)
    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('08031234567')

    await expect(primaryButton(page)).toHaveText('Check', T)
    await expect(page.getByText('Lagos Fabrics').first()).toBeVisible(T)
    // Not just "verified" — the evidence behind it.
    await expect(page.getByText('48 protected orders completed')).toBeVisible(T)
    await expect(page.getByText('Verified · CAC').first()).toBeVisible(T)

    await page.getByText('Lagos Fabrics').first().click()
    await expect(page).toHaveURL(/\/sellers\/profile\/lagos-fabrics/, T)
  })

  // The rule the whole design hangs on: no record is not a clean bill.
  test('a stranger gets a warning, not a shrug', async ({ page }) => {
    await mockVerify(page, {
      success: true,
      data: { status: 'unknown', query: '07000000001' },
    })
    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('07000000001')

    await expect(
      page.getByText(/No MarketX record for this phone number/i),
    ).toBeVisible(T)
    await expect(page.getByText(/We can't vouch for them/i)).toBeVisible(T)
    // Nothing reassuring anywhere in the verdict.
    await expect(page.getByText('Verified', { exact: true })).toHaveCount(0)

    await page.getByText(/No MarketX record for this phone number/i).click()
    await expect(page).toHaveURL(/\/verify\?q=07000000001/, T)
  })

  // A failed lookup is not an answer — it must not read as either verdict.
  test('a failed check says so instead of guessing', async ({ page }) => {
    await mockVerify(page, null, 500)
    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('08031234567')

    await expect(
      page.getByText(/Couldn't check this phone number/i),
    ).toBeVisible(T)
    await expect(page.getByText(/No MarketX record/i)).toHaveCount(0)
    await expect(page.getByText('Verified', { exact: true })).toHaveCount(0)
  })

  test('shows a seller their standing without asking for a tap', async ({
    page,
  }) => {
    await page.route('**/api/search*', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            users: [],
            posts: [],
            tags: [],
            products: [],
            stores: [
              {
                id: '1',
                store_name: 'Verified Co',
                store_slug: 'verified-co',
                store_logo: null,
                is_verified: true,
                cac_verified: true,
              },
            ],
          },
        },
      }),
    )

    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('verified co')

    await expect(page.getByText('Verified Co')).toBeVisible(T)
    await expect(page.getByText('Verified · CAC')).toBeVisible(T)
  })

  // People were fetched and thrown away, so a username-only match read as
  // "no results" — worse now that @handles are searched without the sigil.
  test('a person who matches is shown, not dropped', async ({ page }) => {
    await page.route('**/api/search*', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            posts: [],
            tags: [],
            products: [],
            stores: [],
            users: [
              { id: 'u1', username: 'ada_styles', avatar: null, bio: null },
            ],
          },
        },
      }),
    )

    await page.goto('/')
    const input = dock(page)
    await input.click()
    await input.fill('ada')

    await expect(page.getByText('@ada_styles')).toBeVisible(T)
    await expect(page.getByText(/No results for/i)).toHaveCount(0)
  })

  test('with nothing typed, the seller check is still reachable', async ({
    page,
  }) => {
    await page.goto('/')
    await dock(page).click()

    const door = page.getByRole('link', { name: /Check any seller/i })
    await expect(door).toBeVisible(T)
    await expect(door).toHaveAttribute('href', '/verify')
  })
})
