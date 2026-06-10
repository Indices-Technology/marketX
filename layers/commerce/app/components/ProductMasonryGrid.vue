<template>
  <!-- Skeleton -->
  <div
    v-if="loading && !products.length"
    class="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5"
  >
    <div
      v-for="(h, i) in SKELETON_HEIGHTS"
      :key="i"
      class="mb-3 break-inside-avoid animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      :style="{ height: `${h}px` }"
    />
  </div>

  <!-- Empty -->
  <slot v-else-if="!products.length" name="empty" />

  <!-- Grid -->
  <div
    v-else
    class="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5"
  >
    <div
      v-for="(product, i) in products"
      :key="product.id"
      class="mb-3 break-inside-avoid"
    >
      <ProductCardMini
        :product="product"
        :aspect-class="aspectPattern[i % aspectPattern.length]"
        :show-age="showAge"
        @open-detail="emit('open-detail', $event)"
        @quick-add="emit('quick-add', $event)"
      />
    </div>
  </div>

  <!-- Infinite scroll trigger -->
  <div ref="trigger" class="h-10" />
  <div v-if="loading && products.length" class="flex justify-center py-8">
    <Icon name="eos-icons:loading" size="24" class="text-brand" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'
import ProductCardMini from './ProductCardMini.vue'

const props = defineProps<{
  products: IProduct[]
  loading: boolean
  hasMore: boolean
  showAge?: boolean
}>()

const emit = defineEmits<{
  'open-detail': [product: IProduct]
  'quick-add': [product: IProduct]
  'load-more': []
}>()

// Cycling aspect ratios — portrait-dominant so images feel editorial, not catalog
const aspectPattern = [
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-square',
  'aspect-[4/5]',
]

// Skeleton heights mirror the aspect pattern at ~160px column width
const SKELETON_HEIGHTS = [213, 200, 213, 160, 200, 213, 160, 200, 213, 200]

// Infinite scroll via IntersectionObserver
const trigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
// Track current intersection state so we can re-check after hasMore/loading change.
// IntersectionObserver only fires on *transitions* — if the trigger is already visible
// when hasMore flips to true (e.g. after first load on a short viewport), it won't fire
// again unless we re-check here.
let triggerVisible = false

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      triggerVisible = entries[0].isIntersecting
      if (triggerVisible && props.hasMore && !props.loading) emit('load-more')
    },
    { rootMargin: '200px' },
  )
  if (trigger.value) observer.observe(trigger.value)
})

watch(
  () => [props.hasMore, props.loading] as const,
  ([hasMore, loading]) => {
    if (hasMore && !loading && triggerVisible) emit('load-more')
  },
)

onUnmounted(() => observer?.disconnect())
</script>
