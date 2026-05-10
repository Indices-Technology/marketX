import { ref, onMounted, onUnmounted } from 'vue'
import { useFeedApi } from '../services/feed.api'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import { getCachedLocation } from '~~/layers/map/app/composables/useMapSellers'
import type { IMapSeller } from '~~/layers/map/app/types/map.types'
import type { IFeedItem } from '../types/feed.types'

function observeOnce(el: HTMLElement, cb: () => void, rootMargin = '200px') {
  const obs = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) { cb(); obs.disconnect() }
    },
    { rootMargin },
  )
  obs.observe(el)
  return obs
}

export function useMarketHome() {
  const feedApi = useFeedApi()
  const squareApi = useSquareApi()

  // ── 1. Deals ───────────────────────────────────────────────────────────────
  const deals = ref<any[]>([])
  const dealsLoading = ref(true)

  async function loadDeals() {
    try {
      const res: any = await feedApi.getDealsFeed({ limit: 20 })
      deals.value = res.data ?? []
    } catch {}
    finally { dealsLoading.value = false }
  }

  // ── 2. Squares ─────────────────────────────────────────────────────────────
  const squares = ref<any[]>([])
  const squaresLoading = ref(true)

  async function loadSquares() {
    try {
      const res: any = await squareApi.listSquares({ limit: 8 })
      squares.value = res.data ?? []
    } catch {}
    finally { squaresLoading.value = false }
  }

  // ── 3. Sellers online (deferred, location-based) ───────────────────────────
  const section3Ref = ref<HTMLElement | null>(null)
  const section3Loaded = ref(false)
  const onlineSellers = ref<IMapSeller[]>([])
  const sellersLoading = ref(false)
  const sellersRequesting = ref(false)

  async function fetchSellersWithCoords(lat: number, lng: number) {
    sellersLoading.value = true
    try {
      const data: any = await $fetch('/api/map/sellers', {
        query: { lat, lng, radius: 20000, limit: 12 },
      })
      const all: IMapSeller[] = data.data ?? []
      onlineSellers.value = all.filter((s) => s.isOpenNow).length
        ? all.filter((s) => s.isOpenNow)
        : all
    } catch {}
    finally { sellersLoading.value = false }
  }

  async function requestSellerLocation() {
    if (!import.meta.client || !navigator.geolocation) return
    sellersRequesting.value = true
    try {
      const pos = await new Promise<{ coords: { latitude: number; longitude: number } }>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition((p) => resolve(p), reject, { timeout: 8000 }),
      )
      await fetchSellersWithCoords(pos.coords.latitude, pos.coords.longitude)
    } catch {}
    finally { sellersRequesting.value = false }
  }

  async function initSellers() {
    section3Loaded.value = true
    const cached = getCachedLocation()
    if (cached) { await fetchSellersWithCoords(cached.lat, cached.lng); return }
    const perm = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null)
    if (perm?.state === 'granted') await requestSellerLocation()
  }

  // ── 4. Fresh stock (deferred) ──────────────────────────────────────────────
  const section4Ref = ref<HTMLElement | null>(null)
  const freshItems = ref<any[]>([])
  const freshLoading = ref(false)

  async function loadFreshStock() {
    freshLoading.value = true
    try {
      const res: any = await feedApi.getFreshDrops({ limit: 20 })
      freshItems.value = res.data ?? []
    } catch {}
    finally { freshLoading.value = false }
  }

  // ── 5. Market posts (deferred) ─────────────────────────────────────────────
  const section5Ref = ref<HTMLElement | null>(null)
  const marketPosts = ref<IFeedItem[]>([])
  const postsLoading = ref(false)

  async function loadMarketPosts() {
    postsLoading.value = true
    try {
      const res: any = await feedApi.getHomeFeed({ limit: 10 })
      const items: IFeedItem[] = res.items ?? res.data ?? []
      marketPosts.value = items.filter((i: any) => i.type === 'POST').slice(0, 5)
    } catch {}
    finally { postsLoading.value = false }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  const observers: IntersectionObserver[] = []

  onMounted(() => {
    Promise.all([loadDeals(), loadSquares()])
    if (section3Ref.value) observers.push(observeOnce(section3Ref.value, initSellers))
    if (section4Ref.value) observers.push(observeOnce(section4Ref.value, loadFreshStock))
    if (section5Ref.value) observers.push(observeOnce(section5Ref.value, loadMarketPosts))
  })

  onUnmounted(() => observers.forEach((o) => o.disconnect()))

  return {
    // Deals
    deals, dealsLoading,
    // Squares
    squares, squaresLoading,
    // Sellers
    section3Ref, section3Loaded, onlineSellers, sellersLoading, sellersRequesting,
    requestSellerLocation,
    // Fresh stock
    section4Ref, freshItems, freshLoading,
    // Posts
    section5Ref, marketPosts, postsLoading,
  }
}
