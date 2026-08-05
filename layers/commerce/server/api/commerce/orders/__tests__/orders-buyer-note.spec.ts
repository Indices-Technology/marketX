import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import {
  apiLogin,
  TEST_USER,
  getFirstProductSlug,
} from '../../../../../../../tests/helpers/auth'

const ORDERS = '/api/commerce/orders'
const ORDER = (id: number | string) => `/api/commerce/orders/${id}`

/**
 * Resolve an in-stock variant AND its seller store_slug from the same product —
 * the buyerNote keys on the seller slug the order groups under, so both must come
 * from one product or the note won't attach.
 */
async function resolveOrderTarget(request: APIRequestContext) {
  const slug = await getFirstProductSlug(request)
  const res = await request.get(`/api/commerce/products/by-slug/${slug}`)
  const body = await res.json()
  const variants: Array<{ id: number; stock: number }> = body.data?.variants ?? []
  const variant = variants.find((v) => v.stock > 0) ?? variants[0]
  const storeSlug: string | undefined = body.data?.seller?.store_slug
  if (!variant?.id || !storeSlug)
    throw new Error(`Could not resolve variant + store_slug for "${slug}"`)
  return { variantId: variant.id, storeSlug }
}

const baseOrder = (variantId: number) => ({
  items: [{ variantId, quantity: 1 }],
  name: 'Test Buyer',
  address: '1 Marina Street',
  zipcode: '100001',
  country: 'NG',
  shippingCost: 0,
})

test.describe('POST /api/commerce/orders — buyer note', () => {
  test('masks contact info in the note, keeps the instruction, and persists it', async ({
    request,
  }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const { variantId, storeSlug } = await resolveOrderTarget(request)

    const res = await request.post(ORDERS, {
      data: {
        ...baseOrder(variantId),
        buyerNotes: [
          {
            storeSlug,
            note: 'Please call me on 08012345678 before delivery, the gate is locked',
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.ok(), await res.text()).toBe(true)
    const body = await res.json()
    const note: string | null = body.data?.buyerNote
    const orderId: number = body.data?.id

    // The instruction survives, the phone number does not.
    expect(note).toBeTruthy()
    expect(note).toContain('the gate is locked')
    expect(note).toContain('[hidden]')
    expect(note).not.toMatch(/08012345678/)

    // Persisted: reading the order back yields the same masked snapshot.
    const readBack = await request.get(ORDER(orderId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(readBack.ok()).toBe(true)
    const readBody = await readBack.json()
    expect(readBody.data?.buyerNote).toBe(note)
  })

  test('caps the stored note at 280 characters', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const { variantId, storeSlug } = await resolveOrderTarget(request)

    const res = await request.post(ORDERS, {
      data: {
        ...baseOrder(variantId),
        buyerNotes: [{ storeSlug, note: 'a'.repeat(400) }],
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.ok(), await res.text()).toBe(true)
    const body = await res.json()
    expect(body.data?.buyerNote?.length).toBe(280)
  })

  test('no note → order has no buyerNote', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_USER)
    const { variantId } = await resolveOrderTarget(request)

    const res = await request.post(ORDERS, {
      data: baseOrder(variantId),
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.ok(), await res.text()).toBe(true)
    const body = await res.json()
    expect(body.data?.buyerNote ?? null).toBeNull()
  })
})
