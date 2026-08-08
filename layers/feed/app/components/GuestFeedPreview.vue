<!-- GuestFeedPreview — the guest section below the desktop hero.
     Products, not posts: a first-time visitor asking "what is MarketX?" is
     better answered by real listings with real prices from real sellers than
     by a social feed of captions, and products are the thing they came to
     buy. Sourced from /api/commerce/products (the real catalogue endpoint
     with genuine server-side filtering) rather than /api/feed/home, which is
     post-first by design — it only injects PREMIUM sellers' products at one
     slot per four posts, so it surfaced ~0 products regardless of how many
     the catalogue actually holds.

     No sign-in wall. Every destination this links to is already public to
     guests (verified: /discover, /squares, /product/*, /sellers/profile/*
     all render without a token), so "sign in to see more" was describing a
     restriction that doesn't exist — it read as proof of limitation rather
     than proof of life. Auth belongs at the point of action (order, follow,
     message, pay), not at the point of looking. -->
<template>
  <div class="mx-auto w-full max-w-[600px] px-2 pb-16 pt-10 sm:px-0">
    <div class="mb-5 text-center">
      <p class="t-eyebrow">From the marketplace</p>
      <h2 class="t-title">What's on MarketX right now</h2>
    </div>

    <div v-if="pending && !products.length" class="space-y-6">
      <BaseSkeleton
        v-for="i in 3"
        :key="i"
        shape="block"
        height="320px"
        rounded="rounded-2xl"
      />
    </div>

    <template v-else-if="products.length">
      <!-- Full-width feed cards, not a grid of thumbnails — same
           ShopProductCard the authenticated feed uses, so a listing looks
           identical signed in or out and gets room for image, price,
           seller and actions. -->
      <div class="space-y-6">
        <ShopProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          compact
          @open-detail="openProduct"
          @open-comments="reviewProduct = $event"
        />
      </div>

      <!-- Products open reviews (buyer-gated), not a comment thread. -->
      <ProductReviewModal
        :is-open="!!reviewProduct"
        :product="reviewProduct"
        @close="reviewProduct = null"
      />

      <div class="pt-8 text-center">
        <NuxtLink
          to="/discover"
          class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition-colors hover:bg-brand/90"
        >
          Explore all products
          <Icon name="solar:arrow-right-linear" size="15" />
        </NuxtLink>
        <p class="mt-3 text-sm text-gray-500 dark:text-neutral-400">
          Or
          <NuxtLink
            to="/squares"
            class="font-semibold text-gray-900 underline underline-offset-2 dark:text-white"
            >browse market squares</NuxtLink
          >
          — no account needed.
        </p>
      </div>
    </template>

    <BaseEmptyState
      v-else
      icon="solar:bag-4-linear"
      title="No listings yet"
      description="Check back soon — sellers are still setting up shop."
      compact
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from '#imports'
import ShopProductCard from '~~/layers/commerce/app/components/ShopProductCard.vue'
import ProductReviewModal from '~~/layers/commerce/app/components/modals/ProductReviewModal.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'

defineOptions({ name: 'GuestFeedPreview' })

const pending = ref(true)
const products = ref<IProduct[]>([])
const reviewProduct = ref<IProduct | null>(null)

// ShopProductCard emits on click rather than linking internally, so without
// a handler the whole card would be inert. Guests go straight to the public
// product page (no modal, no auth) — /product/* renders fine without a token.
const openProduct = (product: IProduct) =>
  navigateTo(`/product/${product.slug ?? product.id}`)

onMounted(async () => {
  try {
    const res = (await useProductApi().getProducts({
      status: 'PUBLISHED',
      limit: 6,
      sortBy: 'newest',
    })) as { data?: { products?: IProduct[] } }
    // Only listings with an image — a text-only tile in a shop-window grid
    // reads as broken rather than sparse.
    products.value = (res.data?.products ?? []).filter((p) => p.media?.length)
  } catch {
    products.value = []
  } finally {
    pending.value = false
  }
})
</script>
