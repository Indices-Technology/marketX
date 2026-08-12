# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\ui\navigation.spec.ts >> desktop SideNav — guest >> Reels link navigates to /reels
- Location: tests\e2e\ui\navigation.spec.ts:80:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('aside.fixed.left-0').locator('a[href="/reels"]')
    - locator resolved to <a href="/reels" data-v-119f0440="" class="nav-button group">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-v-8627a087="" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">…</div> from <main class="md:ml-20" data-v-382c51e4="">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-v-8627a087="" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">…</div> from <main class="md:ml-20" data-v-382c51e4="">…</main> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div data-v-8627a087="" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">…</div> from <main class="md:ml-20" data-v-382c51e4="">…</main> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying
    - locator resolved to <a href="/reels" data-v-119f0440="" class="nav-button group">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
  110 × retrying click action
        - waiting 500ms
        - waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - element is outside of the viewport
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - link "MarketX" [ref=e7] [cursor=pointer]:
          - /url: /
          - img "MarketX" [ref=e8]
        - generic [ref=e15]:
          - navigation [ref=e16]:
            - link "Home" [ref=e17] [cursor=pointer]:
              - /url: /
              - generic [ref=e19]: Home
            - link "Discover" [ref=e20] [cursor=pointer]:
              - /url: /discover
              - generic [ref=e22]: Discover
            - link "Reels" [ref=e23] [cursor=pointer]:
              - /url: /reels
              - generic [ref=e25]: Reels
            - link "Squares" [ref=e26] [cursor=pointer]:
              - /url: /squares
              - generic [ref=e28]: Squares
          - navigation [ref=e29]:
            - link "Create" [ref=e30] [cursor=pointer]:
              - /url: /user-register
              - generic [ref=e32]: Create
            - button "Cart" [ref=e33] [cursor=pointer]:
              - generic [ref=e36]: Cart
        - button "More" [ref=e38] [cursor=pointer]:
          - generic [ref=e40]: More
        - link "Sign In" [ref=e42] [cursor=pointer]:
          - /url: /user-login
          - generic [ref=e44]: Sign In
    - main [ref=e45]:
      - generic [ref=e46]:
        - generic [ref=e48]:
          - generic:
            - generic [ref=e50]:
              - link "MarketX" [ref=e51] [cursor=pointer]:
                - /url: /
                - generic "MarketX" [ref=e52]:
                  - generic [ref=e53]: market
                  - generic [ref=e54]: x
              - generic [ref=e55]:
                - link "Log in" [ref=e56] [cursor=pointer]:
                  - /url: /user-login
                - link "Become a Seller" [ref=e57] [cursor=pointer]:
                  - /url: /sellers/create
            - generic:
              - generic:
                - generic:
                  - heading "Find trusted sellers. Buy with confidence." [level=1]:
                    - generic: Find trusted sellers. Buy with confidence.
                  - generic [ref=e59]:
                    - generic [ref=e60]:
                      - tablist "Find or verify a seller" [ref=e61]:
                        - tab "Find a seller" [selected] [ref=e62] [cursor=pointer]: Find a seller
                        - tab "Verify any seller" [ref=e64] [cursor=pointer]: Verify any seller
                      - generic [ref=e66]:
                        - generic [ref=e68]: Search sellers, products or markets
                        - textbox "Search sellers, products or markets" [ref=e69]:
                          - /placeholder: Search sellers, products or markets…
                        - button "Search" [ref=e70] [cursor=pointer]
                    - paragraph [ref=e71]:
                      - text: Selling instead?
                      - link "Become a verified seller →" [ref=e72] [cursor=pointer]:
                        - /url: /sellers/create
                  - generic:
                    - generic:
                      - generic: Verified Sellers
                    - generic:
                      - generic: Escrow Protected
                    - generic:
                      - generic: Nationwide Delivery
                - generic:
                  - generic:
                    - generic:
                      - generic: Trust Card
                      - generic:
                        - generic:
                          - img "Starcollections cover"
                        - generic:
                          - generic:
                            - generic:
                              - img "Starcollections"
                            - generic:
                              - generic:
                                - heading "Starcollections" [level=2]
                              - paragraph:
                                - generic: Aba, Abia
                          - generic:
                            - button "MX-ZK37": MX-ZK37
                          - generic:
                            - paragraph: Building trust on MarketX
                            - paragraph: Escrow-protected from the very first sale
                          - generic:
                            - generic:
                              - img "Store QR code"
                            - generic:
                              - paragraph: Scan to verify
                              - button "marketx.africa/starcollections":
                                - generic: marketx.africa/starcollections
                              - paragraph: Powered by MarketX
                    - generic:
                      - article:
                        - link "View Hamaz Shopping Complex market square":
                          - /url: /squares/hamaz-complex-jos
                        - generic:
                          - generic: Market
                        - generic:
                          - generic:
                            - generic: HA
                        - generic:
                          - heading "Hamaz Shopping Complex" [level=3]
                          - paragraph: Jos, Plateau
                          - generic:
                            - generic: 1 traders
                            - generic: · 2 goods
                            - generic: Visit
                    - generic:
                      - generic:
                        - generic:
                          - img "Itel 5 watt charger"
                          - generic:
                            - generic: −2%
                          - button "Like"
                        - generic:
                          - heading "Itel 5 watt charger" [level=3]
                          - generic:
                            - generic:
                              - generic: Hadronpower
                          - link "Hamaz Shopping Complex":
                            - /url: /squares/hamaz-complex-jos
                            - generic: Hamaz Shopping Complex
                          - generic:
                            - generic:
                              - text: "5.0"
                              - generic: (1)
                            - generic: ·
                            - generic:
                              - generic: Jos
                          - generic:
                            - generic:
                              - generic: ₦4,000
                              - generic: ₦3,920
                            - button "Add to cart"
            - generic [ref=e73]:
              - generic [ref=e74]: © 2026 MarketX
              - generic [ref=e75]:
                - link "Terms" [ref=e76] [cursor=pointer]:
                  - /url: /terms
                - link "Privacy" [ref=e77] [cursor=pointer]:
                  - /url: /privacy
                - link "Help" [ref=e78] [cursor=pointer]:
                  - /url: /help/getting-started
          - generic [ref=e79]:
            - generic [ref=e80]:
              - paragraph [ref=e81]: From the marketplace
              - heading "What's on MarketX right now" [level=2] [ref=e82]
            - generic [ref=e83]:
              - generic [ref=e84] [cursor=pointer]:
                - generic [ref=e85]:
                  - img "Itel 5 watt charger" [ref=e87]
                  - generic [ref=e88]: −2%
                - generic [ref=e89]:
                  - generic [ref=e90]:
                    - heading "Itel 5 watt charger" [level=3] [ref=e91]
                    - link "Hadronpower" [ref=e92]:
                      - /url: /sellers/profile/hadronpower
                  - generic [ref=e93]:
                    - generic [ref=e94]: ₦3,920
                    - generic [ref=e95]: ₦4,000
                - generic [ref=e96]:
                  - generic [ref=e97]:
                    - generic [ref=e98]:
                      - button "Like" [ref=e99]
                      - generic [ref=e101]: "0"
                    - button "0" [ref=e102]:
                      - generic [ref=e104]: "0"
                    - generic [ref=e105]: "6"
                    - button [ref=e107]
                  - button [ref=e110]
              - generic [ref=e112] [cursor=pointer]:
                - generic [ref=e113]:
                  - img "Itel power pack panels" [ref=e115]
                  - generic [ref=e116]: −5%
                  - generic [ref=e117]: Only 5 left
                - generic [ref=e118]:
                  - generic [ref=e119]:
                    - heading "Itel power pack panels" [level=3] [ref=e120]
                    - link "Hadronpower" [ref=e121]:
                      - /url: /sellers/profile/hadronpower
                  - generic [ref=e122]:
                    - generic [ref=e123]: ₦323,000
                    - generic [ref=e124]: ₦340,000
                - generic [ref=e125]:
                  - generic [ref=e126]:
                    - generic [ref=e127]:
                      - button "Like" [ref=e128]
                      - button "1" [ref=e130]
                    - button "0" [ref=e131]:
                      - generic [ref=e133]: "0"
                    - generic [ref=e134]: "5"
                    - button [ref=e136]
                  - generic [ref=e138]:
                    - button "Market this product and earn commission" [ref=e139]
                    - button [ref=e141]
              - generic [ref=e143] [cursor=pointer]:
                - generic [ref=e144]:
                  - img "Ultimate Smartwatch with Health Features" [ref=e146]
                  - generic [ref=e147]: −5%
                - generic [ref=e148]:
                  - generic [ref=e149]:
                    - heading "Ultimate Smartwatch with Health Features" [level=3] [ref=e150]
                    - link "LegitShop" [ref=e151]:
                      - /url: /sellers/profile/legitshop
                  - generic [ref=e152]:
                    - generic [ref=e153]: ₦66,500
                    - generic [ref=e154]: ₦70,000
                - generic [ref=e155]:
                  - generic [ref=e156]:
                    - generic [ref=e157]:
                      - button "Like" [ref=e158]
                      - button "1" [ref=e160]
                    - button "0" [ref=e161]:
                      - generic [ref=e163]: "0"
                    - generic [ref=e164]: "2"
                    - button [ref=e166]
                  - generic [ref=e168]:
                    - button "Market this product and earn commission" [ref=e169]
                    - button [ref=e171]
              - generic [ref=e173] [cursor=pointer]:
                - generic [ref=e174]:
                  - img "Antimony ore" [ref=e176]
                  - generic [ref=e178]: Pre-loved
                - generic [ref=e179]:
                  - generic [ref=e180]:
                    - heading "Antimony ore" [level=3] [ref=e181]
                    - link "OkoroSamuel store" [ref=e182]:
                      - /url: /sellers/profile/okorosamuel-store
                  - generic [ref=e184]: ₦2,000,000
                - generic [ref=e185]:
                  - generic [ref=e186]:
                    - generic [ref=e187]:
                      - button "Like" [ref=e188]
                      - button "1" [ref=e190]
                    - button "0" [ref=e191]:
                      - generic [ref=e193]: "0"
                    - generic [ref=e194]: "3"
                    - button [ref=e196]
                  - button [ref=e199]
            - generic [ref=e201]:
              - link "Explore all products" [ref=e202] [cursor=pointer]:
                - /url: /discover
                - text: Explore all products
              - paragraph [ref=e204]:
                - text: Or
                - link "browse market squares" [ref=e205] [cursor=pointer]:
                  - /url: /squares
                - text: — no account needed.
        - complementary [ref=e206]:
          - generic [ref=e207]:
            - tablist "Sidebar panels" [ref=e208]:
              - tab "Discover" [selected] [ref=e209] [cursor=pointer]:
                - generic [ref=e211]: Discover
              - tab "MarketX AI" [ref=e212] [cursor=pointer]:
                - generic [ref=e214]: MarketX AI
            - generic [ref=e216]:
              - generic [ref=e217]:
                - generic [ref=e218]:
                  - heading "Markets by category" [level=3] [ref=e219]
                  - link "All markets" [ref=e220] [cursor=pointer]:
                    - /url: /squares
                - link "NI Nigerian Heritage Artisans 0 traders · 0 goods" [ref=e222] [cursor=pointer]:
                  - /url: /squares/nigerian-heritage-artisans
                  - generic [ref=e223]: NI
                  - generic [ref=e224]:
                    - paragraph [ref=e225]: Nigerian Heritage Artisans
                    - paragraph [ref=e226]: 0 traders · 0 goods
              - generic [ref=e228]:
                - generic [ref=e229]:
                  - heading "Traders to discover" [level=3] [ref=e230]
                  - link "See all" [ref=e231] [cursor=pointer]:
                    - /url: /sellers
                - generic [ref=e232]:
                  - generic [ref=e233]:
                    - link "Hadronpower" [ref=e234] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                      - img "Hadronpower" [ref=e236]
                    - link "Hadronpower 3 followers" [ref=e237] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                      - paragraph [ref=e238]: Hadronpower
                      - paragraph [ref=e239]: 3 followers
                    - link "Follow" [ref=e240] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e241]:
                    - link "Starcollections" [ref=e242] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                      - img "Starcollections" [ref=e244]
                    - link "Starcollections 3 followers" [ref=e245] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                      - paragraph [ref=e246]: Starcollections
                      - paragraph [ref=e247]: 3 followers
                    - link "Follow" [ref=e248] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e249]:
                    - link "HausaCaps" [ref=e250] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - img "HausaCaps" [ref=e252]
                    - link "HausaCaps 3 followers" [ref=e253] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - paragraph [ref=e254]: HausaCaps
                      - paragraph [ref=e255]: 3 followers
                    - link "Follow" [ref=e256] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e257]:
                    - link "jordanshoes" [ref=e258] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                      - img "jordanshoes" [ref=e260]
                    - link "jordanshoes 2 followers" [ref=e261] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                      - paragraph [ref=e262]: jordanshoes
                      - paragraph [ref=e263]: 2 followers
                    - link "Follow" [ref=e264] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e265]:
                    - link "obed stor" [ref=e266] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                    - link "obed stor 2 followers" [ref=e269] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                      - paragraph [ref=e270]: obed stor
                      - paragraph [ref=e271]: 2 followers
                    - link "Follow" [ref=e272] [cursor=pointer]:
                      - /url: /user-login
              - generic [ref=e273]:
                - generic [ref=e274]:
                  - heading "Trending goods" [level=3] [ref=e275]
                  - link "See all" [ref=e276] [cursor=pointer]:
                    - /url: /discover?tab=products
                - generic [ref=e277]:
                  - link "Hausa Caps Hausa Caps HausaCaps ₦40,000" [ref=e278] [cursor=pointer]:
                    - /url: /product/hausa-caps
                    - img "Hausa Caps" [ref=e280]
                    - generic [ref=e281]:
                      - paragraph [ref=e282]: Hausa Caps
                      - paragraph [ref=e283]: HausaCaps
                    - paragraph [ref=e284]: ₦40,000
                  - link "house for sell house for sell obed stor ₦400,000,000" [ref=e285] [cursor=pointer]:
                    - /url: /product/house-for-sell
                    - img "house for sell" [ref=e287]
                    - generic [ref=e288]:
                      - paragraph [ref=e289]: house for sell
                      - paragraph [ref=e290]: obed stor
                    - paragraph [ref=e291]: ₦400,000,000
                  - link "Itel power pack panels Itel power pack panels Hadronpower ₦340,000" [ref=e292] [cursor=pointer]:
                    - /url: /product/itel-power-pack-panels
                    - img "Itel power pack panels" [ref=e294]
                    - generic [ref=e295]:
                      - paragraph [ref=e296]: Itel power pack panels
                      - paragraph [ref=e297]: Hadronpower
                    - paragraph [ref=e298]: ₦340,000
                  - link "iPhone 14PM 256GB iPhone 14PM 256GB Jprimexbossnaturestores ₦900,000" [ref=e299] [cursor=pointer]:
                    - /url: /product/iphone-14pm-256gb
                    - img "iPhone 14PM 256GB" [ref=e301]
                    - generic [ref=e302]:
                      - paragraph [ref=e303]: iPhone 14PM 256GB
                      - paragraph [ref=e304]: Jprimexbossnaturestores
                    - paragraph [ref=e305]: ₦900,000
                  - link "Ultimate Smartwatch with Health Features Ultimate Smartwatch with Health Features LegitShop ₦70,000" [ref=e306] [cursor=pointer]:
                    - /url: /product/ultimate-smartwatch-with-health-features
                    - img "Ultimate Smartwatch with Health Features" [ref=e308]
                    - generic [ref=e309]:
                      - paragraph [ref=e310]: Ultimate Smartwatch with Health Features
                      - paragraph [ref=e311]: LegitShop
                    - paragraph [ref=e312]: ₦70,000
              - generic [ref=e313]:
                - generic [ref=e314]:
                  - link "About" [ref=e315] [cursor=pointer]:
                    - /url: /about
                  - link "Help" [ref=e316] [cursor=pointer]:
                    - /url: /help
                  - link "Terms" [ref=e317] [cursor=pointer]:
                    - /url: /terms
                  - link "Privacy" [ref=e318] [cursor=pointer]:
                    - /url: /privacy
                  - link "Near Me" [ref=e319] [cursor=pointer]:
                    - /url: /map
                - paragraph [ref=e320]: © 2026 MarketX. All rights reserved.
  - generic:
    - img
  - generic [ref=e321]:
    - button "Toggle Nuxt DevTools" [ref=e322] [cursor=pointer]:
      - img [ref=e323]
    - generic "Page load time" [ref=e326]:
      - generic [ref=e327]: "235"
      - generic [ref=e328]: ms
    - button "Toggle Component Inspector" [ref=e330] [cursor=pointer]:
      - img [ref=e331]
```

# Test source

```ts
  1   | /**
  2   |  * Global navigation tests — desktop SideNav + mobile BottomNavMobile
  3   |  *
  4   |  * Desktop (1440×900): fixed left sidebar with Home, Discover, Reels, Squares.
  5   |  *   Near Me moved OUT of the rail and into the ☰ More popup (see MoreMenu.vue) —
  6   |  *   the rail holds primary destinations only, More holds app-level secondary ones.
  7   |  *   1440px puts us safely above the xl: breakpoint (1280px + ~17px scrollbar = ~1297px).
  8   |  * Mobile (390×844):   fixed bottom bar with Home, Near Me, Create, Squares, Profile.
  9   |  *
  10  |  * Locator strategy: scope to the `<aside class="fixed left-0">` sidebar or
  11  |  * `nav.bottom-nav` to avoid matching duplicate links in main content areas.
  12  |  */
  13  | import { test, expect } from '../../helpers/fixtures'
  14  | import { pageLogin } from '../../helpers/auth'
  15  | 
  16  | const T = { timeout: 15000 }
  17  | 
  18  | // Helpers
  19  | const sideNav = (page: any) => page.locator('aside.fixed.left-0')
  20  | const bottomNav = (page: any) => page.locator('nav.bottom-nav')
  21  | 
  22  | // ── DESKTOP SIDENAV ───────────────────────────────────────────────────────────
  23  | 
  24  | test.describe('desktop SideNav — guest', () => {
  25  |   test.use({ viewport: { width: 1440, height: 900 } })
  26  | 
  27  |   test.beforeEach(async ({ page }) => {
  28  |     // MinimalHome's autoplaying/looping video slides keep the network busy
  29  |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  30  |     // reaches 'networkidle'.
  31  |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  32  |   })
  33  | 
  34  |   test('sidebar is visible', async ({ page }) => {
  35  |     await expect(sideNav(page)).toBeVisible(T)
  36  |   })
  37  | 
  38  |   test('logo "MX" is visible inside sidebar', async ({ page }) => {
  39  |     await expect(sideNav(page).getByText('MX').first()).toBeVisible(T)
  40  |   })
  41  | 
  42  |   test('Home nav link is present', async ({ page }) => {
  43  |     await expect(
  44  |       sideNav(page).getByRole('link', { name: /^home$/i }),
  45  |     ).toBeVisible(T)
  46  |   })
  47  | 
  48  |   test('Discover nav link is present', async ({ page }) => {
  49  |     await expect(
  50  |       sideNav(page).getByRole('link', { name: /^discover$/i }),
  51  |     ).toBeVisible(T)
  52  |   })
  53  | 
  54  |   test('Reels nav link is present', async ({ page }) => {
  55  |     await expect(sideNav(page).locator('a[href="/reels"]')).toBeVisible(T)
  56  |   })
  57  | 
  58  |   test('More button is present for guests', async ({ page }) => {
  59  |     await expect(
  60  |       sideNav(page).locator('button[aria-label="More"]'),
  61  |     ).toBeVisible(T)
  62  |   })
  63  | 
  64  |   test('Squares nav link is present', async ({ page }) => {
  65  |     await expect(sideNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  66  |   })
  67  | 
  68  |   test('Discover link navigates to /discover', async ({ page }) => {
  69  |     await sideNav(page)
  70  |       .getByRole('link', { name: /^discover$/i })
  71  |       .click()
  72  |     await expect(page).toHaveURL('/discover', T)
  73  |   })
  74  | 
  75  |   test('Squares link navigates to /squares', async ({ page }) => {
  76  |     await sideNav(page).locator('a[href="/squares"]').click()
  77  |     await expect(page).toHaveURL('/squares', T)
  78  |   })
  79  | 
  80  |   test('Reels link navigates to /reels', async ({ page }) => {
> 81  |     await sideNav(page).locator('a[href="/reels"]').click()
      |                                                     ^ Error: locator.click: Test timeout of 60000ms exceeded.
  82  |     await expect(page).toHaveURL('/reels', T)
  83  |   })
  84  | 
  85  |   test('guest sees Create link pointing to /user-register', async ({
  86  |     page,
  87  |   }) => {
  88  |     await expect(sideNav(page).locator('a[href="/user-register"]')).toBeVisible(
  89  |       T,
  90  |     )
  91  |   })
  92  | })
  93  | 
  94  | // ── DESKTOP ☰ MORE MENU ───────────────────────────────────────────────────────
  95  | // Driven from /discover, not /. The home route renders SplashScreen as its
  96  | // ClientOnly fallback — a `fixed inset-0 z-[100]` overlay that swallows every
  97  | // click until hydration completes, which is also why the three pre-existing
  98  | // "link navigates to X" tests above fail. /discover hydrates normally, and the
  99  | // rail under test is identical on both routes.
  100 | test.describe('desktop SideNav — More menu (guest)', () => {
  101 |   test.use({ viewport: { width: 1440, height: 900 } })
  102 | 
  103 |   test.beforeEach(async ({ page }) => {
  104 |     await page.goto('/discover', { waitUntil: 'networkidle' })
  105 |   })
  106 | 
  107 |   test('Near Me is reachable from the More menu', async ({ page }) => {
  108 |     // Near Me lives in ☰ More now, not the rail. It must still be reachable by a
  109 |     // GUEST — that is the whole reason More renders for logged-out visitors.
  110 |     await expect(sideNav(page).locator('a[href="/map"]')).toHaveCount(0)
  111 |     await sideNav(page).locator('button[aria-label="More"]').click()
  112 |     await expect(sideNav(page).locator('a[href="/map"]')).toBeVisible(T)
  113 |   })
  114 | 
  115 |   test('Help is reachable from the More menu', async ({ page }) => {
  116 |     await sideNav(page).locator('button[aria-label="More"]').click()
  117 |     await expect(sideNav(page).locator('a[href="/help"]')).toBeVisible(T)
  118 |   })
  119 | 
  120 |   test('More menu navigates to /map', async ({ page }) => {
  121 |     await sideNav(page).locator('button[aria-label="More"]').click()
  122 |     await sideNav(page).locator('a[href="/map"]').click()
  123 |     await expect(page).toHaveURL('/map', T)
  124 |   })
  125 | })
  126 | 
  127 | test.describe('desktop SideNav — active state', () => {
  128 |   test.use({ viewport: { width: 1440, height: 900 } })
  129 | 
  130 |   test('Home link has active class when on /', async ({ page }) => {
  131 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  132 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  133 |     // reaches 'networkidle'.
  134 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  135 |     // Two a[href="/"] exist: logo + nav-button. Target only the nav-button.
  136 |     await expect(sideNav(page).locator('a.nav-button[href="/"]')).toHaveClass(
  137 |       /active/,
  138 |       T,
  139 |     )
  140 |   })
  141 | 
  142 |   test('Discover link has active class when on /discover', async ({ page }) => {
  143 |     await page.goto('/discover', { waitUntil: 'networkidle' })
  144 |     await expect(sideNav(page).locator('a[href="/discover"]')).toHaveClass(
  145 |       /active/,
  146 |       T,
  147 |     )
  148 |   })
  149 | 
  150 |   test('Squares link has active class when on /squares', async ({ page }) => {
  151 |     await page.goto('/squares', { waitUntil: 'networkidle' })
  152 |     await expect(sideNav(page).locator('a[href="/squares"]')).toHaveClass(
  153 |       /active/,
  154 |       T,
  155 |     )
  156 |   })
  157 | })
  158 | 
  159 | // ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────────────
  160 | 
  161 | test.describe('mobile BottomNav — guest', () => {
  162 |   test.use({ viewport: { width: 390, height: 844 } })
  163 | 
  164 |   test.beforeEach(async ({ page }) => {
  165 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  166 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  167 |     // reaches 'networkidle'.
  168 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  169 |   })
  170 | 
  171 |   test('bottom nav bar is visible', async ({ page }) => {
  172 |     await expect(bottomNav(page)).toBeVisible(T)
  173 |   })
  174 | 
  175 |   test('Home icon link is present in bottom nav', async ({ page }) => {
  176 |     await expect(bottomNav(page).locator('a[href="/"]')).toBeVisible(T)
  177 |   })
  178 | 
  179 |   test('Near Me icon link is present in bottom nav', async ({ page }) => {
  180 |     await expect(bottomNav(page).locator('a[href="/map"]')).toBeVisible(T)
  181 |   })
```