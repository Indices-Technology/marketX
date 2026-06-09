<template>
  <div class="space-y-5">

    <!-- ── Summary card ───────────────────────────────────────────────────── -->
    <div
      v-if="meta && meta.total > 0"
      class="flex items-start gap-5 rounded-2xl bg-gray-50 p-5 dark:bg-neutral-800/60"
    >
      <div class="flex shrink-0 flex-col items-center gap-1">
        <p class="text-5xl font-black leading-none text-gray-900 dark:text-white">
          {{ meta.averageRating ? meta.averageRating.toFixed(1) : '—' }}
        </p>
        <StarRating :rating="meta.averageRating ?? 0" size="sm" />
        <p class="text-[11px] text-gray-400 dark:text-neutral-500">
          {{ meta.total }} review{{ meta.total !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="flex-1 space-y-1.5 pt-0.5">
        <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
          <span class="w-2.5 text-right text-[11px] font-semibold text-gray-500 dark:text-neutral-400">{{ star }}</span>
          <Icon name="mdi:star" size="11" class="shrink-0 text-amber-400" />
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
            <div
              class="h-full rounded-full bg-amber-400 transition-all duration-500"
              :style="{ width: barWidth(star) }"
            />
          </div>
          <span class="w-5 text-right text-[11px] text-gray-400 dark:text-neutral-500">
            {{ meta.distribution?.[star] ?? 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Write review section ───────────────────────────────────────────── -->
    <template v-if="profileStore.isLoggedIn && !isOwnStore">

      <!-- Already reviewed -->
      <div
        v-if="existingReview"
        class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/20"
      >
        <Icon name="mdi:check-circle" size="20" class="shrink-0 text-emerald-500" />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            You reviewed this store
          </p>
          <div class="mt-0.5 flex items-center gap-1.5">
            <StarRating :rating="existingReview.rating" size="xs" />
            <span v-if="existingReview.body" class="truncate text-xs text-emerald-600/70 dark:text-emerald-500/70">
              {{ existingReview.body }}
            </span>
          </div>
        </div>
      </div>

      <!-- Not a buyer -->
      <div
        v-else-if="!canReview"
        class="flex items-start gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-800/40"
      >
        <Icon name="mdi:lock-outline" size="20" class="mt-0.5 shrink-0 text-gray-400" />
        <div>
          <p class="text-sm font-semibold text-gray-600 dark:text-neutral-300">Verified buyers only</p>
          <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
            Complete an order from this store to leave a review.
          </p>
        </div>
      </div>

      <!-- Write form -->
      <div
        v-else
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p class="mb-4 text-sm font-bold text-gray-900 dark:text-neutral-100">
          Rate your experience
        </p>

        <!-- Tap stars -->
        <div class="mb-4 flex items-center gap-1">
          <button
            v-for="n in 5"
            :key="n"
            class="rounded-lg p-1.5 transition-transform active:scale-90"
            :aria-label="`${n} star${n > 1 ? 's' : ''}`"
            @click="draftRating = n"
            @touchstart.prevent="draftRating = n"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
                :fill="n <= draftRating ? '#F59E0B' : '#e5e7eb'"
                :class="n <= draftRating ? '' : 'dark:!fill-neutral-700'"
              />
            </svg>
          </button>
          <span v-if="draftRating" class="ml-2 text-sm font-semibold text-amber-500">
            {{ ratingLabel(draftRating) }}
          </span>
        </div>

        <input
          v-model="draftTitle"
          type="text"
          placeholder="Summary (optional)"
          maxlength="120"
          class="mb-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
        <textarea
          v-model="draftBody"
          rows="3"
          placeholder="Share your experience with this store…"
          maxlength="2000"
          class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />

        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ draftBody.length }}/2000</span>
          <button
            :disabled="draftRating === 0 || submitting"
            class="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition active:scale-95 disabled:opacity-40"
            @click="submitReview"
          >
            {{ submitting ? 'Posting…' : 'Post Review' }}
          </button>
        </div>
      </div>
    </template>

    <!-- Not logged in -->
    <div
      v-else-if="!profileStore.isLoggedIn"
      class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center dark:border-neutral-700 dark:bg-neutral-800/40"
    >
      <p class="text-sm text-gray-500 dark:text-neutral-400">
        <NuxtLink to="/user-login" class="font-semibold text-brand hover:underline">Sign in</NuxtLink>
        to leave a review
      </p>
    </div>

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
              <span class="text-sm font-bold text-gray-900 dark:text-neutral-100">
                {{ review.author?.username }}
              </span>
              <span
                v-if="review.verified"
                class="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Icon name="mdi:check-circle" size="10" />
                Verified buyer
              </span>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <StarRating :rating="review.rating" size="xs" />
              <span class="text-[11px] text-gray-400 dark:text-neutral-500">{{ timeAgo(review.created_at) }}</span>
            </div>
            <p v-if="review.title" class="mt-1.5 text-sm font-semibold text-gray-800 dark:text-neutral-200">
              {{ review.title }}
            </p>
            <p v-if="review.body" class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
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
      <Icon name="mdi:star-outline" size="40" class="text-gray-200 dark:text-neutral-700" />
      <p class="text-sm font-semibold text-gray-400 dark:text-neutral-500">No reviews yet</p>
      <p class="text-xs text-gray-400 dark:text-neutral-600">Be the first verified buyer to review this store</p>
    </div>

    <!-- Loading -->
    <div v-if="loading && !reviews.length" class="flex justify-center py-10">
      <Icon name="eos-icons:loading" size="26" class="animate-spin text-brand" />
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
import { notify } from '@kyvg/vue3-notification'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useReviewApi } from '~~/layers/commerce/app/services/review.api'
import StarRating from '~~/layers/commerce/app/components/StarRating.vue'

const props = defineProps<{ storeSlug: string; isOwnStore?: boolean }>()

const profileStore = useProfileStore()
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

const draftRating = ref(0)
const draftTitle = ref('')
const draftBody = ref('')
const submitting = ref(false)
const canReview = ref(false)
const existingReview = ref<any>(null)

const ratingLabel = (n: number) =>
  ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n] ?? ''

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
  if (reset) { offset = 0; reviews.value = [] }
  loading.value = true
  try {
    const res: any = await useReviewApi().getSellerReviews(props.storeSlug, 10, offset)
    reviews.value = offset === 0 ? res.data : [...reviews.value, ...res.data]
    meta.value = res.meta
    hasMore.value = res.meta.hasMore
  } catch {
    // non-critical
  } finally {
    loading.value = false
  }
}

const checkEligibility = async () => {
  if (!profileStore.isLoggedIn || props.isOwnStore) return
  try {
    const res: any = await useReviewApi().getSellerReviewEligibility(props.storeSlug)
    canReview.value = res.data?.canReview ?? false
    if (res.data?.existingReview) existingReview.value = res.data.existingReview
  } catch {
    canReview.value = false
  }
}

const loadMore = async () => {
  offset += 10
  await fetchReviews()
}

const submitReview = async () => {
  if (draftRating.value === 0) return
  submitting.value = true
  try {
    const res: any = await useReviewApi().submitSellerReview(props.storeSlug, {
      rating: draftRating.value,
      title: draftTitle.value || undefined,
      body: draftBody.value || undefined,
    })
    notify({ type: 'success', text: 'Review posted!' })
    existingReview.value = res.data
    draftRating.value = 0
    draftTitle.value = ''
    draftBody.value = ''
    await fetchReviews(true)
  } catch {
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchReviews(), checkEligibility()])
})
</script>
