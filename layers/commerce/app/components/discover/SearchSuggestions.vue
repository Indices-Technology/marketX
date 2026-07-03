<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
  >
    <div class="max-h-[70vh] space-y-4 overflow-y-auto p-4">
      <!-- Recent searches -->
      <div v-if="recent.length">
        <div class="mb-2 flex items-center justify-between">
          <p class="section-label">Recent searches</p>
          <button
            class="text-[11px] font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
            @mousedown.prevent="onClearRecent"
          >
            Clear
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="term in recent"
            :key="term"
            class="chip"
            @mousedown.prevent="$emit('search', term)"
          >
            <Icon name="mdi:history" size="12" class="text-gray-400" />
            {{ term }}
          </button>
        </div>
      </div>

      <!-- Trending searches -->
      <div v-if="trendingTags.length">
        <p class="section-label mb-2">Trending searches</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tag in trendingTags.slice(0, 8)"
            :key="tag.id"
            class="chip"
            @mousedown.prevent="$emit('search', tag.name)"
          >
            <Icon name="mdi:trending-up" size="12" class="text-brand" />
            {{ tag.name }}
          </button>
        </div>
      </div>

      <!-- Popular markets -->
      <div v-if="squares.length">
        <p class="section-label mb-2">Popular markets</p>
        <div class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="sq in squares.slice(0, 6)"
            :key="sq.id"
            :to="`/squares/${sq.slug}`"
            class="chip"
            @mousedown="$emit('close')"
          >
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :style="`background:${sq.accentColor || '#f59e0b'}`"
            />
            {{ sq.name }}
          </NuxtLink>
        </div>
      </div>

      <!-- Popular traders -->
      <div v-if="featuredSellers.length">
        <p class="section-label mb-2">Popular traders</p>
        <div class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="s in featuredSellers.slice(0, 6)"
            :key="s.id"
            :to="`/sellers/profile/${s.store_slug}`"
            class="chip"
            @mousedown="$emit('close')"
          >
            <Icon name="mdi:storefront-outline" size="12" />
            {{ s.store_name }}
            <Icon
              v-if="s.is_verified"
              name="mdi:check-decagram"
              size="11"
              class="text-blue-500"
            />
          </NuxtLink>
        </div>
      </div>

      <!-- Categories -->
      <div v-if="categories.length">
        <p class="section-label mb-2">Categories</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="cat in categories.slice(0, 10)"
            :key="cat.id"
            class="chip"
            @mousedown.prevent="$emit('search', cat.name)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRightSidebarData } from '~~/layers/core/app/composables/useRightSidebarData'
import { useLayoutData } from '~~/layers/core/app/composables/useLayoutData'
import { useRecentSearches } from '../../composables/useRecentSearches'

defineEmits<{ search: [term: string]; close: [] }>()

const { squares, featuredSellers, trendingTags, load } = useRightSidebarData()
const { data: layoutData } = useLayoutData()
const categories = computed(() => layoutData.value?.categories ?? [])

const recentStore = useRecentSearches()
const recent = ref<string[]>([])

const onClearRecent = () => {
  recentStore.clear()
  recent.value = []
}

onMounted(() => {
  load()
  recent.value = recentStore.get()
})
</script>

<style scoped>
.section-label {
  @apply text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500;
}

.chip {
  @apply inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-brand;
}
</style>
