interface AffiliateStats {
  totalEarnings: number
  pendingEarnings: number
  totalConversions: number
}

interface AffiliateReferral {
  id: string
  [key: string]: unknown
}

export const useAffiliateStore = defineStore('affiliate', () => {
  const isEnrolled = ref(false)
  const affiliateCode = ref<string | null>(null)
  const stats = ref<AffiliateStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalConversions: 0,
  })
  const referrals = ref<AffiliateReferral[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  return {
    isEnrolled,
    affiliateCode,
    stats,
    referrals,
    isLoading,
    error,
    setStatus: (enrolled: boolean, code: string | null, newStats: Partial<AffiliateStats>) => {
      isEnrolled.value = enrolled
      affiliateCode.value = code
      stats.value = { ...stats.value, ...newStats }
    },
    setReferrals: (r: AffiliateReferral[]) => {
      referrals.value = r
    },
    /**
     * Wipe every user-scoped value. MUST run on logout — otherwise the previous
     * user's affiliateCode survives in memory and a guest (or the next account)
     * gets shown someone else's referral link.
     */
    clearStore: () => {
      isEnrolled.value = false
      affiliateCode.value = null
      stats.value = { totalEarnings: 0, pendingEarnings: 0, totalConversions: 0 }
      referrals.value = []
      isLoading.value = false
      error.value = null
    },
    setLoading: (val: boolean) => {
      isLoading.value = val
    },
    setError: (val: string | null) => {
      error.value = val
    },
  }
})
