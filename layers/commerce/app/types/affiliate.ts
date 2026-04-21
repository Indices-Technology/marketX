export interface AffiliateStatus {
  isEnrolled: boolean
  affiliateCode: string | null
  stats: {
    totalEarnings: number
    pendingEarnings: number
    totalConversions: number
  }
}

export interface AffiliateEnrollment {
  isEnrolled: boolean
  affiliateCode: string
}

export interface Referral {
  id: number
  date: string
  commission: number  // kobo
  status: string
  products: Array<{ title: string; slug: string }>
}

export interface ReferralsResponse {
  referrals: Referral[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface Promoter {
  id: string
  username: string
  avatar: string | null
  totalEarned: number  // kobo
  orderCount: number
}

export interface PromotersResponse {
  promoters: Promoter[]
  total: number
}
