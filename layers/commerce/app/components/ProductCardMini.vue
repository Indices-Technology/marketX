<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-neutral-900"
    :class="fill ? 'h-full' : ''"
    @click="$emit('open-detail', product)"
  >
    <!-- ─── MEDIA BLOCK ─────────────────────────────────────────────────── -->
    <div
      class="relative w-full overflow-hidden"
      :class="[
        fill ? 'min-h-0 flex-1' : aspectClass,
        tintClass || 'bg-gray-50 dark:bg-neutral-800',
      ]"
    >
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="product.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <Icon
          name="mdi:image-outline"
          size="32"
          class="text-gray-300 dark:text-neutral-700"
        />
      </div>

      <!-- Badges (top-left) -->
      <div
        v-if="product.isThrift || discountPercent > 0"
        class="absolute left-2 top-2 z-10 flex flex-col gap-1"
      >
        <span
          v-if="product.isThrift"
          class="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
        >
          Thrift
        </span>
        <span
          v-if="discountPercent > 0"
          class="rounded-md bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
        >
          −{{ discountPercent }}%
        </span>
      </div>

      <!-- Like button (top-right) -->
      <button
        class="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-95 dark:bg-black/40"
        :class="
          calm && !localLiked
            ? 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            : ''
        "
        aria-label="Like"
        @click.stop="handleLike"
      >
        <Icon
          :name="localLiked ? 'mdi:heart' : 'mdi:heart-outline'"
          size="16"
          :class="localLiked ? 'text-brand' : 'text-gray-600 dark:text-gray-300'"
        />
      </button>

      <!-- Stock pill (bottom-left) -->
      <div
        v-if="lowestStock === 0"
        class="absolute bottom-2 left-2 z-10 rounded-md bg-gray-900/90 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md"
      >
        Sold out
      </div>
      <div
        v-else-if="lowestStock !== null && lowestStock <= 5"
        class="absolute bottom-2 left-2 z-10 rounded-md bg-amber-500/95 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md"
      >
        Only {{ lowestStock }} left
      </div>
    </div>

    <!-- ─── INFO BLOCK ────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-1 px-2.5 py-2">
      <h3
        class="font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand dark:text-neutral-100"
        :class="featured ? 'line-clamp-2 text-sm' : 'line-clamp-1 text-[12px]'"
      >
        {{ product.title }}
      </h3>

      <div class="flex items-center justify-between gap-1">
        <component
          :is="product.seller?.store_slug ? 'NuxtLink' : 'span'"
          v-if="product.seller?.store_name"
          :to="
            product.seller?.store_slug
              ? `/sellers/profile/${product.seller.store_slug}`
              : undefined
          "
          class="flex min-w-0 items-center gap-1 truncate text-[11px] text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
          @click.stop
        >
          <Icon name="mdi:storefront-outline" size="11" class="shrink-0" />
          <span class="truncate">{{ product.seller.store_name }}</span>
          <Icon
            v-if="product.seller?.is_verified"
            name="mdi:check-decagram"
            size="11"
            class="shrink-0 text-blue-500"
          />
        </component>
        <div v-if="!calm" class="flex shrink-0 items-center gap-1.5">
          <!-- Relative time — visible in Fresh Drops context -->
          <span
            v-if="showAge && product.created_at"
            class="text-[9px] font-medium text-brand/70 dark:text-brand/60"
          >
            {{ timeAgo(product.created_at) }}
          </span>
          <!-- Like count as subtle social proof -->
          <span
            v-if="localLikeCount > 0"
            class="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-neutral-500"
          >
            <Icon name="mdi:heart-outline" size="10" />
            {{ localLikeCount }}
          </span>
        </div>
      </div>

      <!-- Market — the good belongs to a market square -->
      <NuxtLink
        v-if="product.square"
        :to="`/squares/${product.square.slug}`"
        class="flex w-fit max-w-full items-center gap-1 truncate rounded-full bg-brand/5 px-1.5 py-0.5 text-[10px] font-medium text-brand/80 transition hover:bg-brand/10"
        @click.stop
      >
        <Icon name="mdi:store-marker-outline" size="10" class="shrink-0" />
        <span class="truncate">{{ product.square.name }}</span>
      </NuxtLink>

      <!-- Rating · trader location — shown when the feed provides trust data -->
      <div
        v-if="product.averageRating || product.seller?.locationLabel"
        class="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-neutral-400"
      >
        <span
          v-if="product.averageRating"
          class="flex shrink-0 items-center gap-0.5 font-semibold text-amber-500"
        >
          <Icon name="mdi:star" size="11" />
          {{ product.averageRating.toFixed(1) }}
          <span class="font-normal text-gray-400 dark:text-neutral-500"
            >({{ product.totalReviews ?? 0 }})</span
          >
        </span>
        <span
          v-if="product.averageRating && product.seller?.locationLabel"
          class="text-gray-300 dark:text-neutral-600"
          >·</span
        >
        <span
          v-if="product.seller?.locationLabel"
          class="flex min-w-0 items-center gap-0.5 truncate"
        >
          <Icon name="mdi:map-marker-outline" size="10" class="shrink-0" />
          <span class="truncate">{{ product.seller.locationLabel }}</span>
        </span>
      </div>

      <!-- Price row -->
      <div class="flex items-center justify-between pt-0.5">
        <div class="flex flex-col">
          <span
            v-if="discountPercent > 0"
            class="text-[9px] leading-none text-gray-400 line-through dark:text-neutral-500"
          >
            {{ formatPrice(product.price) }}
          </span>
          <span
            class="font-bold leading-none text-gray-900 dark:text-neutral-100"
            :class="featured ? 'text-base' : 'text-[13px]'"
          >
            {{ formatPrice(discountedPrice) }}
          </span>
        </div>

        <!-- Cart — small ghost icon, not a prominent CTA -->
        <button
          :disabled="lowestStock === 0 || isAddingToCart"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            cartAdded
              ? 'bg-green-500/15 text-green-600'
              : lowestStock === 0
                ? 'text-gray-300 dark:text-neutral-700'
                : 'text-gray-400 hover:bg-brand/10 hover:text-brand dark:text-neutral-500'
          "
          :title="lowestStock === 0 ? 'Out of stock' : 'Add to cart'"
          @click.stop="handleAddToCart"
        >
          <Icon
            v-if="isAddingToCart"
            name="eos-icons:loading"
            size="13"
            class="animate-spin"
          />
          <Icon v-else-if="cartAdded" name="mdi:check" size="13" />
          <Icon v-else name="mdi:cart-plus" size="13" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { notify } from '@kyvg/vue3-notification'
import { imgThumb, videoThumb } from '~~/layers/core/app/utils/cloudinary'
import { timeAgo } from '~~/layers/core/app/utils/formatters'

const props = defineProps<{
  product: IProduct
  /** Tailwind aspect-ratio class e.g. "aspect-[3/4]". Defaults to portrait. */
  aspectClass?: string
  /** Show relative timestamp — intended for Fresh Drops context */
  showAge?: boolean
  /** Fill parent height (bento grid cells) instead of using a fixed aspect ratio. */
  fill?: boolean
  /** Hero treatment — larger title/price, 2-line title. */
  featured?: boolean
  /** Calmer face — hides the time/like-count meta row, reveals the like button on hover. */
  calm?: boolean
  /** Soft tint behind the media block (Selar-style warmth). Falls back to neutral. */
  tintClass?: string
}>()

const emit = defineEmits<{
  'open-detail': [product: IProduct]
  'quick-add': [product: IProduct]
}>()

const aspectClass = computed(() => props.aspectClass ?? 'aspect-[3/4]')

const { addToCart } = useCart()
const { likeProduct, unlikeProduct } = useProduct()
const profileStore = useProfileStore()
const { formatPrice } = useCurrency()

// ── Media ─────────────────────────────────────────────────────────────────────
const coverImage = computed(() => {
  const raw = props.product.media
  const media = (Array.isArray(raw) ? raw : []).filter(
    (m) => m.type === 'IMAGE' || m.type === 'VIDEO',
  )
  const first = media[0]
  if (!first) return null
  return first.type === 'VIDEO' ? videoThumb(first.url) : imgThumb(first.url)
})

// ── Pricing ───────────────────────────────────────────────────────────────────
const discountPercent = computed(() => props.product.discount ?? 0)
const discountedPrice = computed(() =>
  discountPercent.value > 0
    ? Math.round(props.product.price * (1 - discountPercent.value / 100))
    : props.product.price,
)

// ── Stock ─────────────────────────────────────────────────────────────────────
const lowestStock = computed(() => {
  const v = props.product.variants
  if (!v?.length) return null
  return Math.min(...v.map((x) => x.stock))
})
const firstVariantId = computed(() => props.product.variants?.[0]?.id ?? null)
const isSingleVariant = computed(
  () => (props.product.variants?.length ?? 0) <= 1,
)

// ── Like ──────────────────────────────────────────────────────────────────────
const localLiked = ref(false)
const localLikeCount = ref(props.product._count?.likes ?? 0)

const handleLike = async () => {
  if (!profileStore.isLoggedIn) {
    notify({ type: 'warn', text: 'Sign in to like products' })
    return
  }
  const wasLiked = localLiked.value
  localLiked.value = !wasLiked
  localLikeCount.value += wasLiked ? -1 : 1
  try {
    if (wasLiked) await unlikeProduct(props.product.id)
    else await likeProduct(props.product.id)
  } catch (err: any) {
    localLiked.value = wasLiked
    localLikeCount.value += wasLiked ? 1 : -1
    const status = err?.response?.status ?? err?.statusCode
    notify({
      type: status === 401 || status === 403 ? 'warn' : 'error',
      text: status === 401 || status === 403 ? 'Sign in to like products' : 'Could not like product',
    })
  }
}

// ── Cart ──────────────────────────────────────────────────────────────────────
const cartAdded = ref(false)
const isAddingToCart = ref(false)

const handleAddToCart = async () => {
  if (!isSingleVariant.value || !firstVariantId.value) {
    return emit('open-detail', props.product)
  }
  try {
    isAddingToCart.value = true
    await addToCart(firstVariantId.value, 1)
    cartAdded.value = true
    emit('quick-add', props.product)
    setTimeout(() => { cartAdded.value = false }, 2000)
  } catch {
    //
  } finally {
    isAddingToCart.value = false
  }
}
</script>
