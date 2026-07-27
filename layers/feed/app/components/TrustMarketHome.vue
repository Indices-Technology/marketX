<!--
  TrustMarketHome — SPIKE / preview of a trust-first logged-out homepage.

  Not wired into index.vue. Rendered only at /trust-home so we can compare it
  against the current MarketHome without touching the live page.

  Trust hero removed (per review); search leads. The trust story now carries
  through the "Trusted this week" proof rail rather than a top-of-page hero.

  Section order (Trust > Commerce > Social tie-breaker):
    1. Search                — the lead action (full typeahead)
    2. Trusted this week     — reputation proof (the differentiator)
    3. Real things, on sale  — ONE commerce surface, not three
    4. Markets               — a single discovery strip
    5. Footer band           — map + community, collapsed into one thin row
-->
<template>
  <div class="w-full space-y-10 px-2 sm:px-4">
    <!-- ── 1. SEARCH (lead action) ──────────────────────────────────────────
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
        <label class="sr-only" for="trust-home-search">
          Search markets, traders or goods
        </label>
        <input
          id="trust-home-search"
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
                    <Icon name="solar:bag-4-linear" size="14" class="text-gray-400" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="ink-strong truncate text-[13px] font-medium">
                    {{ p.title }}
                  </p>
                  <p class="t-price text-[13px]">{{ formatPrice(p.price ?? 0) }}</p>
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

    <!-- ── 2. TRUSTED THIS WEEK (proof) ─────────────────────────────────────
         The differentiator: sellers ranked by verified sales, not followers.
         With the hero gone, this is where the trust story now leads. -->
    <TrustSpotlightRail />

    <!-- ── 3. REAL THINGS, ON SALE NOW (commerce) ───────────────────────────
         ONE discovery surface — fresh goods, with deals folded in — instead of
         the three near-identical rails on the current home. -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">Real things, for sale now</p>
          <h2 class="t-title">Fresh from the market</h2>
          <p class="t-meta mt-0.5">
            Every one from a trader you can pay protected
          </p>
        </div>
        <NuxtLink
          to="/discover?tab=fresh"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          See all →
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="discoveryLoading && !discoveryItems.length"
        shape="block"
        height="208px"
        rounded="rounded-2xl"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="discoveryItems.length"
        :products="discoveryItems"
        :priority="true"
        label="Fresh from the market"
        hide-header
        @open-product="openProduct"
      />
      <BaseEmptyState
        v-else
        icon="solar:bag-4-linear"
        title="Fresh goods are being arranged"
        description="Check the markets below, or come back when traders add new stock."
        compact
      >
        <template #actions>
          <BaseButton variant="secondary" size="sm" @click="navigateTo('/squares')">
            Explore markets
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- ── 4. MARKETS (a single discovery strip) ────────────────────────────
         Kept to one rail. The squares are where the goods above come from. -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="t-eyebrow mb-1">Where they trade</p>
          <h2 class="t-title">Nigeria's markets, online</h2>
          <p class="t-meta mt-0.5">
            Step into real market squares and meet the traders inside
          </p>
        </div>
        <NuxtLink
          to="/squares"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          All markets →
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

      <BaseEmptyState
        v-else
        icon="solar:shop-linear"
        title="The first markets are being set up"
        description="Check back soon, or browse traders and goods already live."
        compact
      >
        <template #actions>
          <BaseButton variant="secondary" size="sm" @click="navigateTo('/discover')">
            Browse discover
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- ── 5. FOOTER BAND (map + community, collapsed) ──────────────────────
         Two full sections on the current home become one thin two-up row. -->
    <section class="grid gap-3 pb-4 sm:grid-cols-2">
      <NuxtLink
        to="/map"
        class="flex items-center gap-4 rounded-2xl bg-gray-900 px-5 py-4 transition hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        <Icon
          name="solar:map-arrow-square-linear"
          size="26"
          class="shrink-0 text-white/60"
        />
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-white">Explore the market map</p>
          <p class="text-[12px] text-white/70">Traders and deals near you</p>
        </div>
        <Icon
          name="solar:arrow-right-linear"
          size="18"
          class="shrink-0 text-white/50"
        />
      </NuxtLink>

      <NuxtLink
        to="/"
        class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 transition hover:border-brand/30 dark:border-neutral-800 dark:bg-neutral-900"
        @click.prevent="$emit('sign-in')"
      >
        <Icon
          name="solar:users-group-rounded-linear"
          size="26"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-gray-900 dark:text-neutral-100">
            Join the community
          </p>
          <p class="text-[12px] text-gray-500 dark:text-neutral-400">
            Sign in for the full market feed
          </p>
        </div>
        <Icon
          name="solar:arrow-right-linear"
          size="18"
          class="shrink-0 text-gray-300 dark:text-neutral-600"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { navigateTo } from '#imports'

import TrustSpotlightRail from '~~/layers/reputation/app/components/TrustSpotlightRail.vue'
import FeedProductShelf from '~~/layers/feed/app/components/FeedProductShelf.vue'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import ProductCommentModal from '~~/layers/commerce/app/components/modals/ProductCommentModal.vue'
import SearchSuggestions from '~~/layers/commerce/app/components/discover/SearchSuggestions.vue'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'

import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useMarketHome } from '../composables/useMarketHome'
import { useSearchApi } from '~~/layers/core/app/services/search.api'
import { useRecentSearches } from '~~/layers/commerce/app/composables/useRecentSearches'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import type { User } from '~~/layers/core/app/types/user'
import type { Product } from '~~/shared/types/product'

defineOptions({ name: 'TrustMarketHome' })
defineEmits<{ 'sign-in': [] }>()

// ── Search: full typeahead with history + suggestions (ported from MarketHome)
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

// ── Content ──────────────────────────────────────────────────────────────
const {
  selectedProduct,
  detailLoading: productDetailLoading,
  openProduct,
} = useProductDetail()
const commentProduct = ref<IProduct | null>(null)

const { deals, dealsLoading, squares, squaresLoading, freshItems, freshLoading } =
  useMarketHome()

// One discovery surface: fresh goods lead, deals fold in behind them so there's
// a single dense grid instead of two near-identical shelves.
const discoveryItems = computed(() => {
  const seen = new Set<string | number>()
  const merged: any[] = []
  for (const item of [...freshItems.value, ...deals.value]) {
    const id = item?.id ?? item?.product?.id
    if (id == null || seen.has(id)) continue
    seen.add(id)
    merged.push(item)
  }
  return merged
})
const discoveryLoading = computed(() => freshLoading.value || dealsLoading.value)
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
