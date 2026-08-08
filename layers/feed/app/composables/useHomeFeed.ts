import { ref, computed } from 'vue'
import { useFeedApi } from '~~/layers/feed/app/services/feed.api'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'
import {
  normalizeProductToFeedItem,
  type RawProductRow,
} from '~~/layers/feed/app/utils/normalizeProduct'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { FeedTab } from '~~/layers/feed/app/composables/useFeedTab'

/**
 * Data layer for MinimalHome.vue's full-screen feed. Fetches posts, products,
 * and reels as three separate pools (tab-aware, same endpoints SocialFeed.vue
 * uses) and interleaves them client-side so a single content type — posts,
 * being more numerous — can't bury the others in the scroll.
 */
export const useHomeFeed = () => {
  const feedApi = useFeedApi()
  const productApi = useProductApi()
  const pending = ref(true)
  const posts = ref<IFeedItem[]>([])
  const products = ref<IFeedItem[]>([])
  const reels = ref<IFeedItem[]>([])
  const catalogProducts = ref<IFeedItem[]>([])

  // Mirrors SocialFeed.vue's fetchFeedForTab — same endpoint-per-tab mapping.
  const fetchTabItems = async (tab: FeedTab): Promise<IFeedItem[]> => {
    if (tab === 'following') {
      const res = await feedApi.getFollowingFeed({ limit: 50 })
      return res.items ?? []
    }
    if (tab === 'trending') {
      const res = await feedApi.getTrendingFeed({ limit: 50 })
      return res.items ?? []
    }
    if (tab === 'deals') {
      const res = (await feedApi.getDealsFeed({ limit: 50 })) as {
        data?: RawProductRow[]
      }
      // Normalized, not spread: /api/feed/deals returns raw product rows whose
      // `media` is an array, which is NOT the IFeedItem shape (single `media`
      // + `mediaItems[]`). Spreading them produced feed items that render a
      // blank/broken slide — see normalizeProductToFeedItem's own comment.
      return (res.data ?? []).map(normalizeProductToFeedItem)
    }
    const res = await feedApi.getHomeFeed({ limit: 50 })
    return res.items ?? []
  }

  /**
   * Real server-side product listing for the "Products" filter.
   *
   * The home/following/trending feeds are post-first by design — `getHomeFeed`
   * only injects products from PREMIUM sellers with `showInFeed: true`, at one
   * slot per four posts, so the products present in an already-fetched feed
   * page are a tiny, non-representative slice (0 of 12 items in dev). Filtering
   * that pool client-side therefore showed an empty or near-empty result no
   * matter how many products the catalogue actually has. `/api/commerce/products`
   * is the real catalogue endpoint, with genuine server-side filtering
   * (search / category / square / store / price range / min discount / sort)
   * and its own pagination + caching — so "Products" queries it directly
   * instead of re-slicing whatever the feed happened to return.
   */
  const loadCatalogProducts = async (
    opts: {
      categorySlug?: string
      squareSlug?: string
      search?: string
      sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
      limit?: number
    } = {},
  ) => {
    pending.value = true
    try {
      const res = (await productApi.getProducts({
        status: 'PUBLISHED',
        limit: opts.limit ?? 50,
        sortBy: opts.sortBy ?? 'newest',
        ...(opts.categorySlug ? { categorySlug: opts.categorySlug } : {}),
        ...(opts.squareSlug ? { squareSlug: opts.squareSlug } : {}),
        ...(opts.search ? { search: opts.search } : {}),
      })) as { data?: { products?: RawProductRow[] } }
      catalogProducts.value = (res.data?.products ?? []).map(
        normalizeProductToFeedItem,
      )
    } catch {
      catalogProducts.value = []
    } finally {
      pending.value = false
    }
  }

  const load = async (tab: FeedTab = 'for-you') => {
    pending.value = true
    try {
      const [homeItems, reelsRes] = await Promise.all([
        fetchTabItems(tab),
        feedApi.getReels(12) as Promise<Record<string, unknown>>,
      ])
      const reelItems = (reelsRes?.items ?? reelsRes?.data ?? []) as IFeedItem[]
      const reelIds = new Set(reelItems.map((r) => r.id))

      posts.value = homeItems.filter((i) => i.type === 'POST')
      products.value = homeItems.filter(
        (i) => i.type === 'PRODUCT' && !reelIds.has(i.id),
      )
      reels.value = reelItems
    } finally {
      pending.value = false
    }
  }

  const byRecency = (a: IFeedItem, b: IFeedItem) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

  /**
   * Interleave the three pools. `postsPerProduct` posts, then 1 product; a
   * reel gets dropped in every `reelEvery` slots when `withReels` is true.
   */
  const interleave = (
    opts: {
      postsPerProduct?: number
      reelEvery?: number
      withReels?: boolean
    } = {},
  ) => {
    const { postsPerProduct = 2, reelEvery = 5, withReels = true } = opts
    const p = [...posts.value].sort(byRecency)
    const pr = [...products.value].sort(byRecency)
    const rl = withReels ? [...reels.value].sort(byRecency) : []

    const out: IFeedItem[] = []
    let pi = 0
    let qi = 0
    let ri = 0
    while (pi < p.length || qi < pr.length) {
      for (let k = 0; k < postsPerProduct && pi < p.length; k++)
        out.push(p[pi++]!)
      if (qi < pr.length) out.push(pr[qi++]!)
      if (
        withReels &&
        rl.length &&
        out.length > 0 &&
        out.length % reelEvery === 0 &&
        ri < rl.length
      ) {
        out.push(rl[ri++]!)
      }
    }
    return out
  }

  const reelIdSet = computed(() => new Set(reels.value.map((r) => r.id)))

  return {
    pending,
    posts,
    products,
    catalogProducts,
    reels,
    reelIdSet,
    load,
    loadCatalogProducts,
    interleave,
  }
}
