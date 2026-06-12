<template>
  <div class="py-10" data-testid="discover-filters">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <!-- <p class="text-[13px] font-bold text-gray-700 dark:text-neutral-200">
        Filters
      </p> -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="text-[11px] font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
        @click="resetFilters(activeTab)"
      >
        Clear all
      </button>
    </div>

    <div class="flex flex-col gap-5">
      <!-- ── Products ────────────────────────────────────────────── -->
      <template v-if="activeTab === 'products'">
        <FilterSection label="filter by">
          <OptionList
            :options="SORT_OPTIONS"
            :active="filters.products.sortBy"
            @select="filters.products.sortBy = $event"
          />
        </FilterSection>
        <FilterSection label="Price range">
          <PriceRange
            :min="filters.products.minPrice"
            :max="filters.products.maxPrice"
            @update:min="filters.products.minPrice = $event"
            @update:max="filters.products.maxPrice = $event"
          />
        </FilterSection>
      </template>

      <!-- ── Fresh ──────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'fresh'">
        <FilterSection label="Sort by">
          <OptionList
            :options="SORT_OPTIONS"
            :active="filters.fresh.sortBy"
            @select="filters.fresh.sortBy = $event"
          />
        </FilterSection>
        <FilterSection label="Price range">
          <PriceRange
            :min="filters.fresh.minPrice"
            :max="filters.fresh.maxPrice"
            @update:min="filters.fresh.minPrice = $event"
            @update:max="filters.fresh.maxPrice = $event"
          />
        </FilterSection>
      </template>

      <!-- ── Deals ──────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'deals'">
        <FilterSection label="Min discount">
          <OptionList
            :options="DISCOUNT_OPTIONS"
            :active="filters.deals.minDiscount"
            @select="filters.deals.minDiscount = $event"
          />
        </FilterSection>
        <FilterSection label="Max price">
          <PriceRange
            :min="null"
            :max="filters.deals.maxPrice"
            :hide-min="true"
            @update:max="filters.deals.maxPrice = $event"
          />
        </FilterSection>
      </template>

      <!-- ── Pre-loved ──────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'preloved'">
        <FilterSection label="Price range">
          <PriceRange
            :min="filters.preloved.minPrice"
            :max="filters.preloved.maxPrice"
            @update:min="filters.preloved.minPrice = $event"
            @update:max="filters.preloved.maxPrice = $event"
          />
        </FilterSection>
        <div
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        >
          <p
            class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
          >
            <Icon name="mdi:recycle" size="12" class="mr-1" />Pre-loved &amp;
            thrift items only
          </p>
        </div>
      </template>

      <!-- ── Squares ────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'squares'">
        <FilterSection label="Min sellers">
          <OptionList
            :options="MEMBER_OPTIONS"
            :active="filters.squares.minMembers"
            @select="filters.squares.minMembers = $event"
          />
        </FilterSection>
      </template>

      <!-- ── Sellers ────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'sellers'">
        <FilterSection label="Show only">
          <label
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-gray-50 dark:hover:bg-neutral-800/50"
          >
            <span class="text-[13px] text-gray-700 dark:text-neutral-300"
              >Has active deals</span
            >
            <input
              v-model="filters.sellers.hasDeals"
              type="checkbox"
              class="sr-only"
            />
            <span
              class="relative h-5 w-9 shrink-0 rounded-full transition"
              :class="
                filters.sellers.hasDeals
                  ? 'bg-brand'
                  : 'bg-gray-200 dark:bg-neutral-700'
              "
            >
              <span
                class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition"
                :class="filters.sellers.hasDeals ? 'translate-x-4' : ''"
              />
            </span>
          </label>
        </FilterSection>
      </template>

      <!-- ── Browse / Trending ──────────────────────────────────── -->
      <template v-else-if="activeTab === 'browse' || activeTab === 'trending'">
        <FilterSection label="Time range">
          <OptionList
            :options="TIME_OPTIONS"
            :active="filters.trending.timeRange"
            @select="filters.trending.timeRange = $event"
          />
        </FilterSection>
      </template>

      <!-- ── Tags ───────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'tags'">
        <FilterSection label="Sort tags by">
          <OptionList
            :options="TAG_SORT_OPTIONS"
            :active="filters.tags.sort"
            @select="filters.tags.sort = $event"
          />
        </FilterSection>
      </template>

      <!-- ── People ─────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'people'">
        <p class="text-[12px] text-gray-400 dark:text-neutral-500">
          Use the search bar to find people by name or username.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSection from './discover/DiscoverFilterSection.vue'
import PriceRange from './discover/DiscoverPriceRange.vue'
import OptionList from './discover/DiscoverFilterOptionList.vue'
import { useDiscoverFilters } from '../composables/useDiscoverFilters'

const { activeTab, filters, hasActiveFilters, resetFilters } =
  useDiscoverFilters()

const SORT_OPTIONS = [
  { value: 'newest' as const, label: 'Newest', icon: 'mdi:lightning-bolt' },
  { value: 'popular' as const, label: 'Popular', icon: 'mdi:fire' },
  {
    value: 'price_asc' as const,
    label: 'Low to high',
    icon: 'mdi:sort-ascending',
  },
  {
    value: 'price_desc' as const,
    label: 'High to low',
    icon: 'mdi:sort-descending',
  },
]

const DISCOUNT_OPTIONS = [
  { value: 0, label: 'Any deal' },
  { value: 10, label: '10%+ off' },
  { value: 20, label: '20%+ off' },
  { value: 30, label: '30%+ off' },
  { value: 50, label: '50%+ off' },
  { value: 70, label: '70%+ off' },
]

const MEMBER_OPTIONS = [
  { value: null, label: 'Any size' },
  { value: 5, label: '5+ sellers' },
  { value: 10, label: '10+ sellers' },
  { value: 25, label: '25+ sellers' },
  { value: 50, label: '50+ sellers' },
  { value: 100, label: '100+ sellers' },
]

const TIME_OPTIONS = [
  { value: 'all' as const, label: 'All time' },
  { value: 'today' as const, label: 'Today' },
  { value: 'week' as const, label: 'This week' },
  { value: 'month' as const, label: 'This month' },
]

const TAG_SORT_OPTIONS = [
  { value: 'popular' as const, label: 'Popular', icon: 'mdi:fire' },
  { value: 'newest' as const, label: 'Newest', icon: 'mdi:lightning-bolt' },
]
</script>
