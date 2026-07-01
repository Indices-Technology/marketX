<template>
  <!-- Skeleton — mirrors the bento rhythm so the layout doesn't jump on load -->
  <div v-if="loading && !products.length" class="bento-grid">
    <div
      v-for="i in 12"
      :key="i"
      class="animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      :style="spanStyle(i - 1)"
    />
  </div>

  <!-- Empty -->
  <slot v-else-if="!products.length" name="empty" />

  <!-- Bento grid — dense flow packs cards around the larger heroes -->
  <div v-else class="bento-grid">
    <div
      v-for="(product, i) in products"
      :key="product.id"
      :style="spanStyle(i)"
    >
      <ProductCardMini
        :product="product"
        fill
        :featured="layoutAt(i) === 'hero'"
        :calm="layoutAt(i) !== 'hero'"
        :tint-class="tintFor(i)"
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

// ─── Bento layout ─────────────────────────────────────────────────────────────
// Grid geometry (columns / gap / fixed row height) lives in the scoped <style>
// block as real CSS so it can't be purged by Tailwind's JIT — that matters here
// because the cards fill their cell (no intrinsic height), so a missing
// grid-auto-rows would collapse them to nothing.

// Deterministic, non-obvious rhythm: ~1 hero (2×3) + 2 tall (1×3) per 11 cards,
// the rest normal (1×2). Pattern length 11 (coprime with the column counts) so
// heroes don't line up into a visible column.
type Span = 'hero' | 'tall' | 'normal'
const layoutAt = (i: number): Span => {
  const m = i % 11
  if (m === 0) return 'hero'
  if (m === 4 || m === 8) return 'tall'
  return 'normal'
}
// Inline grid spans — robust against Tailwind purging span/arbitrary classes.
const spanStyle = (i: number): Record<string, string> => {
  switch (layoutAt(i)) {
    case 'hero':
      return { gridColumn: 'span 2', gridRow: 'span 3' }
    case 'tall':
      return { gridRow: 'span 3' }
    default:
      return { gridRow: 'span 2' }
  }
}

// Soft per-card tints (Selar-style warmth). Low-saturation, dark-aware; shows
// behind transparent/loading media and on the hero/empty states. No purple.
const TINTS = [
  'bg-rose-50 dark:bg-rose-950/30',
  'bg-amber-50 dark:bg-amber-950/30',
  'bg-emerald-50 dark:bg-emerald-950/30',
  'bg-sky-50 dark:bg-sky-950/30',
  'bg-orange-50 dark:bg-orange-950/30',
  'bg-teal-50 dark:bg-teal-950/30',
]
const tintFor = (i: number): string => TINTS[i % TINTS.length]

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

<style scoped>
.bento-grid {
  display: grid;
  grid-auto-flow: row dense;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 116px;
  gap: 0.875rem;
}
@media (min-width: 640px) {
  .bento-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 124px;
    gap: 1rem;
  }
}
@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: 132px;
  }
}
</style>
