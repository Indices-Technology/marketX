# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\ui\navigation.spec.ts >> navigation — authenticated differences >> authenticated user sees Create <button> in nav (not a link)
- Location: tests\e2e\ui\navigation.spec.ts:233:3

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
      - generic [ref=e551]: "124"
      - generic [ref=e552]: ms
    - button "Toggle Component Inspector" [ref=e554] [cursor=pointer]:
      - img [ref=e555]
```

# Test source

```ts
  147 |     await expect(bottomNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  148 |   })
  149 | 
  150 |   test('guest sees "Start selling" CTA in bottom nav (goes to /user-register)', async ({
  151 |     page,
  152 |   }) => {
  153 |     await expect(
  154 |       bottomNav(page).locator('a[href="/user-register"]'),
  155 |     ).toBeVisible(T)
  156 |   })
  157 | })
  158 | 
  159 | // ── MOBILE HEADER — aria-labels ──────────────────────────────────────────────
  160 | 
  161 | test.describe('mobile header — aria-labels', () => {
  162 |   test.use({ viewport: { width: 390, height: 844 } })
  163 | 
  164 |   test.beforeEach(async ({ page }) => {
  165 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  166 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  167 |     // reaches 'networkidle'.
  168 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  169 |   })
  170 | 
  171 |   test('Cart button has aria-label="Cart"', async ({ page }) => {
  172 |     await expect(page.locator('button[aria-label="Cart"]')).toBeVisible(T)
  173 |   })
  174 | 
  175 |   test('Search control has aria-label="Search"', async ({ page }) => {
  176 |     await expect(page.locator('[aria-label="Search"]')).toBeVisible(T)
  177 |   })
  178 | 
  179 |   test('guest sees a Sign in CTA in the mobile header', async ({ page }) => {
  180 |     const header = page.locator('header.mobile-header')
  181 |     await expect(header.getByRole('link', { name: /sign in/i })).toBeVisible(T)
  182 |   })
  183 | })
  184 | 
  185 | // ── MOBILE BOTTOM NAV — aria-labels ──────────────────────────────────────────
  186 | 
  187 | test.describe('mobile BottomNav — aria-labels', () => {
  188 |   test.use({ viewport: { width: 390, height: 844 } })
  189 | 
  190 |   test.beforeEach(async ({ page }) => {
  191 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  192 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  193 |     // reaches 'networkidle'.
  194 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  195 |   })
  196 | 
  197 |   test('Home link has aria-label="Home"', async ({ page }) => {
  198 |     await expect(bottomNav(page).locator('[aria-label="Home"]')).toBeVisible(T)
  199 |   })
  200 | 
  201 |   test('Near Me link has aria-label="Near Me"', async ({ page }) => {
  202 |     await expect(bottomNav(page).locator('[aria-label="Near Me"]')).toBeVisible(
  203 |       T,
  204 |     )
  205 |   })
  206 | 
  207 |   test('Squares link has aria-label="Squares"', async ({ page }) => {
  208 |     await expect(bottomNav(page).locator('[aria-label="Squares"]')).toBeVisible(
  209 |       T,
  210 |     )
  211 |   })
  212 | 
  213 |   test('guest: Create link has aria-label="Start selling"', async ({
  214 |     page,
  215 |   }) => {
  216 |     await expect(
  217 |       bottomNav(page).locator('[aria-label="Start selling"]'),
  218 |     ).toBeVisible(T)
  219 |   })
  220 | 
  221 |   test('guest: Sign in link has aria-label="Sign in"', async ({ page }) => {
  222 |     await expect(bottomNav(page).locator('[aria-label="Sign in"]')).toBeVisible(
  223 |       T,
  224 |     )
  225 |   })
  226 | })
  227 | 
  228 | // ── AUTH STATE DIFFERENCES ────────────────────────────────────────────────────
  229 | 
  230 | test.describe('navigation — authenticated differences', () => {
  231 |   test.use({ viewport: { width: 1440, height: 900 } })
  232 | 
  233 |   test('authenticated user sees Create <button> in nav (not a link)', async ({
  234 |     page,
  235 |     request,
  236 |   }) => {
  237 |     await pageLogin(page, request)
  238 |     // SSE/Pusher connections on authenticated home never reach networkidle
  239 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  240 |     // Logged-in Create is a <button> that opens a modal, not an <a href="/user-register">
  241 |     await expect(
  242 |       sideNav(page).locator('a[href="/user-register"]'),
  243 |     ).not.toBeVisible()
  244 |     const createBtn = sideNav(page)
  245 |       .locator('button')
  246 |       .filter({ hasText: /create/i })
> 247 |     await expect(createBtn).toBeVisible(T)
      |                             ^ Error: expect(locator).toBeVisible() failed
  248 |   })
  249 | })
  250 | 
  251 | // ── PAGE META / SEO ───────────────────────────────────────────────────────────
  252 | 
  253 | test.describe('page meta tags', () => {
  254 |   for (const { route, label } of [
  255 |     { route: '/', label: 'home' },
  256 |     { route: '/discover', label: 'discover' },
  257 |     { route: '/squares', label: 'squares' },
  258 |   ]) {
  259 |     test(`${label} page has a non-empty <title>`, async ({ page }) => {
  260 |       // Home's MinimalHome video slides never reach 'networkidle'; the other
  261 |       // two routes are fine with it.
  262 |       await page.goto(route, {
  263 |         waitUntil: route === '/' ? 'domcontentloaded' : 'networkidle',
  264 |       })
  265 |       const title = await page.title()
  266 |       expect(title.trim().length).toBeGreaterThan(0)
  267 |     })
  268 |   }
  269 | 
  270 |   test('home page has meta description', async ({ page }) => {
  271 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  272 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  273 |     // reaches 'networkidle'.
  274 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  275 |     const content = await page
  276 |       .locator('meta[name="description"]')
  277 |       .getAttribute('content')
  278 |     expect(content?.trim().length ?? 0).toBeGreaterThan(0)
  279 |   })
  280 | })
  281 | 
  282 | // ── VISUAL SNAPSHOTS ──────────────────────────────────────────────────────────
  283 | 
  284 | // NOTE: after the TrustMarketHome/SocialFeed → MinimalHome default-home
  285 | // switch, both baselines below must be regenerated — run with --update-snapshots.
  286 | 
  287 | test('desktop SideNav — visual snapshot', async ({ page }) => {
  288 |   await page.setViewportSize({ width: 1440, height: 900 })
  289 |   await page.goto('/', { waitUntil: 'domcontentloaded' })
  290 |   await expect(
  291 |     page.getByRole('button', { name: /search or verify a seller/i }),
  292 |   ).toBeVisible({ timeout: 30000 })
  293 |   const box = await sideNav(page).boundingBox()
  294 |   await expect(page).toHaveScreenshot('desktop-sidenav.png', {
  295 |     maxDiffPixelRatio: 0.05,
  296 |     clip: box ?? undefined,
  297 |   })
  298 | })
  299 | 
  300 | test('mobile BottomNav — visual snapshot', async ({ page }) => {
  301 |   await page.setViewportSize({ width: 390, height: 844 })
  302 |   await page.goto('/', { waitUntil: 'domcontentloaded' })
  303 |   await expect(
  304 |     page.getByRole('button', { name: /search or verify a seller/i }),
  305 |   ).toBeVisible({ timeout: 30000 })
  306 |   const box = await bottomNav(page).boundingBox()
  307 |   await expect(page).toHaveScreenshot('mobile-bottomnav.png', {
  308 |     maxDiffPixelRatio: 0.05,
  309 |     clip: box ?? undefined,
  310 |   })
  311 | })
  312 | 
```