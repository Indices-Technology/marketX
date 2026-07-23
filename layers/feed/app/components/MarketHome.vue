<!-- Market home - rendered inside HomeLayout by the auth-aware index.vue -->
<template>
  <div class="w-full space-y-8 px-2 sm:px-4">
    <!-- Search is the primary market action: find a place, trader, or good.
         Desktop only — on mobile the top-bar search button opens the full
         SearchOverlay, so an inline bar here would duplicate it. -->
    <section ref="searchRoot" class="relative hidden md:block" role="search">
      <div
        class="flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-colors sm:px-4 dark:bg-neutral-900"
        :class="
          searchFocused
            ? 'border-brand/40 ring-2 ring-brand/10'
            : 'border-gray-200 dark:border-neutral-800'
        "
      >
        <Icon
          name="solar:magnifer-linear"
          size="20"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
        <label class="sr-only" for="market-home-search">
          Search markets, traders or goods
        </label>
        <input
          id="market-home-search"
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          placeholder="Search markets, traders or goods"
          class="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
          @focus="searchFocused = true"
          @keydown.enter="submitSearch"
          @keydown.escape="closeSearch"
        />
        <button
          v-if="searchQuery"
          type="button"
          aria-label="Clear search"
          class="shrink-0 rounded-full p-0.5 text-gray-400 transition hover:text-gray-700 dark:hover:text-neutral-200"
          @click="clearSearch"
        >
          <Icon name="solar:close-circle-linear" size="16" />
        </button>
        <Icon
          v-else-if="searchLoading"
          name="solar:refresh-linear"
          size="16"
          class="shrink-0 animate-spin text-gray-400"
        />
      </div>

      <!-- Dropdown: suggestions/history when empty, live results while typing -->
      <Transition name="search-drop">
        <div
          v-if="searchFocused && !searchQuery.trim()"
          class="absolute left-0 right-0 top-[calc(100%+8px)] z-40"
        >
          <SearchSuggestions @search="onSuggestion" @close="closeSearch" />
        </div>

        <div
          v-else-if="showLiveResults"
          class="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div
            v-if="searchLoading && !liveHasHits"
            class="flex items-center justify-center py-6"
          >
            <Icon
              name="solar:refresh-linear"
              size="20"
              class="animate-spin text-gray-300 dark:text-neutral-600"
            />
          </div>

          <div
            v-else-if="!liveHasHits"
            class="px-4 py-6 text-center text-[13px] text-gray-400 dark:text-neutral-500"
          >
            No results for "{{ searchQuery }}"
          </div>

          <div v-else class="max-h-[420px] overflow-y-auto py-1">
            <!-- Traders -->
            <template v-if="liveResults.stores.length">
              <p class="search-group-label">Traders</p>
              <NuxtLink
                v-for="s in liveResults.stores.slice(0, 3)"
                :key="`s-${s.id}`"
                :to="`/sellers/profile/${s.store_slug}`"
                class="search-row"
                @click="onResultClick"
              >
                <StoreAvatar
                  :store-name="s.store_name ?? undefined"
                  :logo="s.store_logo ?? undefined"
                  size="sm"
                />
                <span class="ink-strong truncate text-[13px] font-medium">{{
                  s.store_name
                }}</span>
              </NuxtLink>
            </template>

            <!-- Goods -->
            <template v-if="liveResults.products.length">
              <p class="search-group-label">Goods</p>
              <NuxtLink
                v-for="p in liveResults.products.slice(0, 4)"
                :key="`p-${p.id}`"
                :to="`/product/${p.slug}`"
                class="search-row"
                @click="onResultClick"
              >
                <div
                  class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800"
                >
                  <img
                    v-if="p.media?.[0]?.url"
                    :src="imgThumb(p.media[0].url) ?? p.media[0].url"
                    :alt="p.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon
                      name="solar:bag-4-linear"
                      size="14"
                      class="text-gray-400"
                    />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="ink-strong truncate text-[13px] font-medium">
                    {{ p.title }}
                  </p>
                  <p class="t-price text-[13px]">
                    {{ formatPrice(p.price ?? 0) }}
                  </p>
                </div>
              </NuxtLink>
            </template>

            <!-- People -->
            <template v-if="liveResults.users.length">
              <p class="search-group-label">People</p>
              <NuxtLink
                v-for="u in liveResults.users.slice(0, 3)"
                :key="`u-${u.id}`"
                :to="`/profile/${u.username}`"
                class="search-row"
                @click="onResultClick"
              >
                <Avatar
                  :username="u.username"
                  :avatar="u.avatar ?? undefined"
                  size="sm"
                />
                <span class="ink-strong truncate text-[13px] font-medium"
                  >@{{ u.username }}</span
                >
              </NuxtLink>
            </template>

            <div class="border-t border-gray-100 p-2 dark:border-neutral-800">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold text-brand transition hover:bg-brand/5"
                @click="submitSearch"
              >
                See all results
                <Icon name="solar:arrow-right-linear" size="14" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- Trust leads when the preview is enabled so trust reads as the product. -->
    <template v-if="trustSpotlight">
      <TrustHero />
      <TrustSpotlightRail />
    </template>

    <!-- 1. MARKETS (Squares) -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">Discover</p>
          <h2 class="t-title">Explore Nigeria's Digital Markets</h2>
          <p class="t-meta mt-0.5">
            Step into real market squares and meet the traders inside
          </p>
        </div>
        <NuxtLink
          to="/squares"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          All markets ->
        </NuxtLink>
      </div>

      <div
        v-if="squaresLoading && !squares.length"
        class="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
        style="height: 208px; contain: strict"
      >
        <BaseSkeleton
          v-for="i in 3"
          :key="i"
          shape="block"
          width="240px"
          height="200px"
          rounded="rounded-2xl"
          class="shrink-0"
        />
      </div>

      <BaseEmptyState
        v-else-if="!squaresLoading && !squares.length"
        icon="solar:shop-linear"
        title="The first markets are being set up"
        description="Check back soon, or start by browsing traders and goods already live."
        compact
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/discover')"
          >
            Browse discover
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>

      <div
        v-else-if="squares.length"
        class="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
      >
        <SquareCard
          v-for="sq in squares"
          :key="sq.id"
          :square="sq"
          variant="spotlight"
        />

        <NuxtLink
          to="/squares"
          class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 text-gray-500 transition hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:text-neutral-400"
        >
          <Icon name="solar:add-circle-linear" size="20" />
          <span class="text-[10px] font-semibold">More</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 2. SELLERS ONLINE -->
    <section ref="section3Ref">
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">Happening now</p>
          <div class="flex items-center gap-2">
            <h2 class="t-title">Traders selling live</h2>
            <span
              class="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400"
            >
              <span
                class="block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
              />
              Live
            </span>
          </div>
        </div>
        <NuxtLink
          to="/map"
          class="mb-0.5 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          Map ->
        </NuxtLink>
      </div>

      <div
        v-if="sellersLoading && !onlineSellers.length"
        class="scrollbar-hide flex gap-4 overflow-x-auto pb-1"
        style="height: 88px; contain: strict"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="flex shrink-0 flex-col items-center gap-2"
        >
          <BaseSkeleton shape="circle" width="56px" height="56px" />
          <BaseSkeleton shape="line" width="40px" height="8px" />
        </div>
      </div>

      <div
        v-else-if="onlineSellers.length"
        class="scrollbar-hide flex gap-4 overflow-x-auto pb-1"
      >
        <NuxtLink
          v-for="store in onlineSellers"
          :key="store.store_slug"
          :to="`/sellers/profile/${store.store_slug}`"
          class="group flex shrink-0 flex-col items-center gap-1.5"
        >
          <div class="relative">
            <div
              class="h-[56px] w-[56px] overflow-hidden rounded-full bg-gray-100 ring-2 ring-green-400 ring-offset-1 dark:bg-neutral-800 dark:ring-offset-neutral-950"
            >
              <img
                v-if="store.store_logo"
                :src="sellerAvatar(store.store_logo)"
                :alt="store.store_name ?? ''"
                width="56"
                height="56"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-sm font-black text-brand"
              >
                {{
                  (store.store_name ?? store.store_slug ?? '?')
                    .slice(0, 2)
                    .toUpperCase()
                }}
              </div>
            </div>
            <span
              class="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-950"
            />
            <span
              v-if="store.hasActiveDeal"
              class="absolute -right-0.5 -top-0.5 rounded-full bg-brand px-1 py-px text-[8px] font-black leading-tight text-white"
            >
              DEAL
            </span>
          </div>
          <p
            class="w-[60px] truncate text-center text-[11px] font-medium text-gray-600 group-hover:text-brand dark:text-neutral-400"
          >
            {{ store.store_name || store.store_slug }}
          </p>
        </NuxtLink>
      </div>

      <button
        v-else-if="section3Loaded && !sellersLoading"
        class="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-left hover:border-brand/30 dark:border-neutral-700 dark:bg-neutral-900"
        :disabled="sellersRequesting"
        @click="requestSellerLocation"
      >
        <Icon
          v-if="sellersRequesting"
          name="solar:refresh-linear"
          size="18"
          class="animate-spin text-brand"
        />
        <Icon v-else name="solar:gps-linear" size="18" class="text-gray-500" />
        <span class="text-[13px] text-gray-600 dark:text-neutral-400">
          {{
            sellersRequesting
              ? 'Finding traders near you...'
              : "See who's trading near you"
          }}
        </span>
      </button>
    </section>

    <!-- 3. FRESH STOCK -->
    <section ref="section4Ref">
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">New this week</p>
          <h2 class="t-title">Fresh from the market</h2>
          <p class="t-meta mt-0.5">New goods from traders this week</p>
        </div>
        <NuxtLink
          to="/discover?tab=fresh"
          class="mb-0.5 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          See all ->
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="freshLoading && !freshItems.length"
        shape="block"
        height="208px"
        rounded="rounded-2xl"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="freshItems.length"
        :products="freshItems"
        label="Fresh from the market"
        hide-header
        @open-product="openProduct"
      />
      <BaseEmptyState
        v-else
        icon="solar:bag-4-linear"
        title="Fresh goods are being arranged"
        description="Check the markets now, or come back when traders add new stock."
        compact
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/squares')"
          >
            Explore markets
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- 4. DEALS -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">On sale now</p>
          <h2 class="t-title">Today's deals</h2>
          <p class="t-meta mt-0.5">Short-lived offers from active traders</p>
        </div>
        <NuxtLink
          to="/discover?tab=deals"
          class="mb-0.5 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          See all ->
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="dealsLoading && !deals.length"
        shape="block"
        height="208px"
        rounded="rounded-2xl"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="deals.length"
        :products="deals"
        :priority="true"
        label="Today's deals"
        hide-header
        @open-product="openProduct"
      />
      <BaseEmptyState
        v-else
        icon="solar:tag-linear"
        title="No flash deals right now"
        description="The market is still open. Browse fresh goods from traders instead."
        compact
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/discover?tab=fresh')"
          >
            Browse fresh goods
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- 5. MARKET PULSE (community posts) -->
    <section ref="section5Ref" class="max-w-[512px]">
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">From the community</p>
          <h2 class="t-title">Market Pulse</h2>
          <p class="t-meta mt-0.5">
            Latest updates from merchants, creators and communities
          </p>
        </div>
        <NuxtLink
          to="/"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
          @click.prevent="$emit('sign-in')"
        >
          Sign in for more ->
        </NuxtLink>
      </div>

      <div v-if="postsLoading && !marketPosts.length" class="space-y-4">
        <BaseSkeleton
          v-for="i in 2"
          :key="i"
          shape="block"
          height="176px"
          rounded="rounded-2xl"
          class="[contain:strict]"
        />
      </div>

      <div v-else-if="marketPosts.length" class="space-y-4">
        <PostCard
          v-for="post in marketPosts"
          :key="post.id"
          :post="post"
          @open-comments="selectedPost = $event"
          @open-details="selectedPost = $event"
          @open-product="openProduct"
        />
      </div>

      <BaseEmptyState
        v-else
        icon="solar:shop-linear"
        title="The market is quiet right now"
        description="Follow traders and markets to see their latest here."
        compact
      >
        <template #actions>
          <BaseButton
            variant="primary"
            size="sm"
            @click="navigateTo('/squares')"
          >
            Explore markets
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- 6. MAP CTA -->
    <section class="pb-4">
      <NuxtLink
        to="/map"
        class="flex items-center gap-4 rounded-2xl bg-gray-900 px-5 py-4 transition hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        <Icon
          name="solar:map-arrow-square-linear"
          size="28"
          class="shrink-0 text-white/60"
        />
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-white">
            Explore the market map
          </p>
          <p class="text-[12px] text-white/70">
            Traders, pop-ups and deals near you
          </p>
        </div>
        <Icon
          name="solar:arrow-right-linear"
          size="20"
          class="shrink-0 text-white/50"
        />
      </NuxtLink>
    </section>

    <ProductDetailModal
      v-if="selectedProduct"
      :product="selectedProduct"
      :loading="productDetailLoading"
      @close="selectedProduct = null"
      @open-comments="
        (p) => {
          commentProduct = p
          selectedProduct = null
        }
      "
    />
    <ProductCommentModal
      :is-open="!!commentProduct"
      :product="commentProduct"
      @close="commentProduct = null"
    />
    <PostDetailModal
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
    />
  </div>
</template>

<script setup lang="ts">
import FeedProductShelf from '~~/layers/feed/app/components/FeedProductShelf.vue'
import TrustHero from '~~/layers/reputation/app/components/TrustHero.vue'
import TrustSpotlightRail from '~~/layers/reputation/app/components/TrustSpotlightRail.vue'
import PostCard from '~~/layers/social/app/components/PostCard.vue'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import PostDetailModal from '~~/layers/social/app/components/modals/PostDetailModal.vue'
import ProductCommentModal from '~~/layers/commerce/app/components/modals/ProductCommentModal.vue'

import { navigateTo } from '#imports'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { imgAvatar, imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useMarketHome } from '../composables/useMarketHome'
import { useSearchApi } from '~~/layers/core/app/services/search.api'
import { useRecentSearches } from '~~/layers/commerce/app/composables/useRecentSearches'
import SearchSuggestions from '~~/layers/commerce/app/components/discover/SearchSuggestions.vue'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import type { User } from '~~/layers/core/app/types/user'
import type { Product } from '~~/shared/types/product'

defineEmits<{ 'sign-in': [] }>()
withDefaults(defineProps<{ trustSpotlight?: boolean }>(), {
  trustSpotlight: false,
})

// ── Search: professional typeahead with history + suggestions ────────────────
const { formatPrice } = useCurrency()
const searchApi = useSearchApi()
const recentSearches = useRecentSearches()

const searchRoot = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const searchFocused = ref(false)
const searchLoading = ref(false)

interface LiveResults {
  products: Product[]
  stores: User[]
  users: User[]
}
const empty: LiveResults = { products: [], stores: [], users: [] }
const liveResults = ref<LiveResults>({ ...empty })

const liveHasHits = computed(
  () =>
    liveResults.value.products.length > 0 ||
    liveResults.value.stores.length > 0 ||
    liveResults.value.users.length > 0,
)
const showLiveResults = computed(
  () => searchFocused.value && searchQuery.value.trim().length >= 2,
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = val.trim()
  if (q.length < 2) {
    liveResults.value = { ...empty }
    searchLoading.value = false
    return
  }
  searchLoading.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const res = await searchApi.search(q, 'all', 6)
      if (res?.success && res.data) {
        liveResults.value = {
          products: res.data.products ?? [],
          stores: res.data.stores ?? [],
          users: res.data.users ?? [],
        }
      }
    } catch {
      liveResults.value = { ...empty }
    } finally {
      searchLoading.value = false
    }
  }, 300)
})

// Pick a suggestion/history chip → run it as a live search and remember it.
const onSuggestion = (term: string) => {
  searchQuery.value = term
  recentSearches.add(term)
}

const clearSearch = () => {
  searchQuery.value = ''
  liveResults.value = { ...empty }
}

const closeSearch = () => {
  searchFocused.value = false
}

// Remember the query that led to a chosen result (not per-keystroke).
const onResultClick = () => {
  const q = searchQuery.value.trim()
  if (q) recentSearches.add(q)
  closeSearch()
}

const submitSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return navigateTo('/discover')
  recentSearches.add(q)
  closeSearch()
  return navigateTo(`/discover?q=${encodeURIComponent(q)}`)
}

const onOutsideClick = (e: MouseEvent) => {
  if (searchRoot.value && !searchRoot.value.contains(e.target as Node))
    searchFocused.value = false
}
onMounted(() => document.addEventListener('click', onOutsideClick))
onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})

const {
  selectedProduct,
  detailLoading: productDetailLoading,
  openProduct,
} = useProductDetail()
const commentProduct = ref<IProduct | null>(null)
const selectedPost = ref<IFeedItem | null>(null)

const sellerAvatar = (url: string) => imgAvatar(url)

const {
  deals,
  dealsLoading,
  squares,
  squaresLoading,
  section3Ref,
  section3Loaded,
  onlineSellers,
  sellersLoading,
  sellersRequesting,
  requestSellerLocation,
  section4Ref,
  freshItems,
  freshLoading,
  section5Ref,
  marketPosts,
  postsLoading,
} = useMarketHome()
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Search dropdown */
.search-group-label {
  @apply px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500;
}
.search-row {
  @apply flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800;
}
.search-drop-enter-active,
.search-drop-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.search-drop-enter-from,
.search-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
