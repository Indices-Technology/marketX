<!-- One full-screen slide of the home feed (MinimalHome.vue). Handles POST and
     image-led PRODUCT items — video products/reels render through the real
     ReelItem.vue instead, no need for a second video chassis.

     Tagged products on posts don't get a tap target here: ProductPostTag has
     no stored position, and a fake/hashed pin location would be worse than no
     pin at all. Real tap-to-place tagging (schema + creator UI) is a planned
     follow-up — see PostPositionsFollowUp note in project memory. -->
<template>
  <div
    class="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black"
  >
    <!-- ─── MEDIA ─────────────────────────────────────────────────────── -->
    <!-- Horizontal carousel for multi-media posts — one photo/video fills
         the full screen at a time via native scroll-snap, swiped on its own
         axis independently of the outer vertical between-posts swipe (the
         two don't compete for the same gesture). With a single item this
         degenerates to one full-bleed slide with no dots — visually
         identical to the old single-image/video branches it replaces. -->
    <div
      v-if="hasMedia"
      ref="carouselRef"
      class="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      @scroll="onCarouselScroll"
    >
      <div
        v-for="(m, i) in mediaItems"
        :key="m.id"
        class="relative h-full w-full shrink-0 snap-start snap-always"
      >
        <video
          v-if="m.type === 'VIDEO'"
          :ref="(el) => setVideoRef(el, i)"
          :src="m.url"
          class="h-full w-full object-cover"
          loop
          playsinline
          muted
        />
        <img
          v-else
          :src="m.url"
          :alt="item.caption"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Text-only post: no media to show, so the caption/content IS the
         slide instead of a "missing image" icon over a blank box (the
         previous fallback here — a real bug, not a placeholder for a rare
         case). Same gradient-by-content-type language as PostCard.vue's own
         text-only treatment (SocialFeed's card view), just full-bleed
         instead of a rounded card, so a text post reads consistently
         wherever it's viewed. Colors intentionally duplicated rather than
         imported from PostCard.vue — keeps this component's blast radius
         fully separate from SocialFeed.vue's dependency tree.
         Long text is clamped by default with a "Read more" toggle (same
         pattern PostCard.vue already uses) rather than always being
         internally scrollable — a scrollable div nested inside the OUTER
         vertical snap-scroll (swipe between posts) competes with that same
         swipe gesture: the user would have had to scroll all the way to the
         bottom of the text before a swipe would pass through to the next
         post, a real gesture-conflict, not just cosmetic. Once the user
         explicitly taps "Read more" that concern no longer applies — it's
         now an opt-in action, not the default state — so overflow-y-auto
         only turns on post-expand, letting arbitrarily long posts (a full
         news-article-length caption, seen in testing) scroll on their own
         instead of clipping past the top/bottom of the screen. -->
    <div
      v-else
      class="flex h-full w-full flex-col px-8 pb-20"
      :class="
        textExpanded
          ? 'items-start justify-start overflow-y-auto pt-[8.5rem]'
          : 'items-center justify-center py-20'
      "
      :style="{ background: textBgStyle.bg }"
    >
      <p
        class="w-full whitespace-pre-wrap leading-relaxed text-white"
        :class="[
          isTextLong
            ? 'text-left text-lg'
            : 'text-center text-2xl font-semibold',
          isTextLong && !textExpanded ? 'line-clamp-[10]' : '',
        ]"
      >
        {{ item.caption || item.content }}
      </p>
      <button
        v-if="isTextLong && !textExpanded"
        type="button"
        class="mt-3 text-sm font-semibold text-white/80 underline underline-offset-2"
        @click.stop="textExpanded = true"
      >
        Read more
      </button>
    </div>

    <!-- Carousel position dots — only when there's more than one media item.
         Placed after the media/text-only if-else chain (not between the two
         branches) — Vue's v-else must be the immediate template sibling of
         its v-if; inserting this here between them once detached the v-else
         from v-if="hasMedia" entirely, so the text-only branch started
         rendering unconditionally alongside the real media, and the plain
         `flex` root container split the two ~50/50 — a real, visible bug,
         not a hypothetical. top-[7.5rem] clears MinimalHome's own header +
         For You/Trending/Deals overlay (measured: real header bottom ~57px,
         tab-bar pill bottom ~102px at a 390px-wide viewport) — a plain top-3
         hid the dots entirely behind that fixed-position chrome, which a
         locally-scoped z-index here can't out-rank regardless of value. -->
    <div
      v-if="mediaItems.length > 1"
      class="pointer-events-none absolute inset-x-0 top-[7.5rem] z-20 flex justify-center gap-1.5"
    >
      <span
        v-for="(m, i) in mediaItems"
        :key="m.id"
        class="h-1.5 rounded-full transition-all"
        :class="i === carouselIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'"
      />
    </div>

    <!-- Gradient overlays for text readability — media slides only; the
         text-only treatment above already carries its own background. -->
    <div
      v-if="hasMedia"
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
    />
    <div
      v-if="hasMedia"
      class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent"
    />

    <!-- ─── RIGHT ACTION BAR ─────────────────────────────────────────── -->
    <!-- bottom-36, not bottom-28: the global "Messages & AI" FAB is fixed at
         right-4 with a 56px box whose top edge measured at 528px on a 664px
         viewport, while a bottom-28 bar ends at 552 — so the bar's last item
         sat *under* the FAB. That already clipped the share count before the
         Trust button existed; adding a fifth item made it hide a whole
         control. 144px puts the bar's bottom at 520, clearing the FAB. -->
    <div
      class="absolute bottom-36 right-3 z-20 flex flex-col items-center gap-5"
    >
      <NuxtLink :to="authorLink" class="mb-1">
        <img
          :src="authorAvatar"
          :alt="item.author?.username || 'User'"
          class="h-11 w-11 rounded-full border-2 border-white bg-neutral-800 object-cover shadow-lg"
        />
      </NuxtLink>

      <button
        class="group flex flex-col items-center gap-1"
        @click.stop="onLike"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
        >
          <Icon
            :name="liked ? 'solar:heart-bold' : 'solar:heart-linear'"
            size="26"
            :class="liked ? 'text-brand' : 'text-white'"
          />
        </div>
        <span class="text-shadow text-[12px] font-bold text-white">{{
          formatCount(likeCount)
        }}</span>
      </button>

      <button
        class="group flex flex-col items-center gap-1"
        @click.stop="$emit('open-comments', item)"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
        >
          <Icon
            name="solar:chat-round-dots-linear"
            size="24"
            class="text-white"
          />
        </div>
        <span class="text-shadow text-[12px] font-bold text-white">{{
          formatCount(item.commentCount || 0)
        }}</span>
      </button>

      <button
        class="group flex flex-col items-center gap-1"
        @click.stop="onShare"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
        >
          <Icon name="solar:share-bold" size="24" class="text-white" />
        </div>
        <span class="text-shadow text-[12px] font-bold text-white">{{
          formatCount(item.shareCount || 0)
        }}</span>
      </button>

      <!-- Trust Card — seller content only. Gated on a REAL store slug
           (author.storeSlug, populated from sellerProfile.store_slug) rather
           than on role alone: without a genuine slug the card can't be
           loaded, and guessing one from `username` would 404 or, worse, open
           a different seller's card. Regular users' posts simply don't show
           this. -->
      <button
        v-if="storeSlug"
        aria-label="View seller's Trust Card"
        class="group flex flex-col items-center gap-1"
        @click.stop="trustCardOpen = true"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
        >
          <Icon
            name="solar:shield-check-bold"
            size="24"
            class="text-emerald-400"
          />
        </div>
        <span class="text-shadow text-[11px] font-bold text-white">Trust</span>
      </button>
    </div>

    <TrustCardOverlay v-model="trustCardOpen" :store-slug="storeSlug" />

    <!-- ─── BOTTOM INFO ───────────────────────────────────────────────── -->
    <!-- bottom offset clears BottomNavMobile (h-16 + safe-area), which sits
         on top of this slide (z-30 vs this slide's z-0) whenever it's
         visible — same clearance value HomeLayout.vue already uses for
         .main-scroll's own bottom padding. A flat bottom-6 measured as
         genuinely overlapping the nav (price button bottom ~818px vs nav
         top ~777px at a 403x842 viewport), not just visually tight. -->
    <div
      class="absolute bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-4 right-16 z-20 flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="authorLink"
          class="text-shadow text-[15px] font-bold text-white hover:underline"
        >
          {{
            item.type === 'POST'
              ? `@${item.author?.username || 'user'}`
              : item.author?.username
          }}
        </NuxtLink>
        <span
          v-if="item.type === 'PRODUCT'"
          class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          >Product</span
        >
      </div>

      <!-- Media slides only — text-only posts already show the full
           caption/content as the slide's main body above, so a truncated
           repeat of it down here would be redundant. -->
      <p
        v-if="hasMedia && item.caption"
        class="text-shadow line-clamp-2 pr-4 text-sm leading-snug text-white/95"
      >
        {{ item.caption }}
      </p>

      <!-- Standalone product slide: whole slide IS the product -->
      <button
        v-if="item.type === 'PRODUCT' && item.product"
        class="mt-1 inline-flex w-max items-center gap-2 rounded-full border border-white/50 bg-white/95 px-5 py-2.5 text-sm font-bold text-black shadow-xl backdrop-blur-md transition-transform active:scale-95"
        @click.stop="$emit('open-product-sheet', item.product)"
      >
        <div class="rounded-full bg-brand/10 p-1 text-brand">
          <Icon name="solar:bag-4-bold" size="16" />
        </div>
        Shop Now • {{ formatPrice(item.product.price || 0) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import TrustCardOverlay from '~~/layers/feed/app/components/TrustCardOverlay.vue'
import { usePost } from '~~/layers/social/app/composables/usePost'
import { usePostStore } from '~~/layers/social/app/store/post.store'
import { useProduct } from '~~/layers/commerce/app/composables/useProduct'
import { useLikedProducts } from '~~/layers/commerce/app/composables/useLikedProducts'
import { avatarSrc } from '~~/layers/core/app/utils/cloudinary'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { useShareModal } from '~~/layers/social/app/composables/useShareModal'

const props = defineProps<{ item: IFeedItem; isActive: boolean }>()
defineEmits<{
  'open-comments': [item: IFeedItem]
  'open-product-sheet': [product: Partial<IProduct>]
}>()

const { formatPrice } = useCurrency()
const { openShare } = useShareModal()

// ── Media ────────────────────────────────────────────────────────────
// mediaItems is the full multi-media array; media is a legacy single-item
// fallback for items that only ever populated the older field.
const mediaItems = computed(() => {
  if (props.item.mediaItems?.length) return props.item.mediaItems
  return props.item.media ? [props.item.media] : []
})
const hasMedia = computed(() => mediaItems.value.length > 0)

// ── Text-only posts ─────────────────────────────────────────────────
// Same gradient-by-content-type language as PostCard.vue's own text-only
// treatment (used in SocialFeed's card view) — values duplicated rather
// than imported so this component's dependencies stay fully separate from
// SocialFeed.vue's.
const isTextLong = computed(
  () => (props.item.content?.length ?? props.item.caption?.length ?? 0) > 220,
)
const textExpanded = ref(false)
const TEXT_BG_MAP: Record<string, { bg: string; text: string }> = {
  EXPERIENCE: {
    bg: 'linear-gradient(160deg, #0d1b2e 0%, #1a3a5c 100%)',
    text: '#7dd3fc',
  },
  INSPIRATION: {
    bg: 'linear-gradient(160deg, #1f1400 0%, #3d2800 100%)',
    text: '#fde047',
  },
  EDUCATIONAL: {
    bg: 'linear-gradient(160deg, #1a0d00 0%, #3b1f00 100%)',
    text: '#fb923c',
  },
  ENTERTAINMENT: {
    bg: 'linear-gradient(160deg, #1f0016 0%, #3d0030 100%)',
    text: '#f472b6',
  },
  COMMERCE: {
    bg: 'linear-gradient(160deg, #00180f 0%, #003d22 100%)',
    text: '#34d399',
  },
}
const TEXT_BG_DEFAULT = {
  bg: 'linear-gradient(160deg, #111111 0%, #222222 100%)',
  text: '#f3f4f6',
}
const textBgStyle = computed(
  () => TEXT_BG_MAP[props.item.contentType] ?? TEXT_BG_DEFAULT,
)

// ── Carousel ─────────────────────────────────────────────────────────
// Tracks which media page is showing (for the dot indicator) and which
// video, if any, should actually be playing — only the page that's both
// the current carousel position AND on the active slide, everything else
// stays paused (matches the old single-video behavior, generalized to N).
const carouselRef = ref<HTMLElement | null>(null)
const carouselIndex = ref(0)
const videoRefs = ref<(HTMLVideoElement | null)[]>([])
const setVideoRef = (el: unknown, i: number) => {
  videoRefs.value[i] = el as HTMLVideoElement | null
}

let scrollRaf: number | null = null
const onCarouselScroll = () => {
  if (scrollRaf !== null) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null
    const el = carouselRef.value
    if (!el || el.clientWidth === 0) return
    carouselIndex.value = Math.round(el.scrollLeft / el.clientWidth)
  })
}

const syncVideoPlayback = () => {
  videoRefs.value.forEach((v, i) => {
    if (!v) return
    if (props.isActive && i === carouselIndex.value) {
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  })
}
watch([() => props.isActive, carouselIndex], syncVideoPlayback)
onMounted(syncVideoPlayback)

// ── Trust Card ───────────────────────────────────────────────────────
const trustCardOpen = ref(false)
// Real slug only — author.storeSlug (seller-authored posts + products), or
// the product's own seller. Deliberately no `author.username` fallback: it's
// a different field, so falling back would open the wrong store or 404.
const storeSlug = computed(
  () =>
    props.item.author?.storeSlug ||
    props.item.product?.seller?.store_slug ||
    null,
)

// ── Author ───────────────────────────────────────────────────────────
const authorLink = computed(() =>
  props.item.author?.role === 'seller'
    ? `/sellers/profile/${props.item.product?.seller?.store_slug || props.item.author?.username}`
    : `/profile/${props.item.author?.username}`,
)
const authorAvatar = computed(() =>
  avatarSrc(props.item.author?.avatar, props.item.author?.username),
)

// ── Like (posts vs products use different APIs) ─────────────────────
const { likePost, unlikePost } = usePost()
const postStore = usePostStore()
const { likeProduct, unlikeProduct } = useProduct()
const { isLiked: isProductLiked, markLiked, markUnliked } = useLikedProducts()

const localLikeCount = ref(props.item.likeCount || 0)
const liked = computed(() =>
  props.item.type === 'POST'
    ? postStore.isPostLiked(props.item.id)
    : isProductLiked(Number(props.item.product?.id ?? props.item.id)),
)
const likeCount = computed(() => localLikeCount.value)

const onLike = async () => {
  const wasLiked = liked.value
  localLikeCount.value += wasLiked ? -1 : 1
  try {
    if (props.item.type === 'POST') {
      if (wasLiked) await unlikePost(props.item.id)
      else await likePost(props.item.id)
    } else {
      const pid = Number(props.item.product?.id ?? props.item.id)
      if (wasLiked) {
        markUnliked(pid)
        await unlikeProduct(pid)
      } else {
        markLiked(pid)
        await likeProduct(pid)
      }
    }
  } catch {
    localLikeCount.value += wasLiked ? 1 : -1
  }
}

const onShare = () => {
  const path =
    props.item.type === 'POST'
      ? `/post/${props.item.id}`
      : `/product/${props.item.product?.slug || props.item.id}`
  const url = `${import.meta.client ? window.location.origin : ''}${path}`
  openShare(url, props.item.caption || 'Check this out on MarketX')
}

const formatCount = (n: number) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

onUnmounted(() => videoRefs.value.forEach((v) => v?.pause()))
</script>

<style scoped>
.text-shadow {
  text-shadow:
    1px 1px 3px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(0, 0, 0, 0.4);
}
</style>
