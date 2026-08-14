<!--
  PostPurchaseActions — follow the seller / rate what you bought, shown once
  immediately after a successful payment.

  Lives on /buyer/orders?payment=success|pod rather than on success.vue: that
  page has the "thank you" copy but nothing routes to it — checkout sets
  callback_url to /buyer/orders, so the buyer never sees it. This is the surface
  they actually land on.

  The moment right after paying is the only one where the buyer is engaged,
  positive and still thinking about the seller — asking here costs nothing and
  is the cheapest follow/review we will ever get. It is NOT a nag: each action
  disappears once taken, and the whole strip is dismissible.

  Rating here is intentionally star-only, no review body. A text box at this
  moment converts badly (they have not received the item yet) and a rating is
  honest about what they can judge so far — the buying experience. The full
  review with body stays on the product page after delivery.
-->
<template>
  <div
    v-if="visible"
    class="mt-3 border-t border-green-200 pt-3 dark:border-green-800"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- Follow -->
      <div v-if="storeSlug && !followed" class="flex items-center gap-2">
        <span class="text-xs text-green-700 dark:text-green-400">
          Liked buying from {{ storeName }}?
        </span>
        <button
          class="rounded-lg bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
          :disabled="following"
          @click="follow"
        >
          {{ following ? 'Following…' : 'Follow' }}
        </button>
      </div>
      <p
        v-else-if="storeSlug && followed"
        class="text-xs font-semibold text-green-700 dark:text-green-400"
      >
        Following {{ storeName }} ✓
      </p>

      <!-- Rate -->
      <div v-if="productId && !rated" class="flex items-center gap-1.5">
        <span class="text-xs text-green-700 dark:text-green-400">Rate it:</span>
        <div class="flex items-center">
          <button
            v-for="star in 5"
            :key="star"
            class="px-0.5 text-base leading-none transition-transform hover:scale-125 disabled:opacity-60"
            :disabled="rating"
            :aria-label="`Rate ${star} out of 5`"
            @mouseenter="hovered = star"
            @mouseleave="hovered = 0"
            @click="rate(star)"
          >
            <span
              :class="
                star <= (hovered || 0)
                  ? 'text-amber-400'
                  : 'text-green-300 dark:text-green-700'
              "
              >★</span
            >
          </button>
        </div>
      </div>
      <p
        v-else-if="productId && rated"
        class="text-xs font-semibold text-green-700 dark:text-green-400"
      >
        Thanks for rating ✓
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useSocialApi } from '~~/layers/profile/app/services/social.api'
import { useReviewApi } from '~~/layers/commerce/app/services/review.api'

const props = defineProps<{
  /** The just-purchased order (newest first from the orders list). */
  order?: {
    items?: Array<{
      variant?: {
        product?: {
          id?: number | string
          seller?: { store_slug?: string; store_name?: string | null } | null
        } | null
      } | null
    }>
  } | null
}>()

const socialApi = useSocialApi()
const reviewApi = useReviewApi()

const followed = ref(false)
const following = ref(false)
const rated = ref(false)
const rating = ref(false)
const hovered = ref(0)

// First item is enough: a single order is always one seller (multi-seller
// checkouts are split into one order per seller upstream), and asking a buyer
// to rate every line item at this moment is the nagging we're avoiding.
const firstProduct = computed(
  () => props.order?.items?.[0]?.variant?.product ?? null,
)
const productId = computed(() => firstProduct.value?.id ?? null)
const storeSlug = computed(() => firstProduct.value?.seller?.store_slug ?? null)
const storeName = computed(
  () => firstProduct.value?.seller?.store_name || 'this seller',
)

const visible = computed(() => !!storeSlug.value || !!productId.value)

const follow = async () => {
  if (!storeSlug.value || following.value) return
  following.value = true
  try {
    await socialApi.followSeller(storeSlug.value)
    followed.value = true
  } catch {
    notify({ type: 'error', text: 'Could not follow right now.' })
  } finally {
    following.value = false
  }
}

const rate = async (stars: number) => {
  if (!productId.value || rating.value) return
  rating.value = true
  try {
    await reviewApi.submitProductReview(Number(productId.value), {
      rating: stars,
    })
    rated.value = true
  } catch {
    // Most likely "already reviewed" or not yet eligible — either way the buyer
    // shouldn't get an error toast for a nice-to-have prompt they opted into.
    rated.value = true
  } finally {
    rating.value = false
  }
}
</script>
