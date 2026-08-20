# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\core\server\api\search\__tests__\search.spec.ts >> public profile — no private seller data >> GET /api/profile/:username omits GPS, shipFrom, verification, email
- Location: layers\core\server\api\search\__tests__\search.spec.ts:115:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  21  |     const body = await res.json()
  22  |     expect(body.success).toBe(true)
  23  |     expect(body.data).toHaveProperty('users')
  24  |     expect(body.data).toHaveProperty('products')
  25  |     expect(body.data).toHaveProperty('posts')
  26  |     expect(body.data).toHaveProperty('stores')
  27  |     expect(body.data).toHaveProperty('tags')
  28  |   })
  29  | 
  30  |   test('GET /api/search returns results for valid query', async ({ request }) => {
  31  |     const res = await request.get(`${SEARCH}?q=adire`)
  32  |     expect(res.status()).toBe(200)
  33  |     const body = await res.json()
  34  |     expect(body.success).toBe(true)
  35  |     // Products with "adire" in seed data should match
  36  |     expect(body.data.products).toBeInstanceOf(Array)
  37  |   })
  38  | 
  39  |   test('GET /api/search?type=products filters by type', async ({ request }) => {
  40  |     const res = await request.get(`${SEARCH}?q=fashion&type=products`)
  41  |     expect(res.status()).toBe(200)
  42  |     const body = await res.json()
  43  |     expect(body.data.users).toHaveLength(0)
  44  |     expect(body.data.posts).toHaveLength(0)
  45  |     expect(body.data.products).toBeInstanceOf(Array)
  46  |   })
  47  | 
  48  |   test('GET /api/search?type=stores filters by stores', async ({ request }) => {
  49  |     const res = await request.get(`${SEARCH}?q=balogun&type=stores`)
  50  |     expect(res.status()).toBe(200)
  51  |     const body = await res.json()
  52  |     expect(body.data.stores).toBeInstanceOf(Array)
  53  |   })
  54  | 
  55  |   test('GET /api/search respects limit param', async ({ request }) => {
  56  |     const res = await request.get(`${SEARCH}?q=a&limit=2`)
  57  |     // Short query returns empty — limit is still respected
  58  |     expect(res.status()).toBe(200)
  59  |   })
  60  | })
  61  | 
  62  | // ─── PII / privacy ────────────────────────────────────────────────────────────
  63  | 
  64  | test.describe('search — privacy', () => {
  65  |   test('user results never include email', async ({ request }) => {
  66  |     // "balogun" matches a seed username
  67  |     const res = await request.get(`${SEARCH}?q=balogun&type=users`)
  68  |     expect(res.status()).toBe(200)
  69  |     const users = (await res.json()).data.users as Array<Record<string, unknown>>
  70  |     expect(Array.isArray(users)).toBe(true)
  71  |     for (const u of users) {
  72  |       expect(u).not.toHaveProperty('email')
  73  |     }
  74  |   })
  75  | 
  76  |   test('cannot enumerate accounts by email substring', async ({ request }) => {
  77  |     // All seed accounts share the @peppr.test domain — before the fix this
  78  |     // returned every user; now email is neither matched nor returned.
  79  |     const res = await request.get(`${SEARCH}?q=peppr.test&type=users`)
  80  |     expect(res.status()).toBe(200)
  81  |     expect((await res.json()).data.users).toHaveLength(0)
  82  |   })
  83  | 
  84  |   test('PRIVATE posts do not appear in search results', async ({ request }) => {
  85  |     const { token } = await apiLogin(request, TEST_SELLER)
  86  |     const stamp = Date.now()
  87  |     const term = `srchprobe${stamp}`
  88  |     const mk = async (visibility: string, caption: string) =>
  89  |       (
  90  |         await (
  91  |           await request.post(POSTS, {
  92  |             data: { caption, visibility, contentType: 'INSPIRATION' },
  93  |             headers: { Authorization: `Bearer ${token}` },
  94  |           })
  95  |         ).json()
  96  |       ).data
  97  |     const priv = await mk('PRIVATE', `${term} private`)
  98  |     const pub = await mk('PUBLIC', `${term} public`)
  99  | 
  100 |     const res = await request.get(`${SEARCH}?q=${term}&type=posts`)
  101 |     expect(res.status()).toBe(200)
  102 |     const ids = ((await res.json()).data.posts as Array<{ id: string }>).map((p) => String(p.id))
  103 |     expect(ids).not.toContain(String(priv.id)) // leak guard
  104 |     expect(ids).toContain(String(pub.id)) // public one is findable
  105 | 
  106 |     // cleanup
  107 |     for (const id of [priv.id, pub.id])
  108 |       await request.delete(`${POSTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  109 |   })
  110 | })
  111 | 
  112 | // ─── Profile data exposure ──────────────────────────────────────────────────────
  113 | 
  114 | test.describe('public profile — no private seller data', () => {
  115 |   test('GET /api/profile/:username omits GPS, shipFrom, verification, email', async ({
  116 |     request,
  117 |   }: {
  118 |     request: APIRequestContext
  119 |   }) => {
  120 |     const res = await request.get(`/api/profile/${TEST_SELLER.username}`)
> 121 |     expect(res.status()).toBe(200)
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  122 |     const data = (await res.json()).data
  123 |     expect(data).not.toHaveProperty('email')
  124 |     const seller = data.sellerProfile
  125 |     expect(seller).toBeTruthy()
  126 |     for (const leaked of [
  127 |       'latitude',
  128 |       'longitude',
  129 |       'shipFromAddress',
  130 |       'shipFromPhone',
  131 |       'shipFromZip',
  132 |       'verification_status',
  133 |       'verification_reason',
  134 |       'profileId',
  135 |     ]) {
  136 |       expect(seller).not.toHaveProperty(leaked)
  137 |     }
  138 |     // public fields are still present
  139 |     expect(seller).toHaveProperty('store_slug')
  140 |     expect(seller).toHaveProperty('store_name')
  141 |   })
  142 | })
  143 | 
```