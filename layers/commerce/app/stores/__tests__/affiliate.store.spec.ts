import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAffiliateStore } from '../affiliate.store'

describe('affiliate.store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('initialises with zero earnings and not enrolled', () => {
    const store = useAffiliateStore()
    expect(store.isEnrolled).toBe(false)
    expect(store.affiliateCode).toBeNull()
    expect(store.stats.totalEarnings).toBe(0)
    expect(store.stats.pendingEarnings).toBe(0)
    expect(store.stats.totalConversions).toBe(0)
  })

  it('does not expose totalClicks or conversionRate', () => {
    const store = useAffiliateStore()
    expect((store.stats as Record<string, unknown>).totalClicks).toBeUndefined()
    expect((store.stats as Record<string, unknown>).conversionRate).toBeUndefined()
  })

  it('setStatus updates enrollment and stats', () => {
    const store = useAffiliateStore()
    store.setStatus(true, 'josh_abc123', {
      totalEarnings: 5000,
      pendingEarnings: 1200,
      totalConversions: 8,
    })
    expect(store.isEnrolled).toBe(true)
    expect(store.affiliateCode).toBe('josh_abc123')
    expect(store.stats.totalEarnings).toBe(5000)
    expect(store.stats.pendingEarnings).toBe(1200)
    expect(store.stats.totalConversions).toBe(8)
  })

  it('setStatus partial update preserves existing fields', () => {
    const store = useAffiliateStore()
    store.setStatus(true, 'code1', { totalEarnings: 100, pendingEarnings: 50, totalConversions: 2 })
    store.setStatus(true, 'code1', { totalEarnings: 200 })
    expect(store.stats.pendingEarnings).toBe(50)
    expect(store.stats.totalConversions).toBe(2)
    expect(store.stats.totalEarnings).toBe(200)
  })

  it('setError stores message and setLoading reflects state', () => {
    const store = useAffiliateStore()
    store.setError('network failure')
    expect(store.error).toBe('network failure')
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('setReferrals stores referral list', () => {
    const store = useAffiliateStore()
    const referrals = [{ id: 'r1', commission: 500 }, { id: 'r2', commission: 250 }]
    store.setReferrals(referrals)
    expect(store.referrals).toHaveLength(2)
    expect(store.referrals[0].id).toBe('r1')
  })
})
