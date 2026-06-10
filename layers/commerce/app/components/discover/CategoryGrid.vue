<template>
  <div class="mb-8 mt-2">
    <p class="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
      Shop by category
    </p>

    <!-- Main category grid -->
    <div class="grid grid-cols-4 gap-2 sm:gap-2.5 lg:grid-cols-8">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.slug"
        class="group flex flex-col items-center gap-2 rounded-2xl p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:opacity-95 active:scale-95 sm:p-3"
        :style="{ background: cat.gradient }"
        @click="selectCategory(cat)"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl"
          style="background: rgba(255,255,255,0.18); backdrop-filter: blur(2px)"
        >
          <Icon :name="cat.icon" size="20" class="text-white drop-shadow" />
        </div>
        <span
          class="line-clamp-2 text-center text-[10px] font-bold leading-tight text-white"
          style="text-shadow: 0 1px 3px rgba(0,0,0,0.25)"
        >
          {{ cat.label }}
        </span>
      </button>
    </div>

    <!-- Coming soon: Vehicles + Property -->
    <div class="mt-2 grid grid-cols-2 gap-2 sm:gap-2.5">
      <div
        v-for="cs in COMING_SOON"
        :key="cs.label"
        class="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60"
      >
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-neutral-700"
        >
          <Icon :name="cs.icon" size="16" class="text-gray-400 dark:text-neutral-500" />
        </div>
        <div class="min-w-0">
          <p class="text-[12px] font-bold text-gray-500 dark:text-neutral-400">{{ cs.label }}</p>
          <p class="text-[10px] text-gray-400 dark:text-neutral-500">{{ cs.desc }}</p>
        </div>
        <span
          class="ml-auto shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-gray-500 dark:bg-neutral-700 dark:text-neutral-400"
        >
          Soon
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useDiscoverFilters } from '~~/layers/commerce/app/composables/useDiscoverFilters'
import { useLayoutData } from '~~/layers/core/app/composables/useLayoutData'
import { getCategoryVisual } from '~~/layers/commerce/app/utils/categoryIconMap'

const { activeTab, selectedCategoryId } = useDiscoverFilters()
const { data: layoutData } = useLayoutData()
const dbCategories = computed(() => layoutData.value?.categories ?? [])

interface CategoryDef {
  slug: string
  label: string
  icon: string
  gradient: string
  matchTerms: string[]
  targetTab: 'products' | 'preloved'
}

const CATEGORIES: CategoryDef[] = [
  {
    slug: 'electronics',
    label: 'Electronics',
    matchTerms: ['electronic', 'phone', 'gadget', 'tech', 'computer', 'mobile', 'device', 'laptop'],
    targetTab: 'products',
    ...getCategoryVisual('electronics'),
  },
  {
    slug: 'fashion',
    label: 'Fashion',
    matchTerms: ['fashion', 'cloth', 'wear', 'apparel', 'dress', 'shoe', 'bag', 'style'],
    targetTab: 'products',
    ...getCategoryVisual('fashion'),
  },
  {
    slug: 'home',
    label: 'Home',
    matchTerms: ['home', 'furniture', 'interior', 'kitchen', 'living', 'decor', 'house'],
    targetTab: 'products',
    ...getCategoryVisual('home'),
  },
  {
    slug: 'beauty',
    label: 'Beauty',
    matchTerms: ['beauty', 'cosmetic', 'makeup', 'skin', 'hair', 'fragrance', 'personal'],
    targetTab: 'products',
    ...getCategoryVisual('beauty'),
  },
  {
    slug: 'food',
    label: 'Food',
    matchTerms: ['food', 'drink', 'grocery', 'snack', 'beverage', 'eat', 'restaurant'],
    targetTab: 'products',
    ...getCategoryVisual('food'),
  },
  {
    slug: 'sports',
    label: 'Sports',
    matchTerms: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'health', 'athletic'],
    targetTab: 'products',
    ...getCategoryVisual('sports'),
  },
  {
    slug: 'services',
    label: 'Services',
    matchTerms: ['service', 'repair', 'install', 'consult', 'professional', 'hire'],
    targetTab: 'products',
    ...getCategoryVisual('services'),
  },
  {
    slug: 'preloved',
    label: 'Pre-loved',
    matchTerms: ['preloved', 'thrift', 'second', 'used', 'vintage', 'pre-owned'],
    targetTab: 'preloved',
    ...getCategoryVisual('preloved'),
  },
]

const COMING_SOON = [
  { label: 'Vehicles', icon: 'mdi:car-outline', desc: 'Cars, bikes & more' },
  { label: 'Property', icon: 'mdi:home-city-outline', desc: 'Rent, buy & lease' },
]

async function selectCategory(cat: CategoryDef) {
  if (cat.targetTab === 'preloved') {
    activeTab.value = 'preloved'
    return
  }

  const match = dbCategories.value.find((c) => {
    const name = c.name.toLowerCase()
    const slug = c.slug.toLowerCase()
    return cat.matchTerms.some((term) => name.includes(term) || slug.includes(term))
  })

  // Switch tab first so its watcher resets selectedCategory/selectedCategoryId,
  // then set the category ID after the tick so the Products tab picks it up cleanly.
  activeTab.value = 'products'
  await nextTick()
  selectedCategoryId.value = match?.slug ?? null
}
</script>
