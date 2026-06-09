import { ref, computed } from 'vue'

const TTL_MS = 3 * 60 * 1000 // 3-min client cache

export interface SidebarTag {
  id: number
  name: string
  _count: { products: number }
}

export interface SidebarProduct {
  id: number
  title: string
  slug: string
  price: number
  discount?: number | null
  store_slug?: string | null
  viewCount?: number | null
  seller?: { store_name: string | null; store_slug: string } | null
  media?: Array<{ url: string; type: string }>
}

export interface SidebarSeller {
  id: string
  store_name: string | null
  store_slug: string
  store_logo?: string | null
  is_verified: boolean
  followers_count: number
  _count: { products: number }
}

export interface SidebarDeal {
  id: number
  title: string
  slug: string
  price: number
  discount?: number | null
  dealEndsAt?: string | Date | null
  store_slug?: string | null
  seller?: { store_name: string | null; store_slug: string } | null
  media?: Array<{ url: string; type: string }>
}

interface CacheState {
  trendingTags: SidebarTag[]
  trendingProducts: SidebarProduct[]
  featuredSellers: SidebarSeller[]
  activeDeals: SidebarDeal[]
  fetchedAt: number
}

export const useRightSidebarData = () => {
  const cache = useState<CacheState | null>(
    '__right_sidebar_cache__',
    () => null,
  )
  const loadingTrending = ref(false)
  const loadingDeals = ref(false)

  const isStale = () =>
    !cache.value || Date.now() - cache.value.fetchedAt > TTL_MS

  const load = async () => {
    if (!isStale()) return
    loadingTrending.value = true
    loadingDeals.value = true

    const [tRes, dRes] = await Promise.allSettled([
      $fetch<{
        success: boolean
        data: {
          trendingTags: SidebarTag[]
          trendingProducts: SidebarProduct[]
          featuredSellers: SidebarSeller[]
        }
      }>('/api/feed/trending'),
      $fetch<{ success: boolean; data: SidebarDeal[] }>(
        '/api/feed/deals?limit=4',
      ),
    ])

    loadingTrending.value = false
    loadingDeals.value = false

    const td = tRes.status === 'fulfilled' ? tRes.value?.data : null
    const dd = dRes.status === 'fulfilled' ? dRes.value?.data ?? [] : []

    cache.value = {
      trendingTags: td?.trendingTags ?? [],
      trendingProducts: (td?.trendingProducts ?? []).slice(0, 5),
      featuredSellers: td?.featuredSellers ?? [],
      activeDeals: dd,
      fetchedAt: Date.now(),
    }
  }

  return {
    trendingTags: computed(() => cache.value?.trendingTags ?? []),
    trendingProducts: computed(() => cache.value?.trendingProducts ?? []),
    featuredSellers: computed(() => cache.value?.featuredSellers ?? []),
    activeDeals: computed(() => cache.value?.activeDeals ?? []),
    loadingTrending,
    loadingDeals,
    hasData: computed(() => !!cache.value),
    load,
  }
}
