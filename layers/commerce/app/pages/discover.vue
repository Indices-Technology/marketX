<template>
  <HomeLayout
    :narrow-feed="false"
    :custom-padding="true"
    :narrow-sidebar="true"
  >
    <div class="discover-page-wrap relative w-full pb-20 md:pb-0 md:pt-0">
      <!-- ─── HERO (non-sticky intro) ──────────────────────────────────────── -->
      <div class="px-1 pb-3 pt-4 sm:px-0">
        <h1
          class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          Discover
        </h1>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
          Search products, traders or markets across Nigeria
        </p>
      </div>

      <!-- ─── STICKY HEADER ──────────────────────────────────────────────── -->
      <div
        class="discover-sticky-header -mx-2 border-b border-gray-200 bg-white/90 px-4 pb-3 pt-4 backdrop-blur-xl sm:-mx-4 dark:border-neutral-800 dark:bg-neutral-950/90"
        :style="{ top: discoverStickyTop }"
      >
        <div class="mb-3 flex items-center gap-2">
          <div class="relative flex-1">
            <Icon
              name="solar:magnifer-linear"
              size="18"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
            />
            <input
              v-model="searchInput"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full rounded-full border border-transparent bg-gray-100/80 py-2 pl-9 pr-8 text-[13px] text-gray-900 placeholder-gray-400 transition-all focus:border-brand/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/10 dark:bg-neutral-800/80 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:bg-neutral-800"
              @focus="searchFocused = true"
              @blur="onSearchBlur"
              @keydown.enter="onSearchEnter"
            />

            <!-- Search suggestions (focused + empty query) -->
            <div
              v-if="searchFocused && !searchInput.trim()"
              class="absolute left-0 right-0 top-[calc(100%+8px)] z-50"
            >
              <DiscoverSearchSuggestions
                @search="onSuggestionSearch"
                @close="searchFocused = false"
              />
            </div>
            <button
              v-if="searchInput"
              aria-label="Clear search"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200"
              @click="searchInput = ''"
            >
              <Icon name="solar:close-circle-linear" size="13" />
            </button>
          </div>
          <!-- Mobile filter button — sidebar is hidden on small screens -->
          <button
            class="relative lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition"
            :class="hasActiveFilters
              ? 'border-brand/40 bg-brand/5 text-brand dark:border-brand/30 dark:bg-brand/10'
              : 'border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'"
            aria-label="Open filters"
            @click="filterSheetOpen = true"
          >
            <Icon name="solar:tuning-2-linear" size="16" />
            <span
              v-if="hasActiveFilters"
              class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand"
            />
          </button>
        </div>

        <!-- Active filter chips -->
        <div v-if="activeFilterChips.length" class="mb-2 flex flex-wrap gap-1.5">
          <button
            v-for="chip in activeFilterChips"
            :key="chip.key"
            class="inline-flex items-center gap-1 rounded-full bg-brand/10 py-1 pl-2.5 pr-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand/15 dark:bg-brand/15"
            @click="chip.clear()"
          >
            {{ chip.label }}
            <Icon name="solar:close-circle-linear" size="10" class="opacity-70" />
          </button>
          <button
            v-if="activeFilterChips.length > 1"
            class="px-1 py-1 text-[11px] font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
            @click="resetFilters(activeTab)"
          >
            Clear all
          </button>
        </div>

        <!-- Tab Bar -->
        <div
          class="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5"
        >
          <button
            v-for="tab in TABS"
            :key="tab.key"
            class="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all"
            :class="
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm shadow-brand/30'
                : 'text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            "
            @click="activeTab = tab.key"
          >
            <Icon :name="tab.icon" size="15" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- ─── TAB PANELS ────────────────────────────────────────────────── -->
      <DiscoverTrending
        v-if="activeTab === 'browse' || activeTab === 'trending'"
        @open-detail="openDetail"
      />
      <DiscoverSquares
        v-else-if="activeTab === 'squares'"
        :search-input="searchInput"
      />
      <DiscoverFresh
        v-else-if="activeTab === 'fresh'"
        :search-input="searchInput"
        :selected-category="selectedCategory"
        :categories="categories"
        @update:selected-category="selectedCategory = $event"
        @open-detail="openDetail"
      />
      <DiscoverDeals
        v-else-if="activeTab === 'deals'"
        :search-input="searchInput"
        :selected-category="selectedCategory"
        :categories="categories"
        @update:selected-category="selectedCategory = $event"
        @open-detail="openDetail"
      />
      <DiscoverPreloved
        v-else-if="activeTab === 'preloved'"
        :search-input="searchInput"
        :selected-category="selectedCategory"
        :categories="categories"
        @update:selected-category="selectedCategory = $event"
        @open-detail="openDetail"
      />
      <DiscoverProducts
        v-else-if="activeTab === 'products'"
        :search-input="searchInput"
        :selected-category="selectedCategory"
        :categories="categories"
        @update:selected-category="selectedCategory = $event"
        @open-detail="openDetail"
        @clear-search="searchInput = ''"
      />
      <DiscoverSellers
        v-else-if="activeTab === 'sellers'"
        :search-input="searchInput"
        :selected-category="selectedCategory"
        :categories="categories"
        @update:selected-category="selectedCategory = $event"
      />
      <DiscoverPeople
        v-else-if="activeTab === 'people'"
        :search-input="searchInput"
      />
      <DiscoverTags
        v-else-if="activeTab === 'tags'"
        :search-input="searchInput"
        :pending-tag-name="pendingTagName"
        @tag-resolved="pendingTagName = null"
        @open-detail="openDetail"
      />
    </div>

    <ProductDetailModal
      :product="selectedProduct"
      :loading="discoverDetailLoading"
      @close="selectedProduct = null"
    />

    <!-- Mobile filter bottom sheet -->
    <BaseModal v-model="filterSheetOpen" title="Filters" no-padding>
      <div class="px-5 pb-8 pt-4">
        <RightSideNavDiscoverFilter />
      </div>
    </BaseModal>

    <template #right-sidebar>
      <RightSideNavDiscoverFilter />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import type { Category } from '~~/shared/types/category'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import RightSideNavDiscoverFilter from '~~/layers/commerce/app/components/RightSideNavDiscoverFilter.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import DiscoverTrending from '~~/layers/commerce/app/components/discover/Trending.vue'
import DiscoverSquares from '~~/layers/commerce/app/components/discover/Squares.vue'
import DiscoverFresh from '~~/layers/commerce/app/components/discover/Fresh.vue'
import DiscoverDeals from '~~/layers/commerce/app/components/discover/Deals.vue'
import DiscoverPreloved from '~~/layers/commerce/app/components/discover/Preloved.vue'
import DiscoverProducts from '~~/layers/commerce/app/components/discover/Products.vue'
import DiscoverSellers from '~~/layers/commerce/app/components/discover/Sellers.vue'
import DiscoverPeople from '~~/layers/commerce/app/components/discover/People.vue'
import DiscoverTags from '~~/layers/commerce/app/components/discover/Tags.vue'
import DiscoverSearchSuggestions from '~~/layers/commerce/app/components/discover/SearchSuggestions.vue'
import { useRecentSearches } from '~~/layers/commerce/app/composables/useRecentSearches'
import { computed, onMounted, ref, watch } from 'vue'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useLayoutData } from '~~/layers/core/app/composables/useLayoutData'
import { useNavVisibility } from '~~/layers/core/app/composables/useNavVisibility'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useDiscoverFilters } from '~~/layers/commerce/app/composables/useDiscoverFilters'
import { useRoute } from 'vue-router'

const { setDiscoverPage } = useSeo()
setDiscoverPage()

const { mobileNavVisible } = useNavVisibility()
const discoverStickyTop = computed(() =>
  mobileNavVisible.value
    ? 'calc(3.5rem + env(safe-area-inset-top, 0px))'
    : '0px',
)

const { data: layoutData } = useLayoutData()
const categories = computed<Category[]>(
  () => layoutData.value?.categories ?? [],
)
const selectedCategory = ref<string | null>(null)

const TABS = [
  { key: 'browse',   label: 'Browse',      icon: 'solar:compass-linear' },
  { key: 'products', label: 'Products',    icon: 'solar:bag-4-linear' },
  { key: 'fresh',    label: 'Fresh Drops', icon: 'solar:bolt-bold' },
  { key: 'deals',    label: 'Deals',       icon: 'solar:tag-linear' },
  { key: 'preloved', label: 'Pre-loved',   icon: 'solar:recive-square-linear' },
  { key: 'sellers',  label: 'Traders',     icon: 'solar:shop-linear' },
  { key: 'squares',  label: 'Squares',     icon: 'solar:shop-2-linear' },
  { key: 'people',   label: 'People',      icon: 'solar:users-group-rounded-linear' },
  { key: 'tags',     label: 'Tags',        icon: 'solar:tag-linear' },
] as const

const { activeTab, selectedCategoryId, filters, hasActiveFilters, resetFilters } = useDiscoverFilters()
const searchInput = ref('')
const pendingTagName = ref<string | null>(null)
const filterSheetOpen = ref(false)

// ── Search suggestions ──────────────────────────────────────────────────────
const searchFocused = ref(false)
const recentSearches = useRecentSearches()

const onSearchBlur = () => {
  // Delay so a click inside the suggestions panel registers before it closes.
  setTimeout(() => {
    searchFocused.value = false
  }, 150)
}
const onSearchEnter = () => {
  if (searchInput.value.trim()) recentSearches.add(searchInput.value)
}
const onSuggestionSearch = (term: string) => {
  const t = term.trim()
  if (!t) return
  recentSearches.add(t)
  searchInput.value = t
  if (activeTab.value === 'browse' || activeTab.value === 'trending') {
    activeTab.value = 'products'
  }
  searchFocused.value = false
}

const SORT_LABEL: Record<string, string> = {
  popular: 'Most popular',
  price_asc: 'Low to high',
  price_desc: 'High to low',
}

const activeFilterChips = computed<Array<{ key: string; label: string; clear: () => void }>>(() => {
  const chips: Array<{ key: string; label: string; clear: () => void }> = []
  const t = activeTab.value
  const f = filters

  if (t === 'products' || t === 'fresh') {
    const tf = t === 'products' ? f.products : f.fresh
    if (tf.sortBy !== 'newest') chips.push({ key: 'sort', label: SORT_LABEL[tf.sortBy] ?? tf.sortBy, clear: () => { tf.sortBy = 'newest' } })
    if (tf.minPrice !== null) chips.push({ key: 'min', label: `From ₦${tf.minPrice.toLocaleString()}`, clear: () => { tf.minPrice = null } })
    if (tf.maxPrice !== null) chips.push({ key: 'max', label: `To ₦${tf.maxPrice.toLocaleString()}`, clear: () => { tf.maxPrice = null } })
  } else if (t === 'deals') {
    if (f.deals.minDiscount > 0) chips.push({ key: 'discount', label: `${f.deals.minDiscount}%+ off`, clear: () => { f.deals.minDiscount = 0 } })
    if (f.deals.maxPrice !== null) chips.push({ key: 'max', label: `To ₦${f.deals.maxPrice.toLocaleString()}`, clear: () => { f.deals.maxPrice = null } })
  } else if (t === 'preloved') {
    if (f.preloved.minPrice !== null) chips.push({ key: 'min', label: `From ₦${f.preloved.minPrice.toLocaleString()}`, clear: () => { f.preloved.minPrice = null } })
    if (f.preloved.maxPrice !== null) chips.push({ key: 'max', label: `To ₦${f.preloved.maxPrice.toLocaleString()}`, clear: () => { f.preloved.maxPrice = null } })
  } else if (t === 'sellers' && f.sellers.hasDeals) {
    chips.push({ key: 'deals', label: 'Has deals', clear: () => { f.sellers.hasDeals = false } })
  } else if ((t === 'trending' || t === 'browse') && f.trending.timeRange !== 'all') {
    const labels: Record<string, string> = { today: 'Today', week: 'This week', month: 'This month' }
    chips.push({ key: 'time', label: labels[f.trending.timeRange] ?? f.trending.timeRange, clear: () => { f.trending.timeRange = 'all' } })
  } else if (t === 'tags' && f.tags.sort !== 'popular') {
    chips.push({ key: 'sort', label: 'Newest tags', clear: () => { f.tags.sort = 'popular' } })
  } else if (t === 'squares' && f.squares.minMembers !== null) {
    chips.push({ key: 'members', label: `${f.squares.minMembers}+ sellers`, clear: () => { f.squares.minMembers = null } })
  }
  return chips
})

const searchPlaceholder = computed(() => {
  const map: Record<string, string> = {
    browse: 'Search products, traders or markets',
    trending: 'Search products, traders or markets',
    squares: 'Search markets',
    fresh: 'Search products, traders or markets',
    deals: 'Search products, traders or markets',
    preloved: 'Search pre-loved from traders',
    products: 'Search products, traders or markets',
    sellers: 'Search traders',
    people: 'Search people by name or @username',
    tags: 'Search categories',
  }
  return map[activeTab.value] ?? 'Search…'
})

// When CategoryGrid picks a category, sync it into the local selectedCategory prop
watch(selectedCategoryId, (id) => {
  if (id !== null) selectedCategory.value = id
})

watch(activeTab, () => {
  searchInput.value = ''
  selectedCategory.value = null
  selectedCategoryId.value = null
})

const {
  selectedProduct,
  detailLoading: discoverDetailLoading,
  openProduct: openDetail,
} = useProductDetail()

// ─── Route deep-links ────────────────────────────────────────────────────────
const route = useRoute()

const applyTagNameParam = (tagName: string) => {
  activeTab.value = 'tags'
  pendingTagName.value = tagName
}

watch(
  () => route.query.tagName,
  (val) => {
    if (val && typeof val === 'string') applyTagNameParam(val)
  },
)

// Search deep-link: /discover?q=… (used by the homepage search hero + right rail)
const applySearchParam = (q: string) => {
  searchInput.value = q
  activeTab.value = 'products' as typeof activeTab.value
}

watch(
  () => route.query.q,
  (val) => {
    if (val && typeof val === 'string') applySearchParam(val)
  },
)

onMounted(() => {
  const q = route.query.q as string | undefined
  if (q) {
    applySearchParam(q)
    return
  }

  const tagName = route.query.tagName as string | undefined
  if (tagName) {
    applyTagNameParam(tagName)
    return
  }

  const validTabs = [
    'browse',
    'trending',
    'squares',
    'fresh',
    'deals',
    'preloved',
    'products',
    'sellers',
    'people',
    'tags',
  ] as const
  const tab = route.query.tab as string | undefined
  if (tab === 'trending') {
    // old deep-links to trending land on browse (same content + category grid)
    activeTab.value = 'browse'
  } else if (tab && (validTabs as readonly string[]).includes(tab)) {
    activeTab.value = tab as typeof activeTab.value
  }
})
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.discover-page-wrap {
  padding-top: calc(3.5rem + env(safe-area-inset-top, 0px));
}
@media (min-width: 768px) {
  .discover-page-wrap {
    padding-top: 0;
  }
}

.discover-sticky-header {
  position: sticky;
  z-index: 25;
  transition: top 300ms ease-in-out;
}
@media (min-width: 768px) {
  .discover-sticky-header {
    top: 0 !important;
  }
}
</style>
