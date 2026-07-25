<!--
  SellerReviews — a store's reviews ARE the reviews of the products it sold.
  Product reviews are the platform's one review system, so this is a read-only
  rollup: buyers leave reviews on the product they purchased, and they surface
  here aggregated across the store.
-->
<template>
  <div class="space-y-5">
    <!-- ── Summary card ───────────────────────────────────────────────────── -->
    <div
      v-if="meta && meta.total > 0"
      class="flex items-start gap-5 rounded-2xl bg-gray-50 p-5 dark:bg-neutral-800/60"
    >
      <div class="flex shrink-0 flex-col items-center gap-1">
        <p
          class="text-5xl font-black leading-none text-gray-900 dark:text-white"
        >
          {{ meta.averageRating ? meta.averageRating.toFixed(1) : '—' }}
        </p>
        <StarRating :rating="meta.averageRating ?? 0" size="sm" />
        <p class="text-[11px] text-gray-400 dark:text-neutral-500">
          {{ meta.total }} review{{ meta.total !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="flex-1 space-y-1.5 pt-0.5">
        <div
          v-for="star in [5, 4, 3, 2, 1]"
          :key="star"
          class="flex items-center gap-2"
        >
          <span
            class="w-2.5 text-right text-[11px] font-semibold text-gray-500 dark:text-neutral-400"
            >{{ star }}</span
          >
          <Icon
            name="solar:star-bold"
            size="11"
            class="shrink-0 text-amber-400"
          />
          <div
            class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700"
          >
            <div
              class="h-full rounded-full bg-amber-400 transition-all duration-500"
              :style="{ width: barWidth(star) }"
            />
          </div>
          <span
            class="w-5 text-right text-[11px] text-gray-400 dark:text-neutral-500"
          >
            {{ meta.distribution?.[star] ?? 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Where reviews come from -->
    <p
      class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500"
    >
      <Icon name="solar:verified-check-linear" size="14" class="shrink-0" />
      Reviews come from verified buyers, on the products they purchased.
    </p>

    <!-- ── Review list ────────────────────────────────────────────────────── -->
    <div v-if="reviews.length" class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-violet-100 text-sm font-black text-brand dark:from-brand/20 dark:to-violet-900/30"
          >
            {{ (review.author?.username ?? 'U')[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="text-sm font-bold text-gray-900 dark:text-neutral-100"
              >
                {{ review.author?.username }}
              </span>
              <span
                v-if="review.verified"
                class="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Icon name="solar:check-circle-bold" size="10" />
                Verified buyer
              </span>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <StarRating :rating="review.rating" size="xs" />
              <span class="text-[11px] text-gray-400 dark:text-neutral-500">{{
                timeAgo(review.created_at)
              }}</span>
            </div>
            <!-- which product this review is for -->
            <NuxtLink
              v-if="review.product?.title"
              :to="`/product/${review.product.id}`"
              class="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-brand dark:text-neutral-500"
            >
              <Icon name="solar:box-linear" size="11" />
              <span class="truncate">{{ review.product.title }}</span>
            </NuxtLink>
            <p
              v-if="review.title"
              class="mt-1.5 text-sm font-semibold text-gray-800 dark:text-neutral-200"
            >
              {{ review.title }}
            </p>
            <p
              v-if="review.body"
              class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
            >
              {{ review.body }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!loading && meta !== null"
      class="flex flex-col items-center gap-2 py-12 text-center"
    >
      <Icon
        name="solar:star-linear"
        size="40"
        class="text-gray-200 dark:text-neutral-700"
      />
      <p class="text-sm font-semibold text-gray-400 dark:text-neutral-500">
        No reviews yet
      </p>
      <p class="text-xs text-gray-400 dark:text-neutral-600">
        Buy from this store and review the product to be the first
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading && !reviews.length" class="flex justify-center py-10">
      <Icon
        name="eos-icons:loading"
        size="26"
        class="animate-spin text-brand"
      />
    </div>

    <!-- Load more -->
    <button
      v-if="hasMore"
      class="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      :disabled="loading"
      @click="loadMore"
    >
      {{ loading ? 'Loading…' : 'Load more reviews' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReviewApi } from '~~/layers/commerce/app/services/review.api'
import StarRating from '~~/layers/commerce/app/components/StarRating.vue'

const props = defineProps<{ storeSlug: string; isOwnStore?: boolean }>()

const reviews = ref<any[]>([])
const meta = ref<{
  total: number
  averageRating: number | null
  distribution: Record<number, number>
  hasMore: boolean
} | null>(null)
const loading = ref(false)
const hasMore = ref(false)
let offset = 0

const barWidth = (star: number) => {
  const total = meta.value?.total ?? 0
  if (!total) return '0%'
  return `${Math.round(((meta.value?.distribution?.[star] ?? 0) / total) * 100)}%`
}

const timeAgo = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

const fetchReviews = async (reset = false) => {
  if (reset) {
    offset = 0
    reviews.value = []
  }
  loading.value = true
  try {
    const res: any = await useReviewApi().getSellerReviews(
      props.storeSlug,
      10,
      offset,
    )
    reviews.value = offset === 0 ? res.data : [...reviews.value, ...res.data]
    meta.value = res.meta
    hasMore.value = res.meta.hasMore
  } catch {
    // non-critical
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  offset += 10
  await fetchReviews()
}

onMounted(fetchReviews)
</script>
