import { describe, it, expect } from 'vitest'
import { summarizeScans } from '../scanStats'

const now = new Date('2026-07-22T12:00:00Z').getTime()

describe('summarizeScans', () => {
  it('totals scans, conversions, rate, surfaces and a 14-day trend', () => {
    const stats = summarizeScans(
      [
        { surface: 'CARD', orderId: 10, created_at: '2026-07-22T09:00:00Z' },
        { surface: 'CARD', orderId: null, created_at: '2026-07-22T08:00:00Z' },
        { surface: 'card', orderId: null, created_at: '2026-07-21T08:00:00Z' },
        {
          surface: 'PARCEL',
          orderId: null,
          created_at: '2026-07-20T08:00:00Z',
        },
        { surface: null, orderId: null, created_at: '2026-07-10T08:00:00Z' },
      ],
      now,
    )

    expect(stats.totalScans).toBe(5)
    expect(stats.conversions).toBe(1)
    expect(stats.conversionRate).toBeCloseTo(20)

    // case-insensitive surface merge; sorted by count desc
    const card = stats.bySurface.find((s) => s.surface === 'CARD')
    expect(card?.count).toBe(3)
    expect(stats.bySurface[0]!.surface).toBe('CARD')
    expect(stats.bySurface.find((s) => s.surface === 'UNKNOWN')?.count).toBe(1)

    // trend is exactly 14 days, oldest→newest, today last
    expect(stats.daily).toHaveLength(14)
    expect(stats.daily[13]!.date).toBe('2026-07-22')
    expect(stats.daily[13]!.count).toBe(2) // two scans today
    expect(stats.daily[12]!.count).toBe(1) // yesterday
  })

  it('handles an empty ledger', () => {
    const stats = summarizeScans([], now)
    expect(stats.totalScans).toBe(0)
    expect(stats.conversionRate).toBe(0)
    expect(stats.bySurface).toEqual([])
    expect(stats.daily).toHaveLength(14)
  })
})
