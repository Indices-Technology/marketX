import { test, expect } from '@playwright/test'

const ZONES = '/api/commerce/shipping/zones'
const CALCULATE = '/api/commerce/shipping/calculate'
const RATES = '/api/commerce/shipping/rates'
const TRACK = (num: string) => `/api/commerce/shipping/track/${num}`

// ─── Public endpoints ─────────────────────────────────────────────────────────

test.describe('shipping — public endpoints', () => {
  test('GET /api/commerce/shipping/zones returns active zones', async ({ request }) => {
    const res = await request.get(ZONES)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('POST /api/commerce/shipping/calculate returns cost for NG', async ({ request }) => {
    const res = await request.post(CALCULATE, {
      data: { countryCode: 'NG', weightKg: 1 },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('cost')
    expect(body.data).toHaveProperty('estimatedDays')
  })

  test('POST /api/commerce/shipping/calculate uses default weight when omitted', async ({ request }) => {
    const res = await request.post(CALCULATE, {
      data: { countryCode: 'US' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(typeof body.data.cost).toBe('number')
  })

  test('POST /api/commerce/shipping/calculate returns 400 for invalid countryCode', async ({ request }) => {
    const res = await request.post(CALCULATE, {
      data: { countryCode: 'TOOLONG' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/shipping/calculate returns 400 for missing countryCode', async ({ request }) => {
    const res = await request.post(CALCULATE, {
      data: { weightKg: 1 },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/commerce/shipping/rates returns fallback when no from address', async ({ request }) => {
    // When no storeSlug and no from provided, returns empty fallback
    const res = await request.post(RATES, {
      data: {
        to: { name: 'Test', street1: '123 Main', city: 'Lagos', state: 'Lagos', zip: '100001', country: 'NG' },
        parcel: { length: 10, width: 10, height: 10, weight: 0.5 },
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    // No from address → fallback=true, data=[]
    expect(body.fallback).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
  })

  test('POST /api/commerce/shipping/rates returns 400 without to', async ({ request }) => {
    const res = await request.post(RATES, {
      data: { parcel: { weight: 0.5 } },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/commerce/shipping/track/:number returns 4xx for unknown tracking number', async ({ request }) => {
    const res = await request.get(TRACK('UNKNOWN12345'))
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(600)
  })
})
