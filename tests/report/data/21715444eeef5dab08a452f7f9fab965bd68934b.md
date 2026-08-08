# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\feed\homefeed.spec.ts >> home — authenticated, detailed (opt-in) >> feed is not stuck on SplashScreen after auth
- Location: tests\e2e\feed\homefeed.spec.ts:145:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('tab', { name: /for you/i })
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByRole('tab', { name: /for you/i })

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
                    - link "OkoroSamuel" [ref=e58] [cursor=pointer]:
                      - /url: /profile/OkoroSamuel
                      - img "OkoroSamuel" [ref=e59]
                    - button "0" [ref=e60] [cursor=pointer]:
                      - generic [ref=e63]: "0"
                    - button "0" [ref=e64] [cursor=pointer]:
                      - generic [ref=e67]: "0"
                    - button "0" [ref=e68] [cursor=pointer]:
                      - generic [ref=e71]: "0"
                  - link "@OkoroSamuel" [ref=e74] [cursor=pointer]:
                    - /url: /profile/OkoroSamuel
                - generic [ref=e76]:
                  - generic [ref=e77]:
                    - link "imakwam" [ref=e78] [cursor=pointer]:
                      - /url: /sellers/profile/imakwam
                      - img "imakwam" [ref=e79]
                    - button "0" [ref=e80] [cursor=pointer]:
                      - generic [ref=e83]: "0"
                    - button "0" [ref=e84] [cursor=pointer]:
                      - generic [ref=e87]: "0"
                    - button "0" [ref=e88] [cursor=pointer]:
                      - generic [ref=e91]: "0"
                  - link "@imakwam" [ref=e94] [cursor=pointer]:
                    - /url: /sellers/profile/imakwam
                - generic [ref=e96]:
                  - generic [ref=e99]:
                    - link "obedjoseph" [ref=e100] [cursor=pointer]:
                      - /url: /sellers/profile/obedjoseph
                      - img "obedjoseph" [ref=e101]
                    - button "0" [ref=e102] [cursor=pointer]:
                      - generic [ref=e105]: "0"
                    - button "0" [ref=e106] [cursor=pointer]:
                      - generic [ref=e109]: "0"
                    - button "0" [ref=e110] [cursor=pointer]:
                      - generic [ref=e113]: "0"
                  - link "@obedjoseph" [ref=e116] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                - generic [ref=e118]:
                  - generic [ref=e121]:
                    - link "obedjoseph" [ref=e122] [cursor=pointer]:
                      - /url: /sellers/profile/obedjoseph
                      - img "obedjoseph" [ref=e123]
                    - button "0" [ref=e124] [cursor=pointer]:
                      - generic [ref=e127]: "0"
                    - button "0" [ref=e128] [cursor=pointer]:
                      - generic [ref=e131]: "0"
                    - button "0" [ref=e132] [cursor=pointer]:
                      - generic [ref=e135]: "0"
                  - link "@obedjoseph" [ref=e138] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                - generic [ref=e140]:
                  - generic [ref=e141]:
                    - paragraph [ref=e142]: Local markets, online
                    - heading "Step into a Square" [level=2] [ref=e143]
                    - paragraph [ref=e144]: Communities of traders organised the way Nigeria's physical markets work.
                  - generic [ref=e145]:
                    - article [ref=e146]:
                      - link "View Balogun Market Square market square" [ref=e147] [cursor=pointer]:
                        - /url: /squares/balogun-market-lagos
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: BA
                      - generic [ref=e148]:
                        - heading "Balogun Market Square" [level=3] [ref=e149]
                        - paragraph [ref=e150]: Lagos Island, Lagos
                        - generic [ref=e152]:
                          - generic [ref=e153]: 0 traders
                          - generic [ref=e155]: · 0 goods
                          - generic [ref=e156]: Visit
                    - article [ref=e158]:
                      - link "View Bodija Market Square market square" [ref=e159] [cursor=pointer]:
                        - /url: /squares/bodija-market-ibadan
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: BO
                      - generic [ref=e160]:
                        - heading "Bodija Market Square" [level=3] [ref=e161]
                        - paragraph [ref=e162]: Ibadan, Oyo
                        - generic [ref=e164]:
                          - generic [ref=e165]: 0 traders
                          - generic [ref=e167]: · 0 goods
                          - generic [ref=e168]: Visit
                    - article [ref=e170]:
                      - link "View Hamaz Shopping Complex market square" [ref=e171] [cursor=pointer]:
                        - /url: /squares/hamaz-complex-jos
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: HA
                      - generic [ref=e172]:
                        - heading "Hamaz Shopping Complex" [level=3] [ref=e173]
                        - paragraph [ref=e174]: Jos, Plateau
                        - generic [ref=e176]:
                          - generic [ref=e177]: 1 traders
                          - generic [ref=e179]: · 0 goods
                          - generic [ref=e180]: Visit
                    - article [ref=e182]:
                      - link "View Computer Village Square market square" [ref=e183] [cursor=pointer]:
                        - /url: /squares/computer-village-ikeja
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: CO
                      - generic [ref=e184]:
                        - heading "Computer Village Square" [level=3] [ref=e185]
                        - paragraph [ref=e186]: Ikeja, Lagos
                        - generic [ref=e188]:
                          - generic [ref=e189]: 0 traders
                          - generic [ref=e191]: · 0 goods
                          - generic [ref=e192]: Visit
                    - article [ref=e194]:
                      - link "View Yola Central Market Complex market square" [ref=e195] [cursor=pointer]:
                        - /url: /squares/yola-central-market
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: YO
                      - generic [ref=e196]:
                        - heading "Yola Central Market Complex" [level=3] [ref=e197]
                        - paragraph [ref=e198]: Yola, Adamawa
                        - generic [ref=e200]:
                          - generic [ref=e201]: 0 traders
                          - generic [ref=e203]: · 0 goods
                          - generic [ref=e204]: Visit
                    - article [ref=e206]:
                      - link "View Wuse Market Abuja market square" [ref=e207] [cursor=pointer]:
                        - /url: /squares/wuse-market-abuja
                      - generic:
                        - generic: Market
                      - generic:
                        - generic:
                          - generic: WU
                      - generic [ref=e208]:
                        - heading "Wuse Market Abuja" [level=3] [ref=e209]
                        - paragraph [ref=e210]: Abuja, FCT
                        - generic [ref=e212]:
                          - generic [ref=e213]: 0 traders
                          - generic [ref=e215]: · 0 goods
                          - generic [ref=e216]: Visit
                  - link "Explore all Squares" [ref=e218] [cursor=pointer]:
                    - /url: /squares
                    - text: Explore all Squares
                - generic [ref=e221]:
                  - generic [ref=e223]:
                    - generic [ref=e224]:
                      - link "HausaCaps" [ref=e225] [cursor=pointer]:
                        - /url: /sellers/profile/hausacaps
                        - img "HausaCaps" [ref=e226]
                      - button "Follow" [ref=e227] [cursor=pointer]
                    - button "2" [ref=e229] [cursor=pointer]:
                      - generic [ref=e232]: "2"
                    - button "0" [ref=e233] [cursor=pointer]:
                      - generic [ref=e236]: "0"
                    - button "0" [ref=e237] [cursor=pointer]:
                      - generic [ref=e240]: "0"
                    - button "Unmute" [ref=e241] [cursor=pointer]
                  - generic [ref=e244]:
                    - link "HausaCaps" [ref=e246] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                    - paragraph [ref=e247]: 10 views
                    - paragraph [ref=e249]: Hausa Caps
                    - link "Shop Now • ₦40,000" [ref=e250] [cursor=pointer]:
                      - /url: /product/hausa-caps
                      - text: Shop Now • ₦40,000
                - generic [ref=e255]:
                  - generic [ref=e257]:
                    - link "joshbj" [ref=e258] [cursor=pointer]:
                      - /url: /profile/joshbj
                      - img "joshbj" [ref=e259]
                    - button "0" [ref=e260] [cursor=pointer]:
                      - generic [ref=e263]: "0"
                    - button "1" [ref=e264] [cursor=pointer]:
                      - generic [ref=e267]: "1"
                    - button "0" [ref=e268] [cursor=pointer]:
                      - generic [ref=e271]: "0"
                  - link "@joshbj" [ref=e274] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e276]:
                  - generic [ref=e278]:
                    - link "joshjosh" [ref=e279] [cursor=pointer]:
                      - /url: /profile/joshjosh
                      - img "joshjosh" [ref=e280]
                    - button "1" [ref=e281] [cursor=pointer]:
                      - generic [ref=e284]: "1"
                    - button "0" [ref=e285] [cursor=pointer]:
                      - generic [ref=e288]: "0"
                    - button "0" [ref=e289] [cursor=pointer]:
                      - generic [ref=e292]: "0"
                  - link "@joshjosh" [ref=e295] [cursor=pointer]:
                    - /url: /profile/joshjosh
                - generic [ref=e297]:
                  - generic [ref=e299]:
                    - link "joshjosh" [ref=e300] [cursor=pointer]:
                      - /url: /profile/joshjosh
                      - img "joshjosh" [ref=e301]
                    - button "0" [ref=e302] [cursor=pointer]:
                      - generic [ref=e305]: "0"
                    - button "0" [ref=e306] [cursor=pointer]:
                      - generic [ref=e309]: "0"
                    - button "0" [ref=e310] [cursor=pointer]:
                      - generic [ref=e313]: "0"
                  - link "@joshjosh" [ref=e316] [cursor=pointer]:
                    - /url: /profile/joshjosh
                - generic [ref=e318]:
                  - generic [ref=e321]:
                    - link "joshbj" [ref=e322] [cursor=pointer]:
                      - /url: /profile/joshbj
                      - img "joshbj" [ref=e323]
                    - button "1" [ref=e324] [cursor=pointer]:
                      - generic [ref=e327]: "1"
                    - button "0" [ref=e328] [cursor=pointer]:
                      - generic [ref=e331]: "0"
                    - button "0" [ref=e332] [cursor=pointer]:
                      - generic [ref=e335]: "0"
                  - link "@joshbj" [ref=e338] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e340]:
                  - generic [ref=e342]:
                    - link "joshbj" [ref=e343] [cursor=pointer]:
                      - /url: /profile/joshbj
                      - img "joshbj" [ref=e344]
                    - button "1" [ref=e345] [cursor=pointer]:
                      - generic [ref=e348]: "1"
                    - button "1" [ref=e349] [cursor=pointer]:
                      - generic [ref=e352]: "1"
                    - button "0" [ref=e353] [cursor=pointer]:
                      - generic [ref=e356]: "0"
                  - link "@joshbj" [ref=e359] [cursor=pointer]:
                    - /url: /profile/joshbj
                - generic [ref=e361]:
                  - generic [ref=e363]:
                    - link "joshuabj" [ref=e364] [cursor=pointer]:
                      - /url: /profile/joshuabj
                      - img "joshuabj" [ref=e365]
                    - button "1" [ref=e366] [cursor=pointer]:
                      - generic [ref=e369]: "1"
                    - button "0" [ref=e370] [cursor=pointer]:
                      - generic [ref=e373]: "0"
                    - button "0" [ref=e374] [cursor=pointer]:
                      - generic [ref=e377]: "0"
                  - link "@joshuabj" [ref=e380] [cursor=pointer]:
                    - /url: /profile/joshuabj
                - generic [ref=e382]:
                  - 'img "#fashion #lifestyle" [ref=e383]'
                  - generic [ref=e384]:
                    - link "joshbj" [ref=e385] [cursor=pointer]:
                      - /url: /profile/joshbj
                      - img "joshbj" [ref=e386]
                    - button "0" [ref=e387] [cursor=pointer]:
                      - generic [ref=e390]: "0"
                    - button "0" [ref=e391] [cursor=pointer]:
                      - generic [ref=e394]: "0"
                    - button "0" [ref=e395] [cursor=pointer]:
                      - generic [ref=e398]: "0"
                  - generic [ref=e399]:
                    - link "@joshbj" [ref=e401] [cursor=pointer]:
                      - /url: /profile/joshbj
                    - paragraph [ref=e402]: "#fashion #lifestyle"
                - generic [ref=e404]:
                  - 'img "#fashion #lifestyle" [ref=e405]'
                  - generic [ref=e406]:
                    - link "Opesko" [ref=e407] [cursor=pointer]:
                      - /url: /profile/Opesko
                      - img "Opesko" [ref=e408]
                    - button "1" [ref=e409] [cursor=pointer]:
                      - generic [ref=e412]: "1"
                    - button "2" [ref=e413] [cursor=pointer]:
                      - generic [ref=e416]: "2"
                    - button "0" [ref=e417] [cursor=pointer]:
                      - generic [ref=e420]: "0"
                  - generic [ref=e421]:
                    - link "@Opesko" [ref=e423] [cursor=pointer]:
                      - /url: /profile/Opesko
                    - paragraph [ref=e424]: "#fashion #lifestyle"
              - generic [ref=e425]:
                - button "Previous" [disabled] [ref=e426]
                - button "Next" [ref=e428] [cursor=pointer]
        - complementary [ref=e430]:
          - generic [ref=e431]:
            - tablist "Sidebar panels" [ref=e432]:
              - tab "Discover" [selected] [ref=e433] [cursor=pointer]:
                - generic [ref=e435]: Discover
              - tab "MarketX AI" [ref=e436] [cursor=pointer]:
                - generic [ref=e438]: MarketX AI
            - generic [ref=e440]:
              - generic [ref=e441]:
                - generic [ref=e442]:
                  - heading "Markets by category" [level=3] [ref=e443]
                  - link "All markets" [ref=e444] [cursor=pointer]:
                    - /url: /squares
                - link "NI Nigerian Heritage Artisans 0 traders · 0 goods" [ref=e446] [cursor=pointer]:
                  - /url: /squares/nigerian-heritage-artisans
                  - generic [ref=e447]: NI
                  - generic [ref=e448]:
                    - paragraph [ref=e449]: Nigerian Heritage Artisans
                    - paragraph [ref=e450]: 0 traders · 0 goods
              - generic [ref=e452]:
                - generic [ref=e453]:
                  - heading "Traders to discover" [level=3] [ref=e454]
                  - link "See all" [ref=e455] [cursor=pointer]:
                    - /url: /sellers
                - generic [ref=e456]:
                  - generic [ref=e457]:
                    - link "Hadronpower" [ref=e458] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                      - img "Hadronpower" [ref=e460]
                    - link "Hadronpower 3 followers" [ref=e461] [cursor=pointer]:
                      - /url: /sellers/profile/hadronpower
                      - paragraph [ref=e462]: Hadronpower
                      - paragraph [ref=e463]: 3 followers
                    - link "Follow" [ref=e464] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e465]:
                    - link "HausaCaps" [ref=e466] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - img "HausaCaps" [ref=e468]
                    - link "HausaCaps 3 followers" [ref=e469] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - paragraph [ref=e470]: HausaCaps
                      - paragraph [ref=e471]: 3 followers
                    - link "Follow" [ref=e472] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e473]:
                    - link "Starcollections" [ref=e474] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                      - img "Starcollections" [ref=e476]
                    - link "Starcollections 3 followers" [ref=e477] [cursor=pointer]:
                      - /url: /sellers/profile/starcollections
                      - paragraph [ref=e478]: Starcollections
                      - paragraph [ref=e479]: 3 followers
                    - link "Follow" [ref=e480] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e481]:
                    - link "jordanshoes" [ref=e482] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                      - img "jordanshoes" [ref=e484]
                    - link "jordanshoes 2 followers" [ref=e485] [cursor=pointer]:
                      - /url: /sellers/profile/jordanshoes
                      - paragraph [ref=e486]: jordanshoes
                      - paragraph [ref=e487]: 2 followers
                    - link "Follow" [ref=e488] [cursor=pointer]:
                      - /url: /user-login
                  - generic [ref=e489]:
                    - link "obed stor" [ref=e490] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                    - link "obed stor 2 followers" [ref=e493] [cursor=pointer]:
                      - /url: /sellers/profile/obed
                      - paragraph [ref=e494]: obed stor
                      - paragraph [ref=e495]: 2 followers
                    - link "Follow" [ref=e496] [cursor=pointer]:
                      - /url: /user-login
              - generic [ref=e497]:
                - generic [ref=e498]:
                  - heading "Trending goods" [level=3] [ref=e499]
                  - link "See all" [ref=e500] [cursor=pointer]:
                    - /url: /discover?tab=products
                - generic [ref=e501]:
                  - link "Hausa Caps Hausa Caps HausaCaps ₦40,000" [ref=e502] [cursor=pointer]:
                    - /url: /product/hausa-caps
                    - img "Hausa Caps" [ref=e504]
                    - generic [ref=e505]:
                      - paragraph [ref=e506]: Hausa Caps
                      - paragraph [ref=e507]: HausaCaps
                    - paragraph [ref=e508]: ₦40,000
                  - link "house for sell house for sell obed stor ₦400,000,000" [ref=e509] [cursor=pointer]:
                    - /url: /product/house-for-sell
                    - img "house for sell" [ref=e511]
                    - generic [ref=e512]:
                      - paragraph [ref=e513]: house for sell
                      - paragraph [ref=e514]: obed stor
                    - paragraph [ref=e515]: ₦400,000,000
                  - link "iPhone 14PM 256GB iPhone 14PM 256GB Jprimexbossnaturestores ₦900" [ref=e516] [cursor=pointer]:
                    - /url: /product/iphone-14pm-256gb
                    - img "iPhone 14PM 256GB" [ref=e518]
                    - generic [ref=e519]:
                      - paragraph [ref=e520]: iPhone 14PM 256GB
                      - paragraph [ref=e521]: Jprimexbossnaturestores
                    - paragraph [ref=e522]: ₦900
                  - link "Versatile Solar-Powered Stand Fan with Remote Versatile Solar-Powered Stand Fan with Remote Makintech ₦80,000" [ref=e523] [cursor=pointer]:
                    - /url: /product/versatile-solar-powered-stand-fan-with-remote
                    - img "Versatile Solar-Powered Stand Fan with Remote" [ref=e525]
                    - generic [ref=e526]:
                      - paragraph [ref=e527]: Versatile Solar-Powered Stand Fan with Remote
                      - paragraph [ref=e528]: Makintech
                    - paragraph [ref=e529]: ₦80,000
                  - link "Vibrant Geometric Ankara Fabric Vibrant Geometric Ankara Fabric Hadaz stores ₦7,500" [ref=e530] [cursor=pointer]:
                    - /url: /product/vibrant-geometric-ankara-fabric
                    - img "Vibrant Geometric Ankara Fabric" [ref=e532]
                    - generic [ref=e533]:
                      - paragraph [ref=e534]: Vibrant Geometric Ankara Fabric
                      - paragraph [ref=e535]: Hadaz stores
                    - paragraph [ref=e536]: ₦7,500
              - generic [ref=e537]:
                - generic [ref=e538]:
                  - link "About" [ref=e539] [cursor=pointer]:
                    - /url: /about
                  - link "Help" [ref=e540] [cursor=pointer]:
                    - /url: /help
                  - link "Terms" [ref=e541] [cursor=pointer]:
                    - /url: /terms
                  - link "Privacy" [ref=e542] [cursor=pointer]:
                    - /url: /privacy
                  - link "Near Me" [ref=e543] [cursor=pointer]:
                    - /url: /map
                - paragraph [ref=e544]: © 2026 MarketX. All rights reserved.
  - generic:
    - img
  - generic [ref=e545]:
    - button "Toggle Nuxt DevTools" [ref=e546] [cursor=pointer]:
      - img [ref=e547]
    - generic "Page load time" [ref=e550]:
      - generic [ref=e551]: "145"
      - generic [ref=e552]: ms
    - button "Toggle Component Inspector" [ref=e554] [cursor=pointer]:
      - img [ref=e555]
```

# Test source

```ts
  50  |     await page
  51  |       .getByRole('button', { name: /search or verify a seller/i })
  52  |       .click()
  53  |     await page.getByRole('tab', { name: /verify any seller/i }).click()
  54  |     await page.getByPlaceholder(/instagram_handle/i).fill('swankyshoes')
  55  |     await page.getByRole('button', { name: /^verify seller$/i }).click()
  56  |     await expect(page).toHaveURL(/\/verify\?q=/, T)
  57  |   })
  58  | 
  59  |   test('Squares nav link navigates to /squares', async ({ page }) => {
  60  |     const link = page.locator('a[href="/squares"]').first()
  61  |     await expect(link).toBeVisible(T)
  62  |     await link.click()
  63  |     await expect(page).toHaveURL('/squares', T)
  64  |   })
  65  | 
  66  |   test('sign-in nav link navigates to /user-login', async ({ page }) => {
  67  |     // Both the (desktop-visible) SideNav and the (mobile-only, CSS-hidden at
  68  |     // this project's desktop viewport) mobile header have a matching href —
  69  |     // ':visible' picks whichever one actually renders for this viewport.
  70  |     const link = page.locator('a[href="/user-login"]:visible').first()
  71  |     await expect(link).toBeVisible(T)
  72  |     await link.click()
  73  |     await expect(page).toHaveURL(/user-login/, T)
  74  |   })
  75  | 
  76  |   test('no accessibility violations on guest home', async ({
  77  |     page,
  78  |     makeAxeBuilder,
  79  |   }) => {
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
> 150 |     await expect(page.getByRole('tab', { name: /for you/i })).toBeVisible({
      |                                                               ^ Error: expect(locator).toBeVisible() failed
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
  180 |   await expect(page).toHaveScreenshot('home-guest.png', {
  181 |     maxDiffPixelRatio: 0.1,
  182 |   })
  183 | })
  184 | 
```