# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\commerce\server\api\commerce\orders\__tests__\orders-buyer-note.spec.ts >> POST /api/commerce/orders — buyer note >> no note → order has no buyerNote
- Location: layers\commerce\server\api\commerce\orders\__tests__\orders-buyer-note.spec.ts:95:3

# Error details

```
Error: {
  "error": true,
  "url": "http://localhost:3000/api/commerce/orders",
  "statusCode": 401,
  "statusMessage": "Unauthorized - Invalid or expired token",
  "message": "Unauthorized - Invalid or expired token",
  "stack": [
    "Unauthorized - Invalid or expired token",
    "at createError (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/h3/dist/index.mjs:71:15)",
    "at async (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/server/layers/shared/middleware/requireAuth.ts:58:1)",
    "at Object.async (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/layers/commerce/server/api/commerce/orders/index.post.ts:11:1)",
    "at Object.handler (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/h3/dist/index.mjs:1940:24)",
    "at Object.handler (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/h3/dist/index.mjs:2263:34)",
    "at C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/h3/dist/index.mjs:2017:31)",
    "at async Object.callAsync (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/unctx/dist/index.mjs:72:16)",
    "at async Object.callAsync (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/unctx/dist/index.mjs:72:16)",
    "at async Server.toNodeHandle (C:/Users/PRECISION 7530/source/repos/INDICES/marketX/node_modules/h3/dist/index.mjs:2316:7)"
  ]
}

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  4   |   apiLogin,
  5   |   TEST_USER,
  6   |   getFirstProductSlug,
  7   | } from '../../../../../../../tests/helpers/auth'
  8   | 
  9   | const ORDERS = '/api/commerce/orders'
  10  | const ORDER = (id: number | string) => `/api/commerce/orders/${id}`
  11  | 
  12  | /**
  13  |  * Resolve an in-stock variant AND its seller store_slug from the same product —
  14  |  * the buyerNote keys on the seller slug the order groups under, so both must come
  15  |  * from one product or the note won't attach.
  16  |  */
  17  | async function resolveOrderTarget(request: APIRequestContext) {
  18  |   const slug = await getFirstProductSlug(request)
  19  |   const res = await request.get(`/api/commerce/products/by-slug/${slug}`)
  20  |   const body = await res.json()
  21  |   const variants: Array<{ id: number; stock: number }> = body.data?.variants ?? []
  22  |   const variant = variants.find((v) => v.stock > 0) ?? variants[0]
  23  |   const storeSlug: string | undefined = body.data?.seller?.store_slug
  24  |   if (!variant?.id || !storeSlug)
  25  |     throw new Error(`Could not resolve variant + store_slug for "${slug}"`)
  26  |   return { variantId: variant.id, storeSlug }
  27  | }
  28  | 
  29  | const baseOrder = (variantId: number) => ({
  30  |   items: [{ variantId, quantity: 1 }],
  31  |   name: 'Test Buyer',
  32  |   address: '1 Marina Street',
  33  |   zipcode: '100001',
  34  |   country: 'NG',
  35  |   shippingCost: 0,
  36  | })
  37  | 
  38  | test.describe('POST /api/commerce/orders — buyer note', () => {
  39  |   test('masks contact info in the note, keeps the instruction, and persists it', async ({
  40  |     request,
  41  |   }) => {
  42  |     const { token } = await apiLogin(request, TEST_USER)
  43  |     const { variantId, storeSlug } = await resolveOrderTarget(request)
  44  | 
  45  |     const res = await request.post(ORDERS, {
  46  |       data: {
  47  |         ...baseOrder(variantId),
  48  |         buyerNotes: [
  49  |           {
  50  |             storeSlug,
  51  |             note: 'Please call me on 08012345678 before delivery, the gate is locked',
  52  |           },
  53  |         ],
  54  |       },
  55  |       headers: { Authorization: `Bearer ${token}` },
  56  |     })
  57  | 
  58  |     expect(res.ok(), await res.text()).toBe(true)
  59  |     const body = await res.json()
  60  |     const note: string | null = body.data?.buyerNote
  61  |     const orderId: number = body.data?.id
  62  | 
  63  |     // The instruction survives, the phone number does not.
  64  |     expect(note).toBeTruthy()
  65  |     expect(note).toContain('the gate is locked')
  66  |     expect(note).toContain('[hidden]')
  67  |     expect(note).not.toMatch(/08012345678/)
  68  | 
  69  |     // Persisted: reading the order back yields the same masked snapshot.
  70  |     const readBack = await request.get(ORDER(orderId), {
  71  |       headers: { Authorization: `Bearer ${token}` },
  72  |     })
  73  |     expect(readBack.ok()).toBe(true)
  74  |     const readBody = await readBack.json()
  75  |     expect(readBody.data?.buyerNote).toBe(note)
  76  |   })
  77  | 
  78  |   test('caps the stored note at 280 characters', async ({ request }) => {
  79  |     const { token } = await apiLogin(request, TEST_USER)
  80  |     const { variantId, storeSlug } = await resolveOrderTarget(request)
  81  | 
  82  |     const res = await request.post(ORDERS, {
  83  |       data: {
  84  |         ...baseOrder(variantId),
  85  |         buyerNotes: [{ storeSlug, note: 'a'.repeat(400) }],
  86  |       },
  87  |       headers: { Authorization: `Bearer ${token}` },
  88  |     })
  89  | 
  90  |     expect(res.ok(), await res.text()).toBe(true)
  91  |     const body = await res.json()
  92  |     expect(body.data?.buyerNote?.length).toBe(280)
  93  |   })
  94  | 
  95  |   test('no note → order has no buyerNote', async ({ request }) => {
  96  |     const { token } = await apiLogin(request, TEST_USER)
  97  |     const { variantId } = await resolveOrderTarget(request)
  98  | 
  99  |     const res = await request.post(ORDERS, {
  100 |       data: baseOrder(variantId),
  101 |       headers: { Authorization: `Bearer ${token}` },
  102 |     })
  103 | 
> 104 |     expect(res.ok(), await res.text()).toBe(true)
      |                                        ^ Error: {
  105 |     const body = await res.json()
  106 |     expect(body.data?.buyerNote ?? null).toBeNull()
  107 |   })
  108 | })
  109 | 
```