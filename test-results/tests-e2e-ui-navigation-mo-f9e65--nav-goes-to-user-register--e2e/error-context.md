# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\ui\navigation.spec.ts >> mobile BottomNav — guest >> guest sees "Start selling" CTA in bottom nav (goes to /user-register)
- Location: tests\e2e\ui\navigation.spec.ts:150:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav.bottom-nav').locator('a[href="/user-register"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('nav.bottom-nav').locator('a[href="/user-register"]')

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
        - generic [ref=e24]:
          - generic:
            - generic [ref=e25]:
              - button "Search or verify a seller" [ref=e26] [cursor=pointer]
              - generic [ref=e28]:
                - button "For You" [ref=e29] [cursor=pointer]
                - button "Trending" [ref=e30] [cursor=pointer]
                - button "Deals" [ref=e31] [cursor=pointer]
            - generic [ref=e32]:
              - generic [ref=e34]:
                - generic [ref=e37]:
                  - link "OkoroSamuel" [ref=e38] [cursor=pointer]:
                    - /url: /profile/OkoroSamuel
                    - img "OkoroSamuel" [ref=e39]
                  - button "0" [ref=e40] [cursor=pointer]:
                    - generic [ref=e43]: "0"
                  - button "0" [ref=e44] [cursor=pointer]:
                    - generic [ref=e47]: "0"
                  - button "0" [ref=e48] [cursor=pointer]:
                    - generic [ref=e51]: "0"
                - link "@OkoroSamuel" [ref=e54] [cursor=pointer]:
                  - /url: /profile/OkoroSamuel
              - generic [ref=e56]:
                - generic [ref=e57]:
                  - link "imakwam" [ref=e58] [cursor=pointer]:
                    - /url: /sellers/profile/imakwam
                    - img "imakwam" [ref=e59]
                  - button "0" [ref=e60] [cursor=pointer]:
                    - generic [ref=e63]: "0"
                  - button "0" [ref=e64] [cursor=pointer]:
                    - generic [ref=e67]: "0"
                  - button "0" [ref=e68] [cursor=pointer]:
                    - generic [ref=e71]: "0"
                - link "@imakwam" [ref=e74] [cursor=pointer]:
                  - /url: /sellers/profile/imakwam
              - generic [ref=e76]:
                - generic [ref=e79]:
                  - link "obedjoseph" [ref=e80] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                    - img "obedjoseph" [ref=e81]
                  - button "0" [ref=e82] [cursor=pointer]:
                    - generic [ref=e85]: "0"
                  - button "0" [ref=e86] [cursor=pointer]:
                    - generic [ref=e89]: "0"
                  - button "0" [ref=e90] [cursor=pointer]:
                    - generic [ref=e93]: "0"
                - link "@obedjoseph" [ref=e96] [cursor=pointer]:
                  - /url: /sellers/profile/obedjoseph
              - generic [ref=e98]:
                - generic [ref=e101]:
                  - link "obedjoseph" [ref=e102] [cursor=pointer]:
                    - /url: /sellers/profile/obedjoseph
                    - img "obedjoseph" [ref=e103]
                  - button "0" [ref=e104] [cursor=pointer]:
                    - generic [ref=e107]: "0"
                  - button "0" [ref=e108] [cursor=pointer]:
                    - generic [ref=e111]: "0"
                  - button "0" [ref=e112] [cursor=pointer]:
                    - generic [ref=e115]: "0"
                - link "@obedjoseph" [ref=e118] [cursor=pointer]:
                  - /url: /sellers/profile/obedjoseph
              - generic [ref=e120]:
                - generic [ref=e121]:
                  - paragraph [ref=e122]: Local markets, online
                  - heading "Step into a Square" [level=2] [ref=e123]
                  - paragraph [ref=e124]: Communities of traders organised the way Nigeria's physical markets work.
                - generic [ref=e125]:
                  - article [ref=e126]:
                    - link "View Balogun Market Square market square" [ref=e127] [cursor=pointer]:
                      - /url: /squares/balogun-market-lagos
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: BA
                    - generic [ref=e128]:
                      - heading "Balogun Market Square" [level=3] [ref=e129]
                      - paragraph [ref=e130]: Lagos Island, Lagos
                      - generic [ref=e132]:
                        - generic [ref=e133]: 0 traders
                        - generic [ref=e135]: · 0 goods
                        - generic [ref=e136]: Visit
                  - article [ref=e138]:
                    - link "View Bodija Market Square market square" [ref=e139] [cursor=pointer]:
                      - /url: /squares/bodija-market-ibadan
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: BO
                    - generic [ref=e140]:
                      - heading "Bodija Market Square" [level=3] [ref=e141]
                      - paragraph [ref=e142]: Ibadan, Oyo
                      - generic [ref=e144]:
                        - generic [ref=e145]: 0 traders
                        - generic [ref=e147]: · 0 goods
                        - generic [ref=e148]: Visit
                  - article [ref=e150]:
                    - link "View Hamaz Shopping Complex market square" [ref=e151] [cursor=pointer]:
                      - /url: /squares/hamaz-complex-jos
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: HA
                    - generic [ref=e152]:
                      - heading "Hamaz Shopping Complex" [level=3] [ref=e153]
                      - paragraph [ref=e154]: Jos, Plateau
                      - generic [ref=e156]:
                        - generic [ref=e157]: 1 traders
                        - generic [ref=e159]: · 0 goods
                        - generic [ref=e160]: Visit
                  - article [ref=e162]:
                    - link "View Computer Village Square market square" [ref=e163] [cursor=pointer]:
                      - /url: /squares/computer-village-ikeja
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: CO
                    - generic [ref=e164]:
                      - heading "Computer Village Square" [level=3] [ref=e165]
                      - paragraph [ref=e166]: Ikeja, Lagos
                      - generic [ref=e168]:
                        - generic [ref=e169]: 0 traders
                        - generic [ref=e171]: · 0 goods
                        - generic [ref=e172]: Visit
                  - article [ref=e174]:
                    - link "View Yola Central Market Complex market square" [ref=e175] [cursor=pointer]:
                      - /url: /squares/yola-central-market
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: YO
                    - generic [ref=e176]:
                      - heading "Yola Central Market Complex" [level=3] [ref=e177]
                      - paragraph [ref=e178]: Yola, Adamawa
                      - generic [ref=e180]:
                        - generic [ref=e181]: 0 traders
                        - generic [ref=e183]: · 0 goods
                        - generic [ref=e184]: Visit
                  - article [ref=e186]:
                    - link "View Wuse Market Abuja market square" [ref=e187] [cursor=pointer]:
                      - /url: /squares/wuse-market-abuja
                    - generic:
                      - generic: Market
                    - generic:
                      - generic:
                        - generic: WU
                    - generic [ref=e188]:
                      - heading "Wuse Market Abuja" [level=3] [ref=e189]
                      - paragraph [ref=e190]: Abuja, FCT
                      - generic [ref=e192]:
                        - generic [ref=e193]: 0 traders
                        - generic [ref=e195]: · 0 goods
                        - generic [ref=e196]: Visit
                - link "Explore all Squares" [ref=e198] [cursor=pointer]:
                  - /url: /squares
                  - text: Explore all Squares
              - generic [ref=e201]:
                - generic [ref=e203]:
                  - generic [ref=e204]:
                    - link "HausaCaps" [ref=e205] [cursor=pointer]:
                      - /url: /sellers/profile/hausacaps
                      - img "HausaCaps" [ref=e206]
                    - button "Follow" [ref=e207] [cursor=pointer]
                  - button "2" [ref=e209] [cursor=pointer]:
                    - generic [ref=e212]: "2"
                  - button "0" [ref=e213] [cursor=pointer]:
                    - generic [ref=e216]: "0"
                  - button "0" [ref=e217] [cursor=pointer]:
                    - generic [ref=e220]: "0"
                  - button "Unmute" [ref=e221] [cursor=pointer]
                - generic [ref=e224]:
                  - link "HausaCaps" [ref=e226] [cursor=pointer]:
                    - /url: /sellers/profile/hausacaps
                  - paragraph [ref=e227]: 10 views
                  - paragraph [ref=e229]: Hausa Caps
                  - link "Shop Now • ₦40,000" [ref=e230] [cursor=pointer]:
                    - /url: /product/hausa-caps
                    - text: Shop Now • ₦40,000
              - generic [ref=e235]:
                - generic [ref=e237]:
                  - link "joshbj" [ref=e238] [cursor=pointer]:
                    - /url: /profile/joshbj
                    - img "joshbj" [ref=e239]
                  - button "0" [ref=e240] [cursor=pointer]:
                    - generic [ref=e243]: "0"
                  - button "1" [ref=e244] [cursor=pointer]:
                    - generic [ref=e247]: "1"
                  - button "0" [ref=e248] [cursor=pointer]:
                    - generic [ref=e251]: "0"
                - link "@joshbj" [ref=e254] [cursor=pointer]:
                  - /url: /profile/joshbj
              - generic [ref=e256]:
                - generic [ref=e258]:
                  - link "joshjosh" [ref=e259] [cursor=pointer]:
                    - /url: /profile/joshjosh
                    - img "joshjosh" [ref=e260]
                  - button "1" [ref=e261] [cursor=pointer]:
                    - generic [ref=e264]: "1"
                  - button "0" [ref=e265] [cursor=pointer]:
                    - generic [ref=e268]: "0"
                  - button "0" [ref=e269] [cursor=pointer]:
                    - generic [ref=e272]: "0"
                - link "@joshjosh" [ref=e275] [cursor=pointer]:
                  - /url: /profile/joshjosh
              - generic [ref=e277]:
                - generic [ref=e279]:
                  - link "joshjosh" [ref=e280] [cursor=pointer]:
                    - /url: /profile/joshjosh
                    - img "joshjosh" [ref=e281]
                  - button "0" [ref=e282] [cursor=pointer]:
                    - generic [ref=e285]: "0"
                  - button "0" [ref=e286] [cursor=pointer]:
                    - generic [ref=e289]: "0"
                  - button "0" [ref=e290] [cursor=pointer]:
                    - generic [ref=e293]: "0"
                - link "@joshjosh" [ref=e296] [cursor=pointer]:
                  - /url: /profile/joshjosh
              - generic [ref=e298]:
                - generic [ref=e301]:
                  - link "joshbj" [ref=e302] [cursor=pointer]:
                    - /url: /profile/joshbj
                    - img "joshbj" [ref=e303]
                  - button "1" [ref=e304] [cursor=pointer]:
                    - generic [ref=e307]: "1"
                  - button "0" [ref=e308] [cursor=pointer]:
                    - generic [ref=e311]: "0"
                  - button "0" [ref=e312] [cursor=pointer]:
                    - generic [ref=e315]: "0"
                - link "@joshbj" [ref=e318] [cursor=pointer]:
                  - /url: /profile/joshbj
              - generic [ref=e320]:
                - generic [ref=e322]:
                  - link "joshbj" [ref=e323] [cursor=pointer]:
                    - /url: /profile/joshbj
                    - img "joshbj" [ref=e324]
                  - button "1" [ref=e325] [cursor=pointer]:
                    - generic [ref=e328]: "1"
                  - button "1" [ref=e329] [cursor=pointer]:
                    - generic [ref=e332]: "1"
                  - button "0" [ref=e333] [cursor=pointer]:
                    - generic [ref=e336]: "0"
                - link "@joshbj" [ref=e339] [cursor=pointer]:
                  - /url: /profile/joshbj
              - generic [ref=e341]:
                - generic [ref=e343]:
                  - link "joshuabj" [ref=e344] [cursor=pointer]:
                    - /url: /profile/joshuabj
                    - img "joshuabj" [ref=e345]
                  - button "1" [ref=e346] [cursor=pointer]:
                    - generic [ref=e349]: "1"
                  - button "0" [ref=e350] [cursor=pointer]:
                    - generic [ref=e353]: "0"
                  - button "0" [ref=e354] [cursor=pointer]:
                    - generic [ref=e357]: "0"
                - link "@joshuabj" [ref=e360] [cursor=pointer]:
                  - /url: /profile/joshuabj
              - generic [ref=e362]:
                - 'img "#fashion #lifestyle" [ref=e363]'
                - generic [ref=e364]:
                  - link "joshbj" [ref=e365] [cursor=pointer]:
                    - /url: /profile/joshbj
                    - img "joshbj" [ref=e366]
                  - button "0" [ref=e367] [cursor=pointer]:
                    - generic [ref=e370]: "0"
                  - button "0" [ref=e371] [cursor=pointer]:
                    - generic [ref=e374]: "0"
                  - button "0" [ref=e375] [cursor=pointer]:
                    - generic [ref=e378]: "0"
                - generic [ref=e379]:
                  - link "@joshbj" [ref=e381] [cursor=pointer]:
                    - /url: /profile/joshbj
                  - paragraph [ref=e382]: "#fashion #lifestyle"
              - generic [ref=e384]:
                - 'img "#fashion #lifestyle" [ref=e385]'
                - generic [ref=e386]:
                  - link "Opesko" [ref=e387] [cursor=pointer]:
                    - /url: /profile/Opesko
                    - img "Opesko" [ref=e388]
                  - button "1" [ref=e389] [cursor=pointer]:
                    - generic [ref=e392]: "1"
                  - button "2" [ref=e393] [cursor=pointer]:
                    - generic [ref=e396]: "2"
                  - button "0" [ref=e397] [cursor=pointer]:
                    - generic [ref=e400]: "0"
                - generic [ref=e401]:
                  - link "@Opesko" [ref=e403] [cursor=pointer]:
                    - /url: /profile/Opesko
                  - paragraph [ref=e404]: "#fashion #lifestyle"
      - navigation [ref=e405]:
        - generic [ref=e406]:
          - link "Home" [ref=e407] [cursor=pointer]:
            - /url: /
          - link "Discover" [ref=e409] [cursor=pointer]:
            - /url: /discover
          - link "Near Me" [ref=e411] [cursor=pointer]:
            - /url: /map
          - link "Squares" [ref=e413] [cursor=pointer]:
            - /url: /squares
          - link "Sign in" [ref=e415] [cursor=pointer]:
            - /url: /user-login
      - button "Messages & AI" [ref=e417] [cursor=pointer]
  - generic:
    - img
  - generic [ref=e419]:
    - button "Toggle Nuxt DevTools" [ref=e420] [cursor=pointer]:
      - img [ref=e421]
    - generic "Page load time" [ref=e424]:
      - generic [ref=e425]: "150"
      - generic [ref=e426]: ms
    - button "Toggle Component Inspector" [ref=e428] [cursor=pointer]:
      - img [ref=e429]
```

# Test source

```ts
  55  | 
  56  |   test('Near Me nav link is present', async ({ page }) => {
  57  |     await expect(sideNav(page).locator('a[href="/map"]')).toBeVisible(T)
  58  |   })
  59  | 
  60  |   test('Squares nav link is present', async ({ page }) => {
  61  |     await expect(sideNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  62  |   })
  63  | 
  64  |   test('Discover link navigates to /discover', async ({ page }) => {
  65  |     await sideNav(page)
  66  |       .getByRole('link', { name: /^discover$/i })
  67  |       .click()
  68  |     await expect(page).toHaveURL('/discover', T)
  69  |   })
  70  | 
  71  |   test('Squares link navigates to /squares', async ({ page }) => {
  72  |     await sideNav(page).locator('a[href="/squares"]').click()
  73  |     await expect(page).toHaveURL('/squares', T)
  74  |   })
  75  | 
  76  |   test('Reels link navigates to /reels', async ({ page }) => {
  77  |     await sideNav(page).locator('a[href="/reels"]').click()
  78  |     await expect(page).toHaveURL('/reels', T)
  79  |   })
  80  | 
  81  |   test('guest sees Create link pointing to /user-register', async ({
  82  |     page,
  83  |   }) => {
  84  |     await expect(sideNav(page).locator('a[href="/user-register"]')).toBeVisible(
  85  |       T,
  86  |     )
  87  |   })
  88  | })
  89  | 
  90  | test.describe('desktop SideNav — active state', () => {
  91  |   test.use({ viewport: { width: 1440, height: 900 } })
  92  | 
  93  |   test('Home link has active class when on /', async ({ page }) => {
  94  |     // MinimalHome's autoplaying/looping video slides keep the network busy
  95  |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  96  |     // reaches 'networkidle'.
  97  |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  98  |     // Two a[href="/"] exist: logo + nav-button. Target only the nav-button.
  99  |     await expect(sideNav(page).locator('a.nav-button[href="/"]')).toHaveClass(
  100 |       /active/,
  101 |       T,
  102 |     )
  103 |   })
  104 | 
  105 |   test('Discover link has active class when on /discover', async ({ page }) => {
  106 |     await page.goto('/discover', { waitUntil: 'networkidle' })
  107 |     await expect(sideNav(page).locator('a[href="/discover"]')).toHaveClass(
  108 |       /active/,
  109 |       T,
  110 |     )
  111 |   })
  112 | 
  113 |   test('Squares link has active class when on /squares', async ({ page }) => {
  114 |     await page.goto('/squares', { waitUntil: 'networkidle' })
  115 |     await expect(sideNav(page).locator('a[href="/squares"]')).toHaveClass(
  116 |       /active/,
  117 |       T,
  118 |     )
  119 |   })
  120 | })
  121 | 
  122 | // ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────────────
  123 | 
  124 | test.describe('mobile BottomNav — guest', () => {
  125 |   test.use({ viewport: { width: 390, height: 844 } })
  126 | 
  127 |   test.beforeEach(async ({ page }) => {
  128 |     // MinimalHome's autoplaying/looping video slides keep the network busy
  129 |     // indefinitely, same as SSE/WS pages elsewhere in this suite — never
  130 |     // reaches 'networkidle'.
  131 |     await page.goto('/', { waitUntil: 'domcontentloaded' })
  132 |   })
  133 | 
  134 |   test('bottom nav bar is visible', async ({ page }) => {
  135 |     await expect(bottomNav(page)).toBeVisible(T)
  136 |   })
  137 | 
  138 |   test('Home icon link is present in bottom nav', async ({ page }) => {
  139 |     await expect(bottomNav(page).locator('a[href="/"]')).toBeVisible(T)
  140 |   })
  141 | 
  142 |   test('Near Me icon link is present in bottom nav', async ({ page }) => {
  143 |     await expect(bottomNav(page).locator('a[href="/map"]')).toBeVisible(T)
  144 |   })
  145 | 
  146 |   test('Squares icon link is present in bottom nav', async ({ page }) => {
  147 |     await expect(bottomNav(page).locator('a[href="/squares"]')).toBeVisible(T)
  148 |   })
  149 | 
  150 |   test('guest sees "Start selling" CTA in bottom nav (goes to /user-register)', async ({
  151 |     page,
  152 |   }) => {
  153 |     await expect(
  154 |       bottomNav(page).locator('a[href="/user-register"]'),
> 155 |     ).toBeVisible(T)
      |       ^ Error: expect(locator).toBeVisible() failed
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
  247 |     await expect(createBtn).toBeVisible(T)
  248 |   })
  249 | })
  250 | 
  251 | // ── PAGE META / SEO ───────────────────────────────────────────────────────────
  252 | 
  253 | test.describe('page meta tags', () => {
  254 |   for (const { route, label } of [
  255 |     { route: '/', label: 'home' },
```