# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\ui\navigation.spec.ts >> mobile BottomNav — aria-labels >> guest: Create link has aria-label="Start selling"
- Location: tests\e2e\ui\navigation.spec.ts:250:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav.bottom-nav').locator('[aria-label="Start selling"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('nav.bottom-nav').locator('[aria-label="Start selling"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - link "MarketX" [ref=e7] [cursor=pointer]:
          - /url: /
          - img "MarketX" [ref=e8]
        - generic [ref=e13]:
          - button "Search" [ref=e14] [cursor=pointer]
          - button "Cart" [ref=e16] [cursor=pointer]
          - link "Sign In" [ref=e19] [cursor=pointer]:
            - /url: /user-login
    - generic [ref=e20]:
      - main [ref=e21]:
        - generic [ref=e25]:
          - generic [ref=e30]:
            - heading "Turn social discoveries into safe purchases." [level=1] [ref=e31]:
              - generic [ref=e32]: Turn social discoveries into safe purchases.
            - generic [ref=e35]:
              - tablist "Find or verify a seller" [ref=e36]:
                - tab "Find a seller" [selected] [ref=e37] [cursor=pointer]: Find a seller
                - tab "Verify any seller" [ref=e39] [cursor=pointer]: Verify any seller
              - generic [ref=e41]:
                - generic [ref=e43]: Search sellers, products or markets
                - textbox "Search sellers, products or markets" [ref=e44]:
                  - /placeholder: Search sellers, products or markets…
                - button "Search" [ref=e45] [cursor=pointer]
            - generic [ref=e46]:
              - link "Log in" [ref=e47] [cursor=pointer]:
                - /url: /user-login
              - generic [ref=e48]: ·
              - link "Start selling" [ref=e49] [cursor=pointer]:
                - /url: /sellers/create
            - generic [ref=e50]:
              - generic [ref=e53]: Verified Sellers
              - generic [ref=e56]: Escrow Protected
          - generic [ref=e58]:
            - img "Itel 5 watt charger" [ref=e61]
            - generic [ref=e62]:
              - link "Hadronpower" [ref=e63] [cursor=pointer]:
                - /url: /sellers/profile/hadronpower
                - img "Hadronpower" [ref=e64]
              - button "0" [ref=e65] [cursor=pointer]:
                - generic [ref=e68]: "0"
              - button "0" [ref=e69] [cursor=pointer]:
                - generic [ref=e72]: "0"
              - button "0" [ref=e73] [cursor=pointer]:
                - generic [ref=e76]: "0"
              - button "View seller's Trust Card" [ref=e77] [cursor=pointer]:
                - generic [ref=e80]: Tier 3
            - generic [ref=e81]:
              - generic [ref=e82]:
                - link "Hadronpower" [ref=e83] [cursor=pointer]:
                  - /url: /sellers/profile/hadronpower
                - generic [ref=e84]: Product
              - paragraph [ref=e85]: Itel 5 watt charger
              - link "Shop Now • ₦4,000" [ref=e86] [cursor=pointer]:
                - /url: /product/itel-5-watt-charger
                - text: Shop Now • ₦4,000
          - generic [ref=e90]:
            - paragraph [ref=e92]: Wireless Bluetooth Earbuds
            - generic [ref=e93]:
              - link "MarketX Demo Store" [ref=e94] [cursor=pointer]:
                - /url: /sellers/profile/tiktok-review-store
                - img "MarketX Demo Store" [ref=e95]
              - button "0" [ref=e96] [cursor=pointer]:
                - generic [ref=e99]: "0"
              - button "0" [ref=e100] [cursor=pointer]:
                - generic [ref=e103]: "0"
              - button "0" [ref=e104] [cursor=pointer]:
                - generic [ref=e107]: "0"
              - button "View seller's Trust Card" [ref=e108] [cursor=pointer]:
                - generic [ref=e111]: Trust
            - generic [ref=e112]:
              - generic [ref=e113]:
                - link "MarketX Demo Store" [ref=e114] [cursor=pointer]:
                  - /url: /sellers/profile/tiktok-review-store
                - generic [ref=e115]: Product
              - link "Shop Now • ₦22,000" [ref=e116] [cursor=pointer]:
                - /url: /product/wireless-bluetooth-earbuds
                - text: Shop Now • ₦22,000
          - generic [ref=e120]:
            - paragraph [ref=e122]: Handwoven Ankara Tote Bag
            - generic [ref=e123]:
              - link "MarketX Demo Store" [ref=e124] [cursor=pointer]:
                - /url: /sellers/profile/tiktok-review-store
                - img "MarketX Demo Store" [ref=e125]
              - button "0" [ref=e126] [cursor=pointer]:
                - generic [ref=e129]: "0"
              - button "0" [ref=e130] [cursor=pointer]:
                - generic [ref=e133]: "0"
              - button "0" [ref=e134] [cursor=pointer]:
                - generic [ref=e137]: "0"
              - button "View seller's Trust Card" [ref=e138] [cursor=pointer]:
                - generic [ref=e141]: Trust
            - generic [ref=e142]:
              - generic [ref=e143]:
                - link "MarketX Demo Store" [ref=e144] [cursor=pointer]:
                  - /url: /sellers/profile/tiktok-review-store
                - generic [ref=e145]: Product
              - link "Shop Now • ₦15,000" [ref=e146] [cursor=pointer]:
                - /url: /product/handwoven-ankara-tote-bag
                - text: Shop Now • ₦15,000
          - generic [ref=e150]:
            - img "Itel power pack panels" [ref=e153]
            - generic [ref=e154]:
              - link "Hadronpower" [ref=e155] [cursor=pointer]:
                - /url: /sellers/profile/hadronpower
                - img "Hadronpower" [ref=e156]
              - button "1" [ref=e157] [cursor=pointer]:
                - generic [ref=e160]: "1"
              - button "0" [ref=e161] [cursor=pointer]:
                - generic [ref=e164]: "0"
              - button "0" [ref=e165] [cursor=pointer]:
                - generic [ref=e168]: "0"
              - button "View seller's Trust Card" [ref=e169] [cursor=pointer]:
                - generic [ref=e172]: Tier 3
            - generic [ref=e173]:
              - generic [ref=e174]:
                - link "Hadronpower" [ref=e175] [cursor=pointer]:
                  - /url: /sellers/profile/hadronpower
                - generic [ref=e176]: Product
              - paragraph [ref=e177]: Itel power pack panels
              - link "Shop Now • ₦340,000" [ref=e178] [cursor=pointer]:
                - /url: /product/itel-power-pack-panels
                - text: Shop Now • ₦340,000
          - generic [ref=e182]:
            - generic [ref=e183]:
              - paragraph [ref=e184]: Local markets, online
              - heading "Step into a Square" [level=2] [ref=e185]
              - paragraph [ref=e186]: Communities of traders organised the way Nigeria's physical markets work.
            - generic [ref=e187]:
              - article [ref=e188]:
                - link "View Balogun Market Square market square" [ref=e189] [cursor=pointer]:
                  - /url: /squares/balogun-market-lagos
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: BA
                - generic [ref=e190]:
                  - heading "Balogun Market Square" [level=3] [ref=e191]
                  - paragraph [ref=e192]: Lagos Island, Lagos
                  - generic [ref=e195]: Explore market
              - article [ref=e197]:
                - link "View Bodija Market Square market square" [ref=e198] [cursor=pointer]:
                  - /url: /squares/bodija-market-ibadan
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: BO
                - generic [ref=e199]:
                  - heading "Bodija Market Square" [level=3] [ref=e200]
                  - paragraph [ref=e201]: Ibadan, Oyo
                  - generic [ref=e204]: Explore market
              - article [ref=e206]:
                - link "View Hamaz Shopping Complex market square" [ref=e207] [cursor=pointer]:
                  - /url: /squares/hamaz-complex-jos
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: HA
                - generic [ref=e208]:
                  - heading "Hamaz Shopping Complex" [level=3] [ref=e209]
                  - paragraph [ref=e210]: Jos, Plateau
                  - generic [ref=e212]:
                    - generic [ref=e213]: 1 traders
                    - generic [ref=e215]: · 2 goods
                    - generic [ref=e216]: Visit
              - article [ref=e218]:
                - link "View Computer Village Square market square" [ref=e219] [cursor=pointer]:
                  - /url: /squares/computer-village-ikeja
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: CO
                - generic [ref=e220]:
                  - heading "Computer Village Square" [level=3] [ref=e221]
                  - paragraph [ref=e222]: Ikeja, Lagos
                  - generic [ref=e225]: Explore market
              - article [ref=e227]:
                - link "View Yola Central Market Complex market square" [ref=e228] [cursor=pointer]:
                  - /url: /squares/yola-central-market
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: YO
                - generic [ref=e229]:
                  - heading "Yola Central Market Complex" [level=3] [ref=e230]
                  - paragraph [ref=e231]: Yola, Adamawa
                  - generic [ref=e234]: Explore market
              - article [ref=e236]:
                - link "View Wuse Market Abuja market square" [ref=e237] [cursor=pointer]:
                  - /url: /squares/wuse-market-abuja
                - generic:
                  - generic: Market
                - generic:
                  - generic:
                    - generic: WU
                - generic [ref=e238]:
                  - heading "Wuse Market Abuja" [level=3] [ref=e239]
                  - paragraph [ref=e240]: Abuja, FCT
                  - generic [ref=e243]: Explore market
            - link "Explore all Squares" [ref=e245] [cursor=pointer]:
              - /url: /squares
              - text: Explore all Squares
          - generic [ref=e248]:
            - img "Ultimate Smartwatch with Health Features" [ref=e251]
            - generic [ref=e252]:
              - link "LegitShop" [ref=e253] [cursor=pointer]:
                - /url: /sellers/profile/legitshop
                - img "LegitShop" [ref=e254]
              - button "1" [ref=e255] [cursor=pointer]:
                - generic [ref=e258]: "1"
              - button "0" [ref=e259] [cursor=pointer]:
                - generic [ref=e262]: "0"
              - button "0" [ref=e263] [cursor=pointer]:
                - generic [ref=e266]: "0"
              - button "View seller's Trust Card" [ref=e267] [cursor=pointer]:
                - generic [ref=e270]: Trust
            - generic [ref=e271]:
              - generic [ref=e272]:
                - link "LegitShop" [ref=e273] [cursor=pointer]:
                  - /url: /sellers/profile/legitshop
                - generic [ref=e274]: Product
              - paragraph [ref=e275]: Ultimate Smartwatch with Health Features
              - link "Shop Now • ₦70,000" [ref=e276] [cursor=pointer]:
                - /url: /product/ultimate-smartwatch-with-health-features
                - text: Shop Now • ₦70,000
          - generic [ref=e280]:
            - img "Antimony ore" [ref=e283]
            - generic [ref=e284]:
              - link "OkoroSamuel store" [ref=e285] [cursor=pointer]:
                - /url: /sellers/profile/okorosamuel-store
                - img "OkoroSamuel store" [ref=e286]
              - button "1" [ref=e287] [cursor=pointer]:
                - generic [ref=e290]: "1"
              - button "0" [ref=e291] [cursor=pointer]:
                - generic [ref=e294]: "0"
              - button "0" [ref=e295] [cursor=pointer]:
                - generic [ref=e298]: "0"
              - button "View seller's Trust Card" [ref=e299] [cursor=pointer]:
                - generic [ref=e302]: Trust
            - generic [ref=e303]:
              - generic [ref=e304]:
                - link "OkoroSamuel store" [ref=e305] [cursor=pointer]:
                  - /url: /sellers/profile/okorosamuel-store
                - generic [ref=e306]: Product
              - paragraph [ref=e307]: Antimony ore
              - link "Shop Now • ₦2,000,000" [ref=e308] [cursor=pointer]:
                - /url: /product/antimony-ore
                - text: Shop Now • ₦2,000,000
          - generic [ref=e312]:
            - img "iPhone 14PM 256GB" [ref=e315]
            - generic [ref=e316]:
              - link "Jprimexbossnaturestores" [ref=e317] [cursor=pointer]:
                - /url: /sellers/profile/jprimexbossnaturegadgets
                - img "Jprimexbossnaturestores" [ref=e318]
              - button "1" [ref=e319] [cursor=pointer]:
                - generic [ref=e322]: "1"
              - button "0" [ref=e323] [cursor=pointer]:
                - generic [ref=e326]: "0"
              - button "0" [ref=e327] [cursor=pointer]:
                - generic [ref=e330]: "0"
              - button "View seller's Trust Card" [ref=e331] [cursor=pointer]:
                - generic [ref=e334]: Trust
            - generic [ref=e335]:
              - generic [ref=e336]:
                - link "Jprimexbossnaturestores" [ref=e337] [cursor=pointer]:
                  - /url: /sellers/profile/jprimexbossnaturegadgets
                - generic [ref=e338]: Product
              - paragraph [ref=e339]: iPhone 14PM 256GB
              - link "Shop Now • ₦900,000" [ref=e340] [cursor=pointer]:
                - /url: /product/iphone-14pm-256gb
                - text: Shop Now • ₦900,000
          - generic [ref=e344]:
            - img "house for sell" [ref=e347]
            - generic [ref=e348]:
              - link "obed stor" [ref=e349] [cursor=pointer]:
                - /url: /sellers/profile/obed
                - img "obed stor" [ref=e350]
              - button "1" [ref=e351] [cursor=pointer]:
                - generic [ref=e354]: "1"
              - button "0" [ref=e355] [cursor=pointer]:
                - generic [ref=e358]: "0"
              - button "0" [ref=e359] [cursor=pointer]:
                - generic [ref=e362]: "0"
              - button "View seller's Trust Card" [ref=e363] [cursor=pointer]:
                - generic [ref=e366]: Trust
            - generic [ref=e367]:
              - generic [ref=e368]:
                - link "obed stor" [ref=e369] [cursor=pointer]:
                  - /url: /sellers/profile/obed
                - generic [ref=e370]: Product
              - paragraph [ref=e371]: house for sell
              - link "Shop Now • ₦400,000,000" [ref=e372] [cursor=pointer]:
                - /url: /product/house-for-sell
                - text: Shop Now • ₦400,000,000
          - generic [ref=e376]:
            - generic [ref=e380]:
              - link "HausaCaps" [ref=e381] [cursor=pointer]:
                - /url: /sellers/profile/hausacaps
                - img "HausaCaps" [ref=e382]
              - button "2" [ref=e383] [cursor=pointer]:
                - generic [ref=e386]: "2"
              - button "0" [ref=e387] [cursor=pointer]:
                - generic [ref=e390]: "0"
              - button "0" [ref=e391] [cursor=pointer]:
                - generic [ref=e394]: "0"
              - button "View seller's Trust Card" [ref=e395] [cursor=pointer]:
                - generic [ref=e398]: Trust
            - generic [ref=e399]:
              - generic [ref=e400]:
                - link "HausaCaps" [ref=e401] [cursor=pointer]:
                  - /url: /sellers/profile/hausacaps
                - generic [ref=e402]: Product
              - paragraph [ref=e403]: Hausa Caps
              - link "Shop Now • ₦40,000" [ref=e404] [cursor=pointer]:
                - /url: /product/hausa-caps
                - text: Shop Now • ₦40,000
          - generic [ref=e408]:
            - img "Versatile Solar-Powered Stand Fan with Remote" [ref=e411]
            - generic [ref=e412]:
              - link "Makintech" [ref=e413] [cursor=pointer]:
                - /url: /sellers/profile/makintech
                - img "Makintech" [ref=e414]
              - button "1" [ref=e415] [cursor=pointer]:
                - generic [ref=e418]: "1"
              - button "0" [ref=e419] [cursor=pointer]:
                - generic [ref=e422]: "0"
              - button "0" [ref=e423] [cursor=pointer]:
                - generic [ref=e426]: "0"
              - button "View seller's Trust Card" [ref=e427] [cursor=pointer]:
                - generic [ref=e430]: Trust
            - generic [ref=e431]:
              - generic [ref=e432]:
                - link "Makintech" [ref=e433] [cursor=pointer]:
                  - /url: /sellers/profile/makintech
                - generic [ref=e434]: Product
              - paragraph [ref=e435]: Versatile Solar-Powered Stand Fan with Remote
              - link "Shop Now • ₦80,000" [ref=e436] [cursor=pointer]:
                - /url: /product/versatile-solar-powered-stand-fan-with-remote
                - text: Shop Now • ₦80,000
          - generic [ref=e440]:
            - img "Vibrant Geometric Ankara Fabric" [ref=e443]
            - generic [ref=e444]:
              - link "Hadaz stores" [ref=e445] [cursor=pointer]:
                - /url: /sellers/profile/hadazstores
                - img "Hadaz stores" [ref=e446]
              - button "0" [ref=e447] [cursor=pointer]:
                - generic [ref=e450]: "0"
              - button "0" [ref=e451] [cursor=pointer]:
                - generic [ref=e454]: "0"
              - button "0" [ref=e455] [cursor=pointer]:
                - generic [ref=e458]: "0"
              - button "View seller's Trust Card" [ref=e459] [cursor=pointer]:
                - generic [ref=e462]: Trust
            - generic [ref=e463]:
              - generic [ref=e464]:
                - link "Hadaz stores" [ref=e465] [cursor=pointer]:
                  - /url: /sellers/profile/hadazstores
                - generic [ref=e466]: Product
              - paragraph [ref=e467]: Vibrant Geometric Ankara Fabric
              - link "Shop Now • ₦7,500" [ref=e468] [cursor=pointer]:
                - /url: /product/vibrant-geometric-ankara-fabric
                - text: Shop Now • ₦7,500
          - generic [ref=e472]:
            - img "Corporate Elegant Yellow Ankara Print Dress" [ref=e475]
            - generic [ref=e476]:
              - link "Starcollections" [ref=e477] [cursor=pointer]:
                - /url: /sellers/profile/starcollections
                - img "Starcollections" [ref=e478]
              - button "0" [ref=e479] [cursor=pointer]:
                - generic [ref=e482]: "0"
              - button "0" [ref=e483] [cursor=pointer]:
                - generic [ref=e486]: "0"
              - button "0" [ref=e487] [cursor=pointer]:
                - generic [ref=e490]: "0"
              - button "View seller's Trust Card" [ref=e491] [cursor=pointer]:
                - generic [ref=e494]: Trust
            - generic [ref=e495]:
              - generic [ref=e496]:
                - link "Starcollections" [ref=e497] [cursor=pointer]:
                  - /url: /sellers/profile/starcollections
                - generic [ref=e498]: Product
              - paragraph [ref=e499]: Corporate Elegant Yellow Ankara Print Dress
              - link "Shop Now • ₦20,000" [ref=e500] [cursor=pointer]:
                - /url: /product/corporate-elegant-yellow-ankara-print-dress
                - text: Shop Now • ₦20,000
      - navigation [ref=e503]:
        - generic [ref=e504]:
          - link "Home" [ref=e505] [cursor=pointer]:
            - /url: /
          - link "Discover" [ref=e507] [cursor=pointer]:
            - /url: /discover
          - link "Near Me" [ref=e509] [cursor=pointer]:
            - /url: /map
          - link "Squares" [ref=e511] [cursor=pointer]:
            - /url: /squares
          - link "Sign in" [ref=e513] [cursor=pointer]:
            - /url: /user-login
      - button "Messages & AI" [ref=e515] [cursor=pointer]
  - generic:
    - img
  - generic [ref=e517]:
    - button "Toggle Nuxt DevTools" [ref=e518] [cursor=pointer]:
      - img [ref=e519]
    - generic "Page load time" [ref=e522]:
      - generic [ref=e523]: "177"
      - generic [ref=e524]: ms
    - button "Toggle Component Inspector" [ref=e526] [cursor=pointer]:
      - img [ref=e527]
```

# Test source

```ts
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
  182 | 
  183 |   test('Squares icon link is present in bottom nav', async ({ page }) => {
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
> 255 |     ).toBeVisible(T)
      |       ^ Error: expect(locator).toBeVisible() failed
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
  284 |     await expect(createBtn).toBeVisible(T)
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