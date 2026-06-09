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
    setLoading: (val: boolean) => {
      isLoading.value = val
    },
    setError: (val: string | null) => {
      error.value = val
    },
  }
})
