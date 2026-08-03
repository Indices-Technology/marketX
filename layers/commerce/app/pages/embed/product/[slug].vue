<template>
  <div class="embed-root">
    <div v-if="pending" class="skeleton" aria-hidden="true">
      <div class="skeleton-media" />
      <div class="skeleton-line" style="width: 70%" />
      <div class="skeleton-line" style="width: 40%" />
    </div>

    <div v-else-if="!product" class="empty-state">
      <p>Product unavailable</p>
    </div>

    <div v-else class="card">
      <div
        class="media"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <template v-if="tiles.length">
          <video
            v-if="activeTile.isVideo"
            :key="activeTile.url"
            :src="activeTile.videoSrc"
            :poster="activeTile.url"
            class="media-el"
            autoplay
            muted
            loop
            playsinline
          />
          <img
            v-else
            :src="activeTile.url"
            :alt="product.title"
            class="media-el"
          />

          <template v-if="tiles.length > 1">
            <button
              type="button"
              class="nav-btn nav-prev"
              aria-label="Previous photo"
              @click="prevTile"
            >
              ‹
            </button>
            <button
              type="button"
              class="nav-btn nav-next"
              aria-label="Next photo"
              @click="nextTile"
            >
              ›
            </button>
            <div class="dots">
              <button
                v-for="(t, i) in tiles"
                :key="i"
                type="button"
                class="dot"
                :class="{ active: i === activeIndex }"
                :aria-label="`Show photo ${i + 1}`"
                @click="activeIndex = i"
              />
            </div>
          </template>
        </template>
        <div v-else class="media-el media-empty" />

        <span v-if="discountPct" class="discount-flag"
          >{{ discountPct }}% OFF</span
        >
      </div>

      <div class="body">
        <p class="title">{{ product.title }}</p>
        <div class="price-row">
          <span class="price">{{ priceText }}</span>
          <span v-if="discountPct" class="price-strike">{{
            originalPriceText
          }}</span>
        </div>

        <div v-if="product.seller" class="seller-row">
          <img
            v-if="product.seller.store_logo"
            :src="imgAvatar(product.seller.store_logo)"
            :alt="product.seller.store_name"
            class="seller-logo"
          />
          <div v-else class="seller-logo seller-logo-fallback" />
          <span class="seller-name">{{ product.seller.store_name }}</span>
          <svg
            v-if="product.seller.is_verified"
            class="verified-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5L12 2Z"
            />
          </svg>
        </div>

        <a
          :href="ctaHref"
          target="_blank"
          rel="noopener noreferrer nofollow"
          class="cta"
        >
          View on MarketX
        </a>
        <p class="badge">Powered by MarketX</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'
import {
  imgAvatar,
  imgBanner,
  videoFeedUrl,
  videoThumb,
} from '~~/layers/core/app/utils/cloudinary'
import { formatProductPrice } from '~~/shared/utils/currency'

// No site chrome — this page is meant to be iframed on a third-party page, not
// browsed directly. See nuxt.config.ts EMBED_CSP for the matching frame-ancestors
// relaxation scoped to /embed/**.
definePageMeta({ layout: false })

const route = useRoute()
const slug = computed(() => route.params.slug as string)
// The EMBED distribution's short code, minted by POST /api/growth/assets/embed
// and baked into the <iframe src> the seller copies. Absent → the card still
// renders (untracked) and its CTA falls back to the plain product URL.
const code = computed(() =>
  typeof route.query.code === 'string' ? route.query.code : '',
)

const COVER_W = 800
const COVER_H = 1000

const { data, pending } = await useAsyncData(
  `embed-product-${slug.value}`,
  () => useProductApi().getProductBySlug(slug.value),
)
const product = computed<any>(() => data.value?.data ?? null)

const tiles = computed(() => {
  const media = (product.value?.media ?? []).filter((m: any) => !m?.isBgMusic)
  return media.map((m: any) => {
    const isVideo = (m?.type ?? '').toUpperCase() === 'VIDEO'
    return {
      isVideo,
      // <img>/poster source (also the video's poster frame).
      url: isVideo
        ? videoThumb(m.url, { width: COVER_W, height: COVER_H })
        : imgBanner(m.url, COVER_W, COVER_H),
      videoSrc: isVideo ? videoFeedUrl(m.url) : undefined,
    }
  })
})

const activeIndex = ref(0)
const activeTile = computed(
  () => tiles.value[activeIndex.value] ?? tiles.value[0],
)
watch(slug, () => {
  activeIndex.value = 0
})

const prevTile = () => {
  if (!tiles.value.length) return
  activeIndex.value =
    (activeIndex.value - 1 + tiles.value.length) % tiles.value.length
}
const nextTile = () => {
  if (!tiles.value.length) return
  activeIndex.value = (activeIndex.value + 1) % tiles.value.length
}

const SWIPE_THRESHOLD = 40
const touchStartX = ref(0)
const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0]?.clientX ?? 0
}
const onTouchEnd = (e: TouchEvent) => {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.value
  if (Math.abs(dx) < SWIPE_THRESHOLD) return
  if (dx < 0) nextTile()
  else prevTile()
}

const discountPct = computed(() => product.value?.discount || 0)
const priceMajor = computed(() => {
  const p = product.value
  if (!p) return 0
  return discountPct.value > 0
    ? Math.round(p.price * (1 - discountPct.value / 100))
    : p.price
})
const priceText = computed(() => formatProductPrice(priceMajor.value, 'NGN'))
const originalPriceText = computed(() =>
  product.value ? formatProductPrice(product.value.price, 'NGN') : '',
)

// The tracked link (goes through /r/{code}, which logs the CLICK and redirects
// to the real product page) when this embed came from a minted distribution;
// otherwise the plain product URL. Relative, so it resolves against THIS page's
// own origin (marketx.africa) regardless of the parent page embedding it.
const ctaHref = computed(() =>
  code.value ? `/r/${code.value}` : `/product/${slug.value}`,
)

// Impression ping — fire-and-forget, never blocks or breaks rendering. Only
// fired when this embed carries a real distribution code.
onMounted(() => {
  if (!code.value) return
  $fetch('/api/growth/embed/view', {
    method: 'POST',
    body: { code: code.value },
  }).catch(() => {
    /* impression logging is best-effort */
  })
})

useHead({
  title: computed(() => product.value?.title ?? 'Product'),
})
</script>

<style scoped>
.embed-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 320px;
  margin: 0 auto;
}
.card {
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #f3f4f6;
  touch-action: pan-y;
}
.media-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.media-empty {
  background: linear-gradient(
    135deg,
    rgba(244, 63, 94, 0.15),
    rgba(244, 63, 94, 0.05)
  );
}
.discount-flag {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 2;
  border-radius: 8px;
  background: #f43f5e;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.nav-prev {
  left: 8px;
}
.nav-next {
  right: 8px;
}
.dots {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
}
.dot.active {
  width: 16px;
  background: #fff;
}
.body {
  padding: 14px 16px 16px;
}
.title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price-row {
  margin-top: 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price {
  font-size: 18px;
  font-weight: 800;
  color: #f43f5e;
}
.price-strike {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}
.seller-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.seller-logo {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}
.seller-logo-fallback {
  background: #f43f5e;
}
.seller-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.verified-icon {
  width: 13px;
  height: 13px;
  color: #3b82f6;
  flex-shrink: 0;
}
.cta {
  margin-top: 12px;
  display: block;
  text-align: center;
  border-radius: 12px;
  background: #f43f5e;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 0;
  text-decoration: none;
}
.badge {
  margin: 8px 0 0;
  text-align: center;
  font-size: 10px;
  color: #9ca3af;
}
.skeleton,
.empty-state {
  padding: 16px;
}
.skeleton-media {
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  background: #f3f4f6;
}
.skeleton-line {
  height: 12px;
  margin-top: 10px;
  border-radius: 6px;
  background: #f3f4f6;
}
.empty-state {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #171717;
    border-color: #262626;
  }
  .media {
    background: #262626;
  }
  .title {
    color: #f5f5f5;
  }
  .seller-name {
    color: #d4d4d4;
  }
  .seller-logo {
    border-color: #404040;
  }
  .badge {
    color: #737373;
  }
  .skeleton-media,
  .skeleton-line {
    background: #262626;
  }
}
</style>
