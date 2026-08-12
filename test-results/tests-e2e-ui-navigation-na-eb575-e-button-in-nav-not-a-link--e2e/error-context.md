# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\ui\navigation.spec.ts >> navigation — authenticated differences >> authenticated user sees Create <button> in nav (not a link)
- Location: tests\e2e\ui\navigation.spec.ts:270:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('aside.fixed.left-0').locator('button').filter({ hasText: /create/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('aside.fixed.left-0').locator('button').filter({ hasText: /create/i })

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
                  - heading "Turn social discoveries into safe purchases." [level=1]:
                    - generic: Turn social discoveries into safe purchases.
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
      - generic [ref=e327]: "139"
      - generic [ref=e328]: ms
    - button "Toggle Component Inspector" [ref=e330] [cursor=pointer]:
      - img [ref=e331]
```

# Test source

```ts
  184 |     await expect(bottomNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  185 |   })
  186 | 
  187 |   test('guest sees "Start selling" CTA in bottom nav (goes to /user-register)', async ({
  188 |     page,
  189 |   }) => {
  190 |     await expect(
  191 |       bottomNav(page).locator('a[href="/user-register"]'),
  192 |     ).toBeVisible(T)
  193 |   })
  194 | })
  195 | 
  196 | // ── MOBILE HEADER — aria-labels ──────────────────────────────────────────────
  197 | 
  198 | test.describe('mobile header — aria-labels', () => {
  199 |   test.use({ viewport: { width: 390, height: 844 } })
  200 | 
  201 |   test.beforeEach(async ({ page }) => {
  202 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  203 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  204 |     // reaches 'networkidle'.
  205 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  206 |   })
  207 | 
  208 |   test('Cart button has aria-label="Cart"', async ({ page }) => {
  209 |     await expect(page.locator('button[aria-label="Cart"]')).toBeVisible(T)
  210 |   })
  211 | 
  212 |   test('Search control has aria-label="Search"', async ({ page }) => {
  213 |     await expect(page.locator('[aria-label="Search"]')).toBeVisible(T)
  214 |   })
  215 | 
  216 |   test('guest sees a Sign in CTA in the mobile header', async ({ page }) => {
  217 |     const header = page.locator('header.mobile-header')
  218 |     await expect(header.getByRole('link', { name: /sign in/i })).toBeVisible(T)
  219 |   })
  220 | })
  221 | 
  222 | // ── MOBILE BOTTOM NAV — aria-labels ──────────────────────────────────────────
  223 | 
  224 | test.describe('mobile BottomNav — aria-labels', () => {
  225 |   test.use({ viewport: { width: 390, height: 844 } })
  226 | 
  227 |   test.beforeEach(async ({ page }) => {
  228 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  229 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  230 |     // reaches 'networkidle'.
  231 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  232 |   })
  233 | 
  234 |   test('Home link has aria-label="Home"', async ({ page }) => {
  235 |     await expect(bottomNav(page).locator('[aria-label="Home"]')).toBeVisible(T)
  236 |   })
  237 | 
  238 |   test('Near Me link has aria-label="Near Me"', async ({ page }) => {
  239 |     await expect(bottomNav(page).locator('[aria-label="Near Me"]')).toBeVisible(
  240 |       T,
  241 |     )
  242 |   })
  243 | 
  244 |   test('Squares link has aria-label="Squares"', async ({ page }) => {
  245 |     await expect(bottomNav(page).locator('[aria-label="Squares"]')).toBeVisible(
  246 |       T,
  247 |     )
  248 |   })
  249 | 
  250 |   test('guest: Create link has aria-label="Start selling"', async ({
  251 |     page,
  252 |   }) => {
  253 |     await expect(
  254 |       bottomNav(page).locator('[aria-label="Start selling"]'),
  255 |     ).toBeVisible(T)
  256 |   })
  257 | 
  258 |   test('guest: Sign in link has aria-label="Sign in"', async ({ page }) => {
  259 |     await expect(bottomNav(page).locator('[aria-label="Sign in"]')).toBeVisible(
  260 |       T,
  261 |     )
  262 |   })
  263 | })
  264 | 
  265 | // ── AUTH STATE DIFFERENCES ────────────────────────────────────────────────────
  266 | 
  267 | test.describe('navigation — authenticated differences', () => {
  268 |   test.use({ viewport: { width: 1440, height: 900 } })
  269 | 
  270 |   test('authenticated user sees Create <button> in nav (not a link)', async ({
  271 |     page,
  272 |     request,
  273 |   }) => {
  274 |     await pageLogin(page, request)
  275 |     // SSE/Pusher connections on authenticated home never reach networkidle
  276 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  277 |     // Logged-in Create is a <button> that opens a modal, not an <a href="/user-register">
  278 |     await expect(
  279 |       sideNav(page).locator('a[href="/user-register"]'),
  280 |     ).not.toBeVisible()
  281 |     const createBtn = sideNav(page)
  282 |       .locator('button')
  283 |       .filter({ hasText: /create/i })
> 284 |     await expect(createBtn).toBeVisible(T)
      |                             ^ Error: expect(locator).toBeVisible() failed
  285 |   })
  286 | })
  287 | 
  288 | // ── PAGE META / SEO ───────────────────────────────────────────────────────────
  289 | 
  290 | test.describe('page meta tags', () => {
  291 |   for (const { route, label } of [
  292 |     { route: '/', label: 'home' },
  293 |     { route: '/discover', label: 'discover' },
  294 |     { route: '/squares', label: 'squares' },
  295 |   ]) {
  296 |     test(`${label} page has a non-empty <title>`, async ({ page }) => {
  297 |       // Home's MinimalHome video slides never reach 'networkidle'; the other
  298 |       // two routes are fine with it.
  299 |       await page.goto(route, {
  300 |         waitUntil: route === '/' ? 'domcontentloaded' : 'networkidle',
  301 |       })
  302 |       const title = await page.title()
  303 |       expect(title.trim().length).toBeGreaterThan(0)
  304 |     })
  305 |   }
  306 | 
  307 |   test('home page has meta description', async ({ page }) => {
  308 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  309 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  310 |     // reaches 'networkidle'.
  311 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  312 |     const content = await page
  313 |       .locator('meta[name="description"]')
  314 |       .getAttribute('content')
  315 |     expect(content?.trim().length ?? 0).toBeGreaterThan(0)
  316 |   })
  317 | })
  318 | 
  319 | // ── VISUAL SNAPSHOTS ──────────────────────────────────────────────────────────
  320 | 
  321 | // NOTE: after the TrustMarketHome/SocialFeed → MinimalHome default-home
  322 | // switch, both baselines below must be regenerated — run with --update-snapshots.
  323 | 
  324 | test('desktop SideNav — visual snapshot', async ({ page }) => {
  325 |   await page.setViewportSize({ width: 1440, height: 900 })
  326 |   await page.goto('/', { waitUntil: 'domcontentloaded' })
  327 |   await expect(
  328 |     page.getByRole('button', { name: /search or verify a seller/i }),
  329 |   ).toBeVisible({ timeout: 30000 })
  330 |   const box = await sideNav(page).boundingBox()
  331 |   await expect(page).toHaveScreenshot('desktop-sidenav.png', {
  332 |     maxDiffPixelRatio: 0.05,
  333 |     clip: box ?? undefined,
  334 |   })
  335 | })
  336 | 
  337 | test('mobile BottomNav — visual snapshot', async ({ page }) => {
  338 |   await page.setViewportSize({ width: 390, height: 844 })
  339 |   await page.goto('/', { waitUntil: 'domcontentloaded' })
  340 |   await expect(
  341 |     page.getByRole('button', { name: /search or verify a seller/i }),
  342 |   ).toBeVisible({ timeout: 30000 })
  343 |   const box = await bottomNav(page).boundingBox()
  344 |   await expect(page).toHaveScreenshot('mobile-bottomnav.png', {
  345 |     maxDiffPixelRatio: 0.05,
  346 |     clip: box ?? undefined,
  347 |   })
  348 | })
  349 | 
```