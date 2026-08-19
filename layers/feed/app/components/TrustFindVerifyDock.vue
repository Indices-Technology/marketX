<!--
  TrustFindVerifyDock — the "Find a seller / Verify any seller" search dock.
  Extracted from TrustMarketHome so the logged-in feed (SocialFeed) and the
  logged-out home share ONE implementation. Find → /discover, Verify → /verify.
-->
<template>
  <div ref="searchRoot" class="relative w-full">
    <div
      class="rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <!-- Tab selector -->
      <div
        role="tablist"
        aria-label="Find or verify a seller"
        class="mb-2 flex rounded-lg bg-gray-100 p-1 dark:bg-neutral-800"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeHeroTab === 'search'"
          class="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold"
          :class="
            activeHeroTab === 'search'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
          "
          @click="activeHeroTab = 'search'"
        >
          <Icon name="solar:magnifer-linear" size="15" />
          Find a seller
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeHeroTab === 'verify'"
          class="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold"
          :class="
            activeHeroTab === 'verify'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
          "
          @click="activeHeroTab = 'verify'"
        >
          <Icon name="solar:shield-user-linear" size="15" />
          Verify any seller
        </button>
      </div>

      <!-- Find tab -->
      <div
        v-if="activeHeroTab === 'search'"
        class="flex items-center gap-2 px-2 py-1"
      >
        <Icon
          name="solar:magnifer-linear"
          size="20"
          class="shrink-0 text-gray-400"
        />
        <label class="sr-only" :for="searchInputId"
          >Search sellers, products or markets</label
        >
        <input
          :id="searchInputId"
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          placeholder="Search sellers, products or markets…"
          class="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-neutral-500"
          @focus="searchFocused = true"
          @keydown.enter="submitSearch"
          @keydown.escape="closeSearch"
        />
        <button
          v-if="searchQuery"
          type="button"
          aria-label="Clear search"
          class="rounded-full p-1 text-gray-400 hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-200"
          @click="clearSearch"
        >
          <Icon name="solar:close-circle-linear" size="18" />
        </button>
        <button
          type="button"
          class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-neutral-200"
          @click="submitSearch"
        >
          Search
        </button>
      </div>

      <!-- Verify tab -->
      <form
        v-else
        class="flex items-center gap-2 px-2 py-1"
        @submit.prevent="submitVerify"
      >
        <Icon
          name="solar:shield-user-linear"
          size="20"
          class="shrink-0 text-gray-600 dark:text-neutral-400"
        />
        <label class="sr-only" :for="verifyInputId"
          >Enter a seller's phone, handle or link</label
        >
        <input
          :id="verifyInputId"
          v-model="verifyQuery"
          type="text"
          autocomplete="off"
          placeholder="Phone, @instagram_handle or shop link…"
          class="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-neutral-500"
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-neutral-200"
        >
          Verify seller
        </button>
      </form>
    </div>

    <!-- Dropdown: suggestions (empty query). Boxed (default) — floats,
         absolutely positioned, its own bounded scroll — for contexts where
         this dock overlays other content behind it (the desktop/dense
         hero) and the usual "just scroll the page" escape hatch doesn't
         reliably reach it (see the pointer-events-none hero comment below).
         Unboxed (`boxed-dropdown="false"`) — for contexts that already
         provide their own scrollable, empty real estate below the dock
         (MinimalHome's search BaseModal, top-anchored specifically so
         there's room to grow into) — flows in place instead of floating in
         its own bordered box, no nested scroll region. -->
    <div
      v-if="activeHeroTab === 'search' && searchFocused && !searchQuery.trim()"
      ref="dropdownRef"
      :class="
        boxedDropdown
          ? 'absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900'
          : 'mt-2'
      "
      :style="
        boxedDropdown && dropdownMaxHeight
          ? { maxHeight: dropdownMaxHeight }
          : undefined
      "
    >
      <SearchSuggestions @search="onSuggestion" @close="closeSearch" />
    </div>

    <!-- Dropdown: live results — same boxed/unboxed split as above. -->
    <div
      v-else-if="activeHeroTab === 'search' && showLiveResults"
      ref="dropdownRef"
      :class="
        boxedDropdown
          ? 'absolute inset-x-0 top-full z-50 mt-2 overflow-y-auto rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
          : 'mt-2'
      "
      :style="
        boxedDropdown && dropdownMaxHeight
          ? { maxHeight: dropdownMaxHeight }
          : undefined
      "
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
        class="px-4 py-6 text-center text-sm text-gray-400 dark:text-neutral-500"
      >
        No results for "{{ searchQuery }}"
      </div>
      <div
        v-else
        :class="boxedDropdown ? 'max-h-80 overflow-y-auto py-1' : 'py-1'"
      >
        <template v-if="liveResults.stores.length">
          <p
            class="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
          >
            Sellers
          </p>
          <NuxtLink
            v-for="s in liveResults.stores.slice(0, 3)"
            :key="`s-${s.id}`"
            :to="`/sellers/profile/${s.store_slug}`"
            class="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
            @click="onResultClick"
          >
            <StoreAvatar
              :store-name="s.store_name ?? undefined"
              :logo="s.store_logo ?? undefined"
              size="sm"
            />
            <span
              class="truncate text-sm font-medium text-gray-900 dark:text-white"
              >{{ s.store_name }}</span
            >
          </NuxtLink>
        </template>
        <template v-if="liveResults.products.length">
          <p
            class="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
          >
            Goods
          </p>
          <NuxtLink
            v-for="p in liveResults.products.slice(0, 4)"
            :key="`p-${p.id}`"
            :to="`/product/${p.slug}`"
            class="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
            @click="onResultClick"
          >
            <div
              class="h-9 w-9 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-neutral-800"
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
              <p
                class="truncate text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ p.title }}
              </p>
              <p class="text-sm text-gray-600 dark:text-neutral-400">
                {{ formatPrice(p.price ?? 0) }}
              </p>
            </div>
          </NuxtLink>
        </template>
        <div class="border-t border-gray-100 p-2 dark:border-neutral-800">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-neutral-800"
            @click="submitSearch"
          >
            See all results
            <Icon name="solar:arrow-right-linear" size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Optional seller CTA (shown on the marketing home, hidden in the feed) -->
    <p
      v-if="showSellerCta"
      class="mt-4 text-center text-xs font-medium text-gray-500 dark:text-neutral-400"
    >
      Selling instead?
      <NuxtLink
        :to="sellerCtaTarget"
        class="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700 dark:text-white dark:hover:text-neutral-300"
      >
        Become a verified seller →
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  useId,
} from 'vue'
import { navigateTo } from '#imports'

import SearchSuggestions from '~~/layers/commerce/app/components/discover/SearchSuggestions.vue'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'

import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useSearchApi } from '~~/layers/core/app/services/search.api'
import { useRecentSearches } from '~~/layers/commerce/app/composables/useRecentSearches'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import type { User } from '~~/layers/core/app/types/user'
import type { Product } from '~~/shared/types/product'

defineOptions({ name: 'TrustFindVerifyDock' })
const props = withDefaults(
  defineProps<{ showSellerCta?: boolean; boxedDropdown?: boolean }>(),
  {
    showSellerCta: true,
    boxedDropdown: true,
  },
)

// /sellers/create is auth-walled — a signed-out visitor following it lands on
// the login wall instead of a way in. Guests get the wizard that opens an
// account and a store together; signed-in users go straight to store creation.
const profileStore = useProfileStore()
const sellerCtaTarget = computed(() =>
  profileStore.isLoggedIn ? '/sellers/create' : '/user-register',
)

const { formatPrice } = useCurrency()
const searchApi = useSearchApi()
const recentSearches = useRecentSearches()

// This dock can be mounted more than once at a time (e.g. the mobile hero's
// own copy alongside MinimalHome's search modal) — static ids collided,
// breaking the label/input association on whichever instance mounted
// second. useId() gives each instance its own.
const instanceId = useId()
const searchInputId = computed(() => `find-verify-search-${instanceId}`)
const verifyInputId = computed(() => `find-verify-verify-${instanceId}`)

const activeHeroTab = ref<'search' | 'verify'>('search')
const searchRoot = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const verifyQuery = ref('')
const searchFocused = ref(false)
const searchLoading = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
// Set only in the no-safely-scrollable-ancestor fallback below — caps the
// dropdown to whatever vertical space is actually left in the viewport
// instead of a flat 70vh, which can still overflow when the dock itself
// already sits far down the screen (e.g. below a headline + subhead).
const dropdownMaxHeight = ref<string | undefined>(undefined)

// When this dock lives inside HomeHero's `position: fixed` hero, a viewport-
// relative max-height on the dropdown isn't enough — the dock's own vertical
// position can already sit far down the screen (it shifts with how the
// headline wraps at different widths), so there may be little room left
// below it regardless of how the dropdown itself is capped. Scrolling it
// into view on open sidesteps that entirely. `scrollIntoView` walks up the
// real DOM scroll-chain (main-scroll, or the hero's own overflow-y-auto),
// which works even though the hero is `pointer-events-none` — that only
// affects hit-testing for user-driven pointer/wheel input, not the scroll
// API called from script.
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
    liveResults.value.stores.length > 0,
)
const showLiveResults = computed(
  () => searchFocused.value && searchQuery.value.trim().length >= 2,
)

const scrollDropdownIntoView = async () => {
  // Unboxed dropdowns flow in normal document flow inside an ancestor
  // that's already scrollable with real room below (e.g. MinimalHome's
  // top-anchored search modal) — none of the absolute-positioning-specific
  // nudge/cap logic below applies, and forcing a max-height here would
  // reintroduce the "no need to box it" nested-scroll chrome this mode
  // exists to avoid.
  if (!props.boxedDropdown) return
  await nextTick()
  // dropdownRef, not searchRoot: the dropdown is `position: absolute` and
  // doesn't contribute to searchRoot's own layout height, so scrolling
  // searchRoot into view wouldn't necessarily reveal it.
  const el = dropdownRef.value
  if (!el) return
  // Prefer computing the scroll manually over a plain `scrollIntoView`:
  // its default `block: 'nearest'` scrolls to a flush, zero-margin fit —
  // technically all in-viewport, but visually reads as cut off with content
  // right against the edge. `[data-hero-scroll]` is the HomeHero fixed
  // section when this dock is used there; elsewhere (SocialFeed, MinimalHome)
  // it's absent and we fall back to the browser default.
  const scroller = el.closest<HTMLElement>('[data-hero-scroll]')
  if (!scroller) {
    // No safely-scrollable ancestor to reveal more room by scrolling it —
    // notably, the mobile dense hero sits inside MinimalHome's
    // snap-mandatory slide container, where any scroll attempt snaps to the
    // *next slide* entirely rather than nudging the view, so scrollIntoView
    // there was silently doing nothing useful. Cap the dropdown to whatever
    // space is actually left below it instead, so it's self-contained and
    // scrolls internally rather than running off the bottom of the screen.
    dropdownMaxHeight.value = undefined
    const margin = 16
    const available =
      window.innerHeight - el.getBoundingClientRect().top - margin
    dropdownMaxHeight.value = `${Math.max(160, available)}px`
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    return
  }
  dropdownMaxHeight.value = undefined
  const margin = 16
  const overflowBelow =
    el.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom
  if (overflowBelow > 0) {
    scroller.scrollBy({ top: overflowBelow + margin, behavior: 'smooth' })
  }
}
watch(searchFocused, (focused) => {
  if (focused) scrollDropdownIntoView()
})
// Also re-check when switching from suggestions to live results (typing) —
// a different dropdown, often a different height.
watch(showLiveResults, (showing) => {
  if (showing) scrollDropdownIntoView()
})

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

// Verify — the "check any seller" door → /verify. Guest-usable; works on
// sellers not yet on MarketX.
const submitVerify = () => {
  const q = verifyQuery.value.trim()
  return navigateTo(q ? `/verify?q=${encodeURIComponent(q)}` : '/verify')
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
</script>
