# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\feed\homefeed.spec.ts >> guest home — visual snapshot
- Location: tests\e2e\feed\homefeed.spec.ts:163:1

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  423744 pixels (ratio 0.46 of all image pixels) are different.

  Snapshot: home-guest.png

Call log:
  - Expect "toHaveScreenshot(home-guest.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 423744 pixels (ratio 0.46 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 423744 pixels (ratio 0.46 of all image pixels) are different.

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
        - generic [ref=e13]:
          - navigation [ref=e14]:
            - link "Home" [ref=e15] [cursor=pointer]:
              - /url: /
              - generic [ref=e17]: Home
            - link "Discover" [ref=e18] [cursor=pointer]:
              - /url: /discover
              - generic [ref=e20]: Discover
            - link "Reels" [ref=e21] [cursor=pointer]:
              - /url: /reels
              - generic [ref=e23]: Reels
            - link "Near Me" [ref=e24] [cursor=pointer]:
              - /url: /map
              - generic [ref=e26]: Near Me
            - link "Squares" [ref=e27] [cursor=pointer]:
              - /url: /squares
              - generic [ref=e29]: Squares
          - navigation [ref=e30]:
            - link "Create" [ref=e31] [cursor=pointer]:
              - /url: /user-register
              - generic [ref=e33]: Create
            - button "Cart" [ref=e34] [cursor=pointer]:
              - generic [ref=e37]: Cart
        - link "Sign In" [ref=e39] [cursor=pointer]:
          - /url: /user-login
          - generic [ref=e41]: Sign In
    - main [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]:
          - generic:
            - generic:
              - generic [ref=e45]:
                - button "Search or verify a seller" [ref=e46] [cursor=pointer]
                - generic [ref=e48]:
                  - button "For You" [ref=e49] [cursor=pointer]
                  - button "Trending" [ref=e50] [cursor=pointer]
                  - button "Deals" [ref=e51] [cursor=pointer]
              - generic [ref=e52]:
                - generic [ref=e54]:
                  - generic [ref=e57]:
                    - link [ref=e58] [cursor=pointer]:
                      - /url: /profile/OkoroSamuel
                    - button "0" [ref=e59] [cursor=pointer]:
                      - generic [ref=e62]: "0"
                    - button "0" [ref=e63] [cursor=pointer]:
                      - generic [ref=e66]: "0"
                    - button "0" [ref=e67] [cursor=pointer]:
                      - generic [ref=e70]: "0"
                  - link "@OkoroSamuel" [ref=e73] [cursor=pointer]:
                    - /url: /profile/OkoroSamuel
                - generic [ref=e75]:
                  - generic [ref=e76]:
                    - link [ref=e77] [cursor=pointer]:
                      - /url: /sellers/profile/imakwam
                    - button "0" [ref=e78] [cursor=pointer]:
                      - generic [ref=e81]: "0"
                    - button "0" [ref=e82] [cursor=pointer]:
                      - generic [ref=e85]: "0"
                    - button "0" [ref=e86] [cursor=pointer]:
                      - generic [ref=e89]: "0"
                  - link "@imakwam" [ref=e92] [cursor=pointer]:
                    - /url: /sellers/profile/imakwam
                - generic [ref=e94]:
                  - generic [ref=e97]:
                    - link [ref=e98] [cursor=pointer]:
                      - /url: /sellers/profile/obedjoseph
                    - button "0" [ref=e99] [cursor=pointer]:
                      - generic [ref=e102]: "0"
                    - button "0" [ref=e103] [cursor=pointer]:
                      - generic [ref=e106]: "0"
                    - button "0" [ref=e107] [cursor=pointer]:
                      - generic [ref=e110]: "0"
                  - link "@obedjoseph" [ref=e113] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                - generic [ref=e115]:
                  - generic [ref=e118]:
                    - link [ref=e119] [cursor=pointer]:
                      - /url: /sellers/profile/obedjoseph
                    - button "0" [ref=e120] [cursor=pointer]:
                      - generic [ref=e123]: "0"
                    - button "0" [ref=e124] [cursor=pointer]:
                      - generic [ref=e127]: "0"
                    - button "0" [ref=e128] [cursor=pointer]:
                      - generic [ref=e131]: "0"
                  - link "@obedjoseph" [ref=e134] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                - generic [ref=e136]:
                  - generic [ref=e137]:
                    - paragraph [ref=e138]: Local markets, online
                    - heading "Step into a Square" [level=2] [ref=e139]
                    - paragraph [ref=e140]: Communities of traders organised the way Nigeria's physical markets work.
                  - generic [ref=e141]:
                    - article [ref=e142]:
                      - link "View Balogun Market Square market square" [ref=e143] [cursor=pointer]:
                        - /url: /squares/balogun-market-lagos
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: BA
                      - generic [ref=e144]:
                        - heading "Balogun Market Square" [level=3] [ref=e145]
                        - paragraph [ref=e146]: Lagos Island, Lagos
                        - generic [ref=e148]:
                          - generic [ref=e149]: 0 traders
                          - generic [ref=e151]: · 0 goods
                          - generic [ref=e152]: Visit
                    - article [ref=e154]:
                      - link "View Bodija Market Square market square" [ref=e155] [cursor=pointer]:
                        - /url: /squares/bodija-market-ibadan
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: BO
                      - generic [ref=e156]:
                        - heading "Bodija Market Square" [level=3] [ref=e157]
                        - paragraph [ref=e158]: Ibadan, Oyo
                        - generic [ref=e160]:
                          - generic [ref=e161]: 0 traders
                          - generic [ref=e163]: · 0 goods
                          - generic [ref=e164]: Visit
                    - article [ref=e166]:
                      - link "View Hamaz Shopping Complex market square" [ref=e167] [cursor=pointer]:
                        - /url: /squares/hamaz-complex-jos
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: HA
                      - generic [ref=e168]:
                        - heading "Hamaz Shopping Complex" [level=3] [ref=e169]
                        - paragraph [ref=e170]: Jos, Plateau
                        - generic [ref=e172]:
                          - generic [ref=e173]: 1 traders
                          - generic [ref=e175]: · 0 goods
                          - generic [ref=e176]: Visit
                    - article [ref=e178]:
                      - link "View Computer Village Square market square" [ref=e179] [cursor=pointer]:
                        - /url: /squares/computer-village-ikeja
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: CO
                      - generic [ref=e180]:
                        - heading "Computer Village Square" [level=3] [ref=e181]
                        - paragraph [ref=e182]: Ikeja, Lagos
                        - generic [ref=e184]:
                          - generic [ref=e185]: 0 traders
                          - generic [ref=e187]: · 0 goods
                          - generic [ref=e188]: Visit
                    - article [ref=e190]:
                      - link "View Yola Central Market Complex market square" [ref=e191] [cursor=pointer]:
                        - /url: /squares/yola-central-market
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: YO
                      - generic [ref=e192]:
                        - heading "Yola Central Market Complex" [level=3] [ref=e193]
                        - paragraph [ref=e194]: Yola, Adamawa
                        - generic [ref=e196]:
                          - generic [ref=e197]: 0 traders
                          - generic [ref=e199]: · 0 goods
                          - generic [ref=e200]: Visit
                    - article [ref=e202]:
                      - link "View Wuse Market Abuja market square" [ref=e203] [cursor=pointer]:
                        - /url: /squares/wuse-market-abuja
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: WU
                      - generic [ref=e204]:
                        - heading "Wuse Market Abuja" [level=3] [ref=e205]
                        - paragraph [ref=e206]: Abuja, FCT
                        - generic [ref=e208]:
                          - generic [ref=e209]: 0 traders
                          - generic [ref=e211]: · 0 goods
                          - generic [ref=e212]: Visit
                  - link "Explore all Squares" [ref=e214] [cursor=pointer]:
                    - /url: /squares
                    - text: Explore all Squares
                - generic [ref=e217]:
                  - generic [ref=e218]:
                    - generic [ref=e219]:
                      - link [ref=e220] [cursor=pointer]:
                        - /url: /sellers/profile/hausacaps
                      - button "Follow" [ref=e221] [cursor=pointer]
                    - button "2" [ref=e223] [cursor=pointer]:
                      - generic [ref=e226]: "2"
                    - button "0" [ref=e227] [cursor=pointer]:
                      - generic [ref=e230]: "0"
                    - button "0" [ref=e231] [cursor=pointer]:
                      - generic [ref=e234]: "0"
                    - button "Unmute" [ref=e235] [cursor=pointer]
                  - generic [ref=e238]:
                    - link "HausaCaps" [ref=e240] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                    - paragraph [ref=e241]: 10 views
                    - paragraph [ref=e243]: Hausa Caps
                    - link "Shop Now • ₦40,000" [ref=e244] [cursor=pointer]:
                      - /url: /product/hausa-caps
                      - text: Shop Now • ₦40,000
                - generic [ref=e249]:
                  - generic [ref=e250]:
                    - link [ref=e251] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - button "0" [ref=e252] [cursor=pointer]:
                      - generic [ref=e255]: "0"
                    - button "1" [ref=e256] [cursor=pointer]:
                      - generic [ref=e259]: "1"
                    - button "0" [ref=e260] [cursor=pointer]:
                      - generic [ref=e263]: "0"
                  - link "@joshbj" [ref=e266] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e268]:
                  - generic [ref=e269]:
                    - link [ref=e270] [cursor=pointer]:
                      - /url: /profile/joshjosh
                    - button "1" [ref=e271] [cursor=pointer]:
                      - generic [ref=e274]: "1"
                    - button "0" [ref=e275] [cursor=pointer]:
                      - generic [ref=e278]: "0"
                    - button "0" [ref=e279] [cursor=pointer]:
                      - generic [ref=e282]: "0"
                  - link "@joshjosh" [ref=e285] [cursor=pointer]:
                    - /url: /profile/joshjosh
                - generic [ref=e287]:
                  - generic [ref=e288]:
                    - link [ref=e289] [cursor=pointer]:
                      - /url: /profile/joshjosh
                    - button "0" [ref=e290] [cursor=pointer]:
                      - generic [ref=e293]: "0"
                    - button "0" [ref=e294] [cursor=pointer]:
                      - generic [ref=e297]: "0"
                    - button "0" [ref=e298] [cursor=pointer]:
                      - generic [ref=e301]: "0"
                  - link "@joshjosh" [ref=e304] [cursor=pointer]:
                    - /url: /profile/joshjosh
                - generic [ref=e306]:
                  - generic [ref=e309]:
                    - link [ref=e310] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - button "1" [ref=e311] [cursor=pointer]:
                      - generic [ref=e314]: "1"
                    - button "0" [ref=e315] [cursor=pointer]:
                      - generic [ref=e318]: "0"
                    - button "0" [ref=e319] [cursor=pointer]:
                      - generic [ref=e322]: "0"
                  - link "@joshbj" [ref=e325] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e327]:
                  - generic [ref=e328]:
                    - link [ref=e329] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - button "1" [ref=e330] [cursor=pointer]:
                      - generic [ref=e333]: "1"
                    - button "1" [ref=e334] [cursor=pointer]:
                      - generic [ref=e337]: "1"
                    - button "0" [ref=e338] [cursor=pointer]:
                      - generic [ref=e341]: "0"
                  - link "@joshbj" [ref=e344] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e346]:
                  - generic [ref=e347]:
                    - link [ref=e348] [cursor=pointer]:
                      - /url: /profile/joshuabj
                    - button "1" [ref=e349] [cursor=pointer]:
                      - generic [ref=e352]: "1"
                    - button "0" [ref=e353] [cursor=pointer]:
                      - generic [ref=e356]: "0"
                    - button "0" [ref=e357] [cursor=pointer]:
                      - generic [ref=e360]: "0"
                  - link "@joshuabj" [ref=e363] [cursor=pointer]:
                    - /url: /profile/joshuabj
                - generic [ref=e365]:
                  - generic [ref=e366]:
                    - link [ref=e367] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - button "0" [ref=e368] [cursor=pointer]:
                      - generic [ref=e371]: "0"
                    - button "0" [ref=e372] [cursor=pointer]:
                      - generic [ref=e375]: "0"
                    - button "0" [ref=e376] [cursor=pointer]:
                      - generic [ref=e379]: "0"
                  - generic [ref=e380]:
                    - link "@joshbj" [ref=e382] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - paragraph [ref=e383]: "#fashion #lifestyle"
                - generic [ref=e385]:
                  - generic [ref=e386]:
                    - link [ref=e387] [cursor=pointer]:
                      - /url: /profile/Opesko
                    - button "1" [ref=e388] [cursor=pointer]:
                      - generic [ref=e391]: "1"
                    - button "2" [ref=e392] [cursor=pointer]:
                      - generic [ref=e395]: "2"
                    - button "0" [ref=e396] [cursor=pointer]:
                      - generic [ref=e399]: "0"
                  - generic [ref=e400]:
                    - link "@Opesko" [ref=e402] [cursor=pointer]:
                      - /url: /profile/Opesko
                    - paragraph [ref=e403]: "#fashion #lifestyle"
              - generic [ref=e404]:
                - button "Previous" [disabled] [ref=e405]
                - button "Next" [ref=e407] [cursor=pointer]
        - complementary [ref=e409]:
          - generic [ref=e410]:
            - tablist "Sidebar panels" [ref=e411]:
              - tab "Discover" [selected] [ref=e412] [cursor=pointer]:
                - generic [ref=e414]: Discover
              - tab "MarketX AI" [ref=e415] [cursor=pointer]:
                - generic [ref=e417]: MarketX AI
            - generic [ref=e419]:
              - generic [ref=e420]:
                - generic [ref=e421]:
                  - heading "Markets by category" [level=3] [ref=e422]
                  - link "All markets" [ref=e423] [cursor=pointer]:
                    - /url: /squares
                - link "NI Nigerian Heritage Artisans 0 traders · 0 goods" [ref=e425] [cursor=pointer]:
                  - /url: /squares/nigerian-heritage-artisans
                  - generic [ref=e426]: NI
                  - generic [ref=e427]:
                    - paragraph [ref=e428]: Nigerian Heritage Artisans
                    - paragraph [ref=e429]: 0 traders · 0 goods
              - generic [ref=e431]:
                - generic [ref=e432]:
                  - heading "Traders to discover" [level=3] [ref=e433]
                  - link "See all" [ref=e434] [cursor=pointer]:
                    - /url: /sellers
                - generic [ref=e435]:
                  - generic [ref=e436]:
                    - link "Hadronpower" [ref=e437] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                    - link "Hadronpower 3 followers" [ref=e439] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                      - paragraph [ref=e440]: Hadronpower
                      - paragraph [ref=e441]: 3 followers
                    - link "Follow" [ref=e442] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e443]:
                    - link "HausaCaps" [ref=e444] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                    - link "HausaCaps 3 followers" [ref=e446] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - paragraph [ref=e447]: HausaCaps
                      - paragraph [ref=e448]: 3 followers
                    - link "Follow" [ref=e449] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e450]:
                    - link "Starcollections" [ref=e451] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                    - link "Starcollections 3 followers" [ref=e453] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                      - paragraph [ref=e454]: Starcollections
                      - paragraph [ref=e455]: 3 followers
                    - link "Follow" [ref=e456] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e457]:
                    - link "jordanshoes" [ref=e458] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                    - link "jordanshoes 2 followers" [ref=e460] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                      - paragraph [ref=e461]: jordanshoes
                      - paragraph [ref=e462]: 2 followers
                    - link "Follow" [ref=e463] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e464]:
                    - link "obed stor" [ref=e465] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                    - link "obed stor 2 followers" [ref=e468] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                      - paragraph [ref=e469]: obed stor
                      - paragraph [ref=e470]: 2 followers
                    - link "Follow" [ref=e471] [cursor=pointer]:
                      - /url: /user-login
              - generic [ref=e472]:
                - generic [ref=e473]:
                  - heading "Trending goods" [level=3] [ref=e474]
                  - link "See all" [ref=e475] [cursor=pointer]:
                    - /url: /discover?tab=products
                - generic [ref=e476]:
                  - link "Hausa Caps HausaCaps ₦40,000" [ref=e477] [cursor=pointer]:
                    - /url: /product/hausa-caps
                    - generic [ref=e479]:
                      - paragraph [ref=e480]: Hausa Caps
                      - paragraph [ref=e481]: HausaCaps
                    - paragraph [ref=e482]: ₦40,000
                  - link "house for sell obed stor ₦400,000,000" [ref=e483] [cursor=pointer]:
                    - /url: /product/house-for-sell
                    - generic [ref=e485]:
                      - paragraph [ref=e486]: house for sell
                      - paragraph [ref=e487]: obed stor
                    - paragraph [ref=e488]: ₦400,000,000
                  - link "iPhone 14PM 256GB Jprimexbossnaturestores ₦900" [ref=e489] [cursor=pointer]:
                    - /url: /product/iphone-14pm-256gb
                    - generic [ref=e491]:
                      - paragraph [ref=e492]: iPhone 14PM 256GB
                      - paragraph [ref=e493]: Jprimexbossnaturestores
                    - paragraph [ref=e494]: ₦900
                  - link "Versatile Solar-Powered Stand Fan with Remote Makintech ₦80,000" [ref=e495] [cursor=pointer]:
                    - /url: /product/versatile-solar-powered-stand-fan-with-remote
                    - generic [ref=e497]:
                      - paragraph [ref=e498]: Versatile Solar-Powered Stand Fan with Remote
                      - paragraph [ref=e499]: Makintech
                    - paragraph [ref=e500]: ₦80,000
                  - link "Vibrant Geometric Ankara Fabric Hadaz stores ₦7,500" [ref=e501] [cursor=pointer]:
                    - /url: /product/vibrant-geometric-ankara-fabric
                    - generic [ref=e503]:
                      - paragraph [ref=e504]: Vibrant Geometric Ankara Fabric
                      - paragraph [ref=e505]: Hadaz stores
                    - paragraph [ref=e506]: ₦7,500
              - generic [ref=e507]:
                - generic [ref=e508]:
                  - link "About" [ref=e509] [cursor=pointer]:
                    - /url: /about
                  - link "Help" [ref=e510] [cursor=pointer]:
                    - /url: /help
                  - link "Terms" [ref=e511] [cursor=pointer]:
                    - /url: /terms
                  - link "Privacy" [ref=e512] [cursor=pointer]:
                    - /url: /privacy
                  - link "Near Me" [ref=e513] [cursor=pointer]:
                    - /url: /map
                - paragraph [ref=e514]: © 2026 MarketX. All rights reserved.
  - generic:
    - img
  - generic [ref=e515]:
    - button "Toggle Nuxt DevTools" [ref=e516] [cursor=pointer]:
      - img [ref=e517]
    - generic "Page load time" [ref=e520]:
      - generic [ref=e521]: "166"
      - generic [ref=e522]: ms
    - button "Toggle Component Inspector" [ref=e524] [cursor=pointer]:
      - img [ref=e525]
```

# Test source

```ts
  80  |     // Wait for content past the loading spinner before auditing.
  81  |     await expect(
  82  |       page
  83  |         .locator('.feed-slide')
  84  |         .first()
  85  |         .or(page.getByText(/nothing here yet/i)),
  86  |     ).toBeVisible({ timeout: 30000 })
  87  |     const results = await makeAxeBuilder().analyze()
  88  |     expect(results.violations).toEqual([])
  89  |   })
  90  | })
  91  | 
  92  | // ── AUTHENTICATED, DEFAULT SETTING (MinimalHome) ─────────────────────────────
  93  | 
  94  | test.describe('home — authenticated, minimal (default)', () => {
  95  |   test.beforeEach(async ({ page, request }) => {
  96  |     // Explicitly reset to the default so this spec doesn't depend on
  97  |     // leftover state from the "detailed" describe block below.
  98  |     const { token } = await apiLogin(request)
  99  |     await request.patch('/api/profile/settings', {
  100 |       data: { feed_display_style: 'minimal' },
  101 |       headers: { Authorization: `Bearer ${token}` },
  102 |     })
  103 |     await pageLogin(page, request)
  104 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  105 |   })
  106 | 
  107 |   test('renders MinimalHome, not SocialFeed', async ({ page }) => {
  108 |     await expect(
  109 |       page.getByRole('button', { name: /search or verify a seller/i }),
  110 |     ).toBeVisible({ timeout: 30000 })
  111 |     await expect(page.getByRole('tab', { name: /for you/i })).not.toBeVisible()
  112 |   })
  113 | })
  114 | 
  115 | // ── AUTHENTICATED, DETAILED (opt-in, SocialFeed) ─────────────────────────────
  116 | 
  117 | test.describe('home — authenticated, detailed (opt-in)', () => {
  118 |   test.beforeEach(async ({ page, request }) => {
  119 |     const { token } = await apiLogin(request)
  120 |     await request.patch('/api/profile/settings', {
  121 |       data: { feed_display_style: 'detailed' },
  122 |       headers: { Authorization: `Bearer ${token}` },
  123 |     })
  124 |     await pageLogin(page, request)
  125 |     // SSE/WS connections after login never reach networkidle — use domcontentloaded
  126 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  127 |   })
  128 | 
  129 |   test.afterEach(async ({ request }) => {
  130 |     // Don't leak "detailed" into other specs that assume the default.
  131 |     const { token } = await apiLogin(request)
  132 |     await request.patch('/api/profile/settings', {
  133 |       data: { feed_display_style: 'minimal' },
  134 |       headers: { Authorization: `Bearer ${token}` },
  135 |     })
  136 |   })
  137 | 
  138 |   test('renders social feed — SplashScreen clears after auth', async ({
  139 |     page,
  140 |   }) => {
  141 |     const splash = page.locator('.fixed.inset-0.z-\\[100\\]')
  142 |     await expect(splash).not.toBeVisible({ timeout: 30000 })
  143 |   })
  144 | 
  145 |   test('feed is not stuck on SplashScreen after auth', async ({ page }) => {
  146 |     const splash = page.locator('.fixed.inset-0.z-\\[100\\]')
  147 |     await expect(splash).not.toBeVisible({ timeout: 30000 })
  148 |     // Wait for SocialFeed to actually mount (the feed filter tabs are
  149 |     // SocialFeed-only).
  150 |     await expect(page.getByRole('tab', { name: /for you/i })).toBeVisible({
  151 |       timeout: 30000,
  152 |     })
  153 |     // MinimalHome's search icon is guest/minimal-only — should NOT be visible
  154 |     // once SocialFeed (detailed) is shown.
  155 |     await expect(
  156 |       page.getByRole('button', { name: /search or verify a seller/i }),
  157 |     ).not.toBeVisible()
  158 |   })
  159 | })
  160 | 
  161 | // ── VISUAL SNAPSHOT ───────────────────────────────────────────────────────────
  162 | 
  163 | test('guest home — visual snapshot', async ({ page }) => {
  164 |   await page.goto('/', { waitUntil: 'domcontentloaded' })
  165 |   // NOTE: after the TrustMarketHome → MinimalHome switch the baseline
  166 |   // home-guest.png must be regenerated — run this spec once with --update-snapshots.
  167 |   await expect(
  168 |     page
  169 |       .locator('.feed-slide')
  170 |       .first()
  171 |       .or(page.getByText(/nothing here yet/i)),
  172 |   ).toBeVisible({ timeout: 30000 })
  173 |   // Hide images + animate elements so layout is stable across runs with dynamic content
  174 |   await page.addStyleTag({
  175 |     content: `
  176 |       img, video { visibility: hidden !important; }
  177 |       * { animation: none !important; transition: none !important; }
  178 |     `,
  179 |   })
> 180 |   await expect(page).toHaveScreenshot('home-guest.png', {
      |                      ^ Error: expect(page).toHaveScreenshot(expected) failed
  181 |     maxDiffPixelRatio: 0.1,
  182 |   })
  183 | })
  184 | 
```