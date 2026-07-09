<!-- Market home — rendered inside HomeLayout by the auth-aware index.vue -->
<template>
  <div class="w-full space-y-10 px-1 sm:px-2">
    <!-- ─── 0. SEARCH (hero) — mobile/tablet only; desktop uses the right-rail search -->
    <section class="pt-1 lg:hidden">
      <form class="relative" role="search" @submit.prevent="goSearch">
        <Icon
          name="mdi:magnify"
          size="20"
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
        />
        <input
          v-model="searchQuery"
          type="search"
          enterkeyhint="search"
          placeholder="Search markets, traders or goods"
          aria-label="Search markets, traders or goods"
          class="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
        />
      </form>
    </section>

    <!-- ─── 1. DEALS (flagship) ───────────────────────────────────────────── -->
    <!-- Today's deals — hidden entirely when there are no live (<48h) flash deals -->
    <section v-if="dealsLoading || deals.length">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p
            class="mb-1 text-xs font-bold uppercase tracking-widest text-brand"
          >
            On sale now
          </p>
          <h2
            class="font-display text-2xl font-bold leading-tight text-gray-900 dark:text-white"
          >
            Today's deals
          </h2>
        </div>
        <NuxtLink
          to="/discover?tab=deals"
          class="mb-0.5 text-xs font-semibold text-gray-400 hover:text-brand dark:text-neutral-500"
        >
          See all →
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="dealsLoading && !deals.length"
        shape="block"
        height="208px"
        rounded="rounded-2xl"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="deals.length"
        :products="deals"
        :priority="true"
        label="Today's deals"
        hide-header
        @open-product="openProduct"
      />
    </section>

    <!-- ─── 2. MARKETS (Squares) ──────────────────────────────────────────── -->
    <section>
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p
            class="mb-1 text-xs font-bold uppercase tracking-widest text-brand"
          >
            Discover
          </p>
          <h2
            class="font-display text-xl font-bold leading-tight text-gray-900 dark:text-white"
          >
            Explore Nigeria's Digital Markets
          </h2>
          <p class="mt-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
            Step into real market squares — meet the traders inside
          </p>
        </div>
        <NuxtLink
          to="/squares"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-brand dark:text-neutral-400"
        >
          All markets →
        </NuxtLink>
      </div>

      <div
        v-if="squaresLoading && !squares.length"
        class="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
        style="height: 208px; contain: strict"
      >
        <BaseSkeleton
          v-for="i in 3"
          :key="i"
          shape="block"
          width="240px"
          height="200px"
          rounded="rounded-2xl"
          class="shrink-0"
        />
      </div>

      <!-- Empty / error state — API failed or no squares seeded -->
      <p
        v-else-if="!squaresLoading && !squares.length"
        class="text-xs text-gray-500 dark:text-neutral-400"
      >
        No markets open yet — check back soon
      </p>

      <div
        v-else-if="squares.length"
        class="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
      >
        <SquareCard
          v-for="sq in squares"
          :key="sq.id"
          :square="sq"
          variant="spotlight"
        />

        <NuxtLink
          to="/squares"
          class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 text-gray-400 transition hover:border-brand/40 hover:text-brand dark:border-neutral-700"
        >
          <Icon name="mdi:plus" size="20" />
          <span class="text-[10px] font-semibold">More</span>
        </NuxtLink>
      </div>
    </section>

    <!-- ─── 3. SELLERS ONLINE ─────────────────────────────────────────────── -->
    <section ref="section3Ref">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p
            class="mb-1 text-xs font-bold uppercase tracking-widest text-brand"
          >
            Happening now
          </p>
          <div class="flex items-center gap-2">
            <h2
              class="font-display text-lg font-bold text-gray-900 dark:text-white"
            >
              Traders selling live
            </h2>
            <span
              class="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400"
            >
              <!-- animate-pulse is suppressed by Reduce Motion (settings) and OS prefers-reduced-motion -->
              <span
                class="block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
              />
              Live
            </span>
          </div>
        </div>
        <NuxtLink
          to="/map"
          class="mb-0.5 text-xs font-semibold text-gray-400 hover:text-brand dark:text-neutral-500"
        >
          Map →
        </NuxtLink>
      </div>

      <div
        v-if="sellersLoading && !onlineSellers.length"
        class="scrollbar-hide flex gap-4 overflow-x-auto pb-1"
        style="height: 88px; contain: strict"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="flex shrink-0 flex-col items-center gap-2"
        >
          <BaseSkeleton shape="circle" width="56px" height="56px" />
          <BaseSkeleton shape="line" width="40px" height="8px" />
        </div>
      </div>

      <div
        v-else-if="onlineSellers.length"
        class="scrollbar-hide flex gap-4 overflow-x-auto pb-1"
      >
        <NuxtLink
          v-for="store in onlineSellers"
          :key="store.store_slug"
          :to="`/sellers/profile/${store.store_slug}`"
          class="group flex shrink-0 flex-col items-center gap-1.5"
        >
          <div class="relative">
            <div
              class="h-[56px] w-[56px] overflow-hidden rounded-full bg-gray-100 ring-2 ring-green-400 ring-offset-1 dark:bg-neutral-800 dark:ring-offset-neutral-950"
            >
              <img
                v-if="store.store_logo"
                :src="sellerAvatar(store.store_logo)"
                :alt="store.store_name ?? ''"
                width="56"
                height="56"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-sm font-black text-brand"
              >
                {{
                  (store.store_name ?? store.store_slug ?? '?')
                    .slice(0, 2)
                    .toUpperCase()
                }}
              </div>
            </div>
            <span
              class="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-950"
            />
            <span
              v-if="store.hasActiveDeal"
              class="absolute -right-0.5 -top-0.5 rounded-full bg-brand px-1 py-px text-[8px] font-black leading-tight text-white"
            >
              DEAL
            </span>
          </div>
          <p
            class="w-[60px] truncate text-center text-[11px] font-medium text-gray-600 group-hover:text-brand dark:text-neutral-400"
          >
            {{ store.store_name || store.store_slug }}
          </p>
        </NuxtLink>
      </div>

      <button
        v-else-if="section3Loaded && !sellersLoading"
        class="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-left hover:border-brand/30 dark:border-neutral-700 dark:bg-neutral-800/40"
        :disabled="sellersRequesting"
        @click="requestSellerLocation"
      >
        <Icon
          v-if="sellersRequesting"
          name="mdi:loading"
          size="18"
          class="animate-spin text-brand"
        />
        <Icon
          v-else
          name="mdi:crosshairs-gps"
          size="18"
          class="text-gray-400"
        />
        <span class="text-[13px] text-gray-500 dark:text-neutral-400">
          {{
            sellersRequesting
              ? 'Finding traders near you…'
              : "See who's trading near you"
          }}
        </span>
      </button>
    </section>

    <!-- ─── 4. FRESH STOCK ────────────────────────────────────────────────── -->
    <section ref="section4Ref">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p
            class="mb-1 text-xs font-bold uppercase tracking-widest text-brand"
          >
            New this week
          </p>
          <h2
            class="font-display text-xl font-bold text-gray-900 dark:text-white"
          >
            Fresh from the market
          </h2>
          <p class="mt-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
            New goods from traders this week
          </p>
        </div>
        <NuxtLink
          to="/discover?tab=fresh"
          class="mb-0.5 text-xs font-semibold text-gray-400 hover:text-brand dark:text-neutral-500"
        >
          See all →
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="freshLoading && !freshItems.length"
        shape="block"
        height="208px"
        rounded="rounded-2xl"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="freshItems.length"
        :products="freshItems"
        label="Fresh from the market"
        hide-header
        @open-product="openProduct"
      />
    </section>

    <!-- ─── 5. MARKET PULSE (community posts) ─────────────────────────────── -->
    <section ref="section5Ref">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p
            class="mb-1 text-xs font-bold uppercase tracking-widest text-brand"
          >
            From the community
          </p>
          <h2
            class="font-display text-lg font-bold text-gray-900 dark:text-white"
          >
            Market Pulse
          </h2>
          <p class="mt-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
            Latest updates from merchants, creators and communities
          </p>
        </div>
        <NuxtLink
          to="/"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-400 hover:text-brand dark:text-neutral-500"
          @click.prevent="$emit('sign-in')"
        >
          Sign in for more →
        </NuxtLink>
      </div>

      <div v-if="postsLoading && !marketPosts.length" class="space-y-4">
        <BaseSkeleton
          v-for="i in 2"
          :key="i"
          shape="block"
          height="176px"
          rounded="rounded-2xl"
          class="[contain:strict]"
        />
      </div>

      <div v-else-if="marketPosts.length" class="space-y-4">
        <PostCard
          v-for="post in marketPosts"
          :key="post.id"
          :post="post"
          @open-comments="selectedPost = $event"
          @open-details="selectedPost = $event"
          @open-product="openProduct"
        />
      </div>

      <!-- Empty — encourage exploration instead of a dangling header -->
      <BaseEmptyState
        v-else
        icon="mdi:storefront-outline"
        title="The market is quiet right now"
        description="Follow traders and markets to see their latest here."
        compact
      >
        <template #actions>
          <BaseButton
            variant="primary"
            size="sm"
            @click="navigateTo('/squares')"
          >
            Explore markets
            <Icon name="mdi:arrow-right" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- ─── 6. MAP CTA ────────────────────────────────────────────────────── -->
    <section class="pb-4">
      <NuxtLink
        to="/map"
        class="flex items-center gap-4 rounded-2xl bg-gray-900 px-5 py-4 transition hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        <Icon
          name="mdi:map-search-outline"
          size="28"
          class="shrink-0 text-white/60"
        />
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-white">
            Explore the market map
          </p>
          <p class="text-[12px] text-white/50">
            Stores, pop-ups and deals near you
          </p>
        </div>
        <Icon name="mdi:arrow-right" size="20" class="shrink-0 text-white/40" />
      </NuxtLink>
    </section>

    <!-- Modals — teleported to body, position in DOM doesn't matter -->
    <ProductDetailModal
      v-if="selectedProduct"
      :product="selectedProduct"
      :loading="productDetailLoading"
      @close="selectedProduct = null"
      @open-comments="
        (p) => {
          commentProduct = p
          selectedProduct = null
        }
      "
    />
    <ProductCommentModal
      :is-open="!!commentProduct"
      :product="commentProduct"
      @close="commentProduct = null"
    />
    <PostDetailModal
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
    />
  </div>
</template>

<script setup lang="ts">
import FeedProductShelf from '~~/layers/feed/app/components/FeedProductShelf.vue'
import PostCard from '~~/layers/social/app/components/PostCard.vue'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import PostDetailModal from '~~/layers/social/app/components/modals/PostDetailModal.vue'
import ProductCommentModal from '~~/layers/commerce/app/components/modals/ProductCommentModal.vue'

import { ref } from 'vue'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useMarketHome } from '../composables/useMarketHome'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { IProduct } from '~~/layers/social/app/types/post.types'

defineEmits<{ 'sign-in': [] }>()

// ── Hero search — routes to the full search page ────────────────────────────────
const searchQuery = ref('')
const goSearch = () =>
  navigateTo(
    searchQuery.value.trim()
      ? `/discover?q=${encodeURIComponent(searchQuery.value.trim())}`
      : '/discover',
  )

const {
  selectedProduct,
  detailLoading: productDetailLoading,
  openProduct,
} = useProductDetail()
const commentProduct = ref<IProduct | null>(null)
const selectedPost = ref<IFeedItem | null>(null)

const sellerAvatar = (url: string) => imgAvatar(url)

const {
  deals,
  dealsLoading,
  squares,
  squaresLoading,
  section3Ref,
  section3Loaded,
  onlineSellers,
  sellersLoading,
  sellersRequesting,
  requestSellerLocation,
  section4Ref,
  freshItems,
  freshLoading,
  section5Ref,
  marketPosts,
  postsLoading,
} = useMarketHome()
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
