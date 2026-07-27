<!--
  TrustMarketHome — Professional revision.
  Positioning: the COMPANY is trust infrastructure; the HOMEPAGE sells safe
  commerce. Lead with the buyer's job; reveal the Trust Card as the mechanism
  lower down — an explanation, not the pitch.

  IA: Hero + Find/Verify dock → How protected buying works → Trusted sellers
      → Markets → Products → Why sellers join → Trust Card (mechanism)
      → Credit vision.
-->
<template>
  <div class="w-full space-y-16 px-4 pb-12 sm:px-6">
    <!-- ── 1. HERO + DUAL-ACTION DOCK ─────────────────────────────────────── -->
    <section class="pt-8">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Nigeria's safe-commerce network
        </p>

        <h1
          class="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl"
        >
          Buy safely from trusted<br class="hidden sm:block" />
          Nigerian businesses.
        </h1>
        <p
          class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600"
        >
          Verify any seller in seconds. Pay into protected escrow, and release
          funds only when your order arrives.
        </p>
      </div>

      <div ref="searchRoot" class="relative mx-auto mt-8 max-w-2xl">
        <div class="rounded-xl border border-gray-200 bg-white p-2">
          <!-- Tab selector -->
          <div
            role="tablist"
            aria-label="Find or verify a seller"
            class="mb-2 flex rounded-lg bg-gray-100 p-1"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="activeHeroTab === 'search'"
              class="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold"
              :class="
                activeHeroTab === 'search'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              "
              @click="activeHeroTab = 'search'"
            >
              <Icon name="solar:magnifer-linear" size="15" />
              Find a trader
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeHeroTab === 'verify'"
              class="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold"
              :class="
                activeHeroTab === 'verify'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              "
              @click="activeHeroTab = 'verify'"
            >
              <Icon name="solar:shield-user-linear" size="15" />
              Verify any seller
            </button>
          </div>

          <!-- Find tab -->
          <div
            v-if="activeHeroTab === 'search'"
            class="flex items-center gap-2 px-2 py-1"
          >
            <Icon
              name="solar:magnifer-linear"
              size="20"
              class="shrink-0 text-gray-400"
            />
            <label class="sr-only" for="trust-home-search"
              >Search markets, traders or goods</label
            >
            <input
              id="trust-home-search"
              v-model="searchQuery"
              type="text"
              autocomplete="off"
              placeholder="Search markets, traders or goods…"
              class="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
              @focus="searchFocused = true"
              @keydown.enter="submitSearch"
              @keydown.escape="closeSearch"
            />
            <button
              v-if="searchQuery"
              type="button"
              aria-label="Clear search"
              class="rounded-full p-1 text-gray-400 hover:text-gray-700"
              @click="clearSearch"
            >
              <Icon name="solar:close-circle-linear" size="18" />
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              @click="submitSearch"
            >
              Search
            </button>
          </div>

          <!-- Verify tab -->
          <form
            v-else
            class="flex items-center gap-2 px-2 py-1"
            @submit.prevent="submitVerify"
          >
            <Icon
              name="solar:shield-user-linear"
              size="20"
              class="shrink-0 text-gray-600"
            />
            <label class="sr-only" for="trust-home-verify"
              >Enter a seller's phone, handle or link</label
            >
            <input
              id="trust-home-verify"
              v-model="verifyQuery"
              type="text"
              autocomplete="off"
              placeholder="Phone, @instagram_handle or shop link…"
              class="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
            >
              Verify seller
            </button>
          </form>
        </div>

        <!-- Dropdown -->
        <div
          v-if="
            activeHeroTab === 'search' && searchFocused && !searchQuery.trim()
          "
          class="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white p-2"
        >
          <SearchSuggestions @search="onSuggestion" @close="closeSearch" />
        </div>

        <div
          v-else-if="activeHeroTab === 'search' && showLiveResults"
          class="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div
            v-if="searchLoading && !liveHasHits"
            class="flex items-center justify-center py-6"
          >
            <Icon
              name="solar:refresh-linear"
              size="20"
              class="animate-spin text-gray-300"
            />
          </div>
          <div
            v-else-if="!liveHasHits"
            class="px-4 py-6 text-center text-sm text-gray-400"
          >
            No results for "{{ searchQuery }}"
          </div>
          <div v-else class="max-h-80 overflow-y-auto py-1">
            <template v-if="liveResults.stores.length">
              <p
                class="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"
              >
                Traders
              </p>
              <NuxtLink
                v-for="s in liveResults.stores.slice(0, 3)"
                :key="`s-${s.id}`"
                :to="`/sellers/profile/${s.store_slug}`"
                class="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50"
                @click="onResultClick"
              >
                <StoreAvatar
                  :store-name="s.store_name ?? undefined"
                  :logo="s.store_logo ?? undefined"
                  size="sm"
                />
                <span class="truncate text-sm font-medium text-gray-900">{{
                  s.store_name
                }}</span>
              </NuxtLink>
            </template>
            <template v-if="liveResults.products.length">
              <p
                class="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"
              >
                Goods
              </p>
              <NuxtLink
                v-for="p in liveResults.products.slice(0, 4)"
                :key="`p-${p.id}`"
                :to="`/product/${p.slug}`"
                class="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50"
                @click="onResultClick"
              >
                <div
                  class="h-9 w-9 shrink-0 overflow-hidden rounded bg-gray-100"
                >
                  <img
                    v-if="p.media?.[0]?.url"
                    :src="imgThumb(p.media[0].url) ?? p.media[0].url"
                    :alt="p.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon
                      name="solar:bag-4-linear"
                      size="14"
                      class="text-gray-400"
                    />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900">
                    {{ p.title }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ formatPrice(p.price ?? 0) }}
                  </p>
                </div>
              </NuxtLink>
            </template>
            <div class="border-t border-gray-100 p-2">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                @click="submitSearch"
              >
                See all results
                <Icon name="solar:arrow-right-linear" size="14" />
              </button>
            </div>
          </div>
        </div>

        <p class="mt-4 text-center text-xs font-medium text-gray-500">
          Selling instead?
          <NuxtLink
            to="/sellers/create"
            class="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700"
          >
            Become a verified seller →
          </NuxtLink>
        </p>
      </div>
    </section>

    <!-- ── 2. HOW PROTECTED BUYING WORKS ──────────────────────────────────── -->
    <section>
      <div class="mx-auto mb-8 max-w-xl text-center">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Guaranteed protection
        </p>
        <h2 class="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
          How protected buying works
        </h2>
      </div>
      <ol class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(step, i) in HOW_IT_WORKS"
          :key="step.title"
          class="rounded-lg border border-gray-200 bg-white p-5"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white"
              aria-hidden="true"
              >{{ i + 1 }}</span
            >
            <Icon :name="step.icon" size="20" class="text-gray-500" />
          </div>
          <h3 class="mt-4 text-sm font-bold text-gray-900">
            {{ step.title }}
          </h3>
          <p class="mt-1 text-xs leading-relaxed text-gray-500">
            {{ step.desc }}
          </p>
        </li>
      </ol>
    </section>

    <!-- ── 3. TRUSTED SELLERS ────────────────────────────────────────────── -->
    <TrustSpotlightRail />

    <!-- ── 4. MARKETS ─────────────────────────────────────────────────────── -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p
            class="text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Local hubs
          </p>
          <h2 class="text-lg font-bold text-gray-900">
            Nigeria's markets, online
          </h2>
          <p class="mt-0.5 text-sm text-gray-500">
            Real market squares — step in and meet the traders inside
          </p>
        </div>
        <NuxtLink
          to="/squares"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-900"
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
          rounded="rounded-lg"
          class="shrink-0"
        />
      </div>
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
          class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
        >
          <Icon name="solar:add-circle-linear" size="20" />
          <span class="text-[10px] font-semibold">More</span>
        </NuxtLink>
      </div>
      <BaseEmptyState
        v-else
        icon="solar:shop-linear"
        title="The first markets are being set up"
        description="Check back soon, or browse traders and goods already live."
        compact
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/discover')"
          >
            Browse discover
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- ── 5. PRODUCTS ────────────────────────────────────────────────────── -->
    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <p
            class="text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Live inventory
          </p>
          <h2 class="text-lg font-bold text-gray-900">
            Fresh from verified traders
          </h2>
          <p class="mt-0.5 text-sm text-gray-500">
            Every one from a seller you can pay protected
          </p>
        </div>
        <NuxtLink
          to="/discover?tab=fresh"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          See all →
        </NuxtLink>
      </div>

      <BaseSkeleton
        v-if="discoveryLoading && !discoveryItems.length"
        shape="block"
        height="208px"
        rounded="rounded-lg"
        class="[contain:strict]"
      />
      <FeedProductShelf
        v-else-if="discoveryItems.length"
        :products="discoveryItems"
        :priority="true"
        label="Fresh from the market"
        hide-header
        @open-product="openProduct"
      />
      <BaseEmptyState
        v-else
        icon="solar:bag-4-linear"
        title="Fresh goods are being arranged"
        description="Check the markets above, or come back when traders add new stock."
        compact
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/squares')"
          >
            Explore markets
            <Icon name="solar:arrow-right-linear" size="13" />
          </BaseButton>
        </template>
      </BaseEmptyState>
    </section>

    <!-- ── 6. WHY SELLERS JOIN ───────────────────────────────────────────── -->
    <section class="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
      <div class="mb-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
          For businesses
        </p>
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          Why sellers join
        </h2>
        <p class="mt-0.5 text-sm text-gray-500">
          Turn "trust me" into proof buyers can check in one tap
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div
          v-for="reason in SELLER_REASONS"
          :key="reason.title"
          class="flex items-start gap-3"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
          >
            <Icon :name="reason.icon" size="18" />
          </span>
          <div>
            <p class="text-sm font-bold text-gray-900">
              {{ reason.title }}
            </p>
            <p class="mt-0.5 text-[13px] leading-relaxed text-gray-500">
              {{ reason.desc }}
            </p>
          </div>
        </div>
      </div>
      <div class="mt-6">
        <BaseButton
          variant="primary"
          size="md"
          @click="navigateTo('/sellers/create')"
        >
          Become a verified seller
          <Icon name="solar:arrow-right-linear" size="15" />
        </BaseButton>
      </div>
    </section>

    <!-- ── 7. TRUST CARD — the mechanism ──────────────────────────────────── -->
    <section class="rounded-xl bg-gray-900 p-8 text-white sm:p-12">
      <div class="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            The mechanism
          </p>
          <h2 class="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
            How every seller earns your trust.
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-300">
            Behind every protected purchase is the
            <strong class="text-white">Trust Card</strong> — a portable
            reputation credential earned only through completed, successful
            escrow transactions, and carried across WhatsApp, Instagram, a
            seller's shop and their parcels.
          </p>
          <ul class="mt-6 space-y-3">
            <li
              v-for="point in TRUST_CARD_POINTS"
              :key="point"
              class="flex items-center gap-3 text-xs font-medium text-gray-200"
            >
              <Icon
                name="solar:check-circle-bold"
                size="18"
                class="shrink-0 text-gray-400"
              />
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>

        <div class="flex justify-center">
          <div
            class="relative w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-6"
          >
            <span
              class="absolute right-3 top-3 rounded border border-gray-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500"
              >Illustration</span
            >
            <div
              class="flex items-center justify-between border-b border-gray-700 pb-4"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-gray-300"
                >
                  <Icon name="solar:shield-check-bold" size="20" />
                </div>
                <div>
                  <p class="text-xs font-bold text-white">Verified merchant</p>
                  <p class="text-[10px] text-gray-400">Public Seller ID</p>
                </div>
              </div>
              <Icon
                name="solar:qr-code-linear"
                size="28"
                class="text-gray-400"
              />
            </div>
            <ul class="mt-4 space-y-2">
              <li class="flex items-center gap-2 text-[11px] text-gray-300">
                <Icon
                  name="solar:check-circle-bold"
                  size="14"
                  class="text-gray-500"
                />
                Identity verified
              </li>
              <li class="flex items-center gap-2 text-[11px] text-gray-300">
                <Icon
                  name="solar:check-circle-bold"
                  size="14"
                  class="text-gray-500"
                />
                Reputation from completed escrows
              </li>
              <li class="flex items-center gap-2 text-[11px] text-gray-300">
                <Icon
                  name="solar:check-circle-bold"
                  size="14"
                  class="text-gray-500"
                />
                Scannable anywhere you find them
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 8. CREDIT VISION ───────────────────────────────────────────────── -->
    <section class="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Where this goes
      </p>
      <h2 class="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
        Today's transaction becomes tomorrow's loan.
      </h2>
      <p class="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
        Every clean, protected sale becomes a record lenders can read. Sellers
        who build reputation on MarketX build the credit history Nigeria's
        informal economy has never had a way to prove.
      </p>
    </section>

    <!-- ── 9. MARKET PULSE ────────────────────────────────────────────────── -->
    <section ref="section5Ref" class="mx-auto max-w-[560px]">
      <div class="mb-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
          From the community
        </p>
        <h2 class="text-lg font-bold text-gray-900">
          Real people, trading now
        </h2>
        <p class="mt-0.5 text-sm text-gray-500">
          The latest from merchants, creators and markets
        </p>
      </div>

      <div v-if="postsLoading && !marketPosts.length" class="space-y-4">
        <BaseSkeleton
          v-for="i in 2"
          :key="i"
          shape="block"
          height="176px"
          rounded="rounded-lg"
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

        <div class="pt-6 text-center">
          <p class="text-base font-bold text-gray-900">This is just a peek.</p>
          <p class="mx-auto mt-1 max-w-xs text-sm text-gray-500">
            Sign in to see the full market feed — everything happening across
            Nigeria's traders, right now.
          </p>
          <BaseButton
            variant="primary"
            size="md"
            class="mt-4"
            @click="$emit('sign-in')"
          >
            Sign in to see more
            <Icon name="solar:arrow-right-linear" size="15" />
          </BaseButton>
        </div>
      </div>

      <BaseEmptyState
        v-else
        icon="solar:chat-round-line-linear"
        title="The market is quiet right now"
        description="Follow traders and markets to see their latest here."
        compact
      />
    </section>

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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { navigateTo } from '#imports'

import TrustSpotlightRail from '~~/layers/reputation/app/components/TrustSpotlightRail.vue'
import FeedProductShelf from '~~/layers/feed/app/components/FeedProductShelf.vue'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import ProductCommentModal from '~~/layers/commerce/app/components/modals/ProductCommentModal.vue'
import PostCard from '~~/layers/social/app/components/PostCard.vue'
import PostDetailModal from '~~/layers/social/app/components/modals/PostDetailModal.vue'
import SearchSuggestions from '~~/layers/commerce/app/components/discover/SearchSuggestions.vue'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'

import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useMarketHome } from '../composables/useMarketHome'
import { useSearchApi } from '~~/layers/core/app/services/search.api'
import { useRecentSearches } from '~~/layers/commerce/app/composables/useRecentSearches'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { User } from '~~/layers/core/app/types/user'
import type { Product } from '~~/shared/types/product'

defineOptions({ name: 'TrustMarketHome' })
defineEmits<{ 'sign-in': [] }>()

const activeHeroTab = ref<'search' | 'verify'>('search')

const HOW_IT_WORKS = [
  {
    icon: 'solar:shield-check-linear',
    title: 'Verify the seller',
    desc: 'Check identity and reputation before you send a naira.',
  },
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    title: 'Pay into protection',
    desc: "Funds are held safely — the seller can't touch them yet.",
  },
  {
    icon: 'solar:box-linear',
    title: 'Receive your item',
    desc: 'Inspect the delivery, as it was described.',
  },
  {
    icon: 'solar:check-circle-linear',
    title: 'Release funds',
    desc: 'The seller is paid only when you approve. Not before.',
  },
]

const SELLER_REASONS = [
  {
    icon: 'solar:verified-check-linear',
    title: 'Win buyers faster',
    desc: 'A verified card turns strangers into customers who trust you.',
  },
  {
    icon: 'solar:wallet-money-linear',
    title: 'Get paid reliably',
    desc: 'Protected payments mean fewer disputes and no chargebacks.',
  },
  {
    icon: 'solar:graph-up-linear',
    title: 'Build a portable reputation',
    desc: 'Every clean sale becomes credit history you own and carry.',
  },
]

const TRUST_CARD_POINTS = [
  'Verified identity — not just a follower count',
  'Reputation earned through completed, protected sales',
  'A scannable QR your buyers can check in one tap',
]

const { formatPrice } = useCurrency()
const searchApi = useSearchApi()
const recentSearches = useRecentSearches()

const searchRoot = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const verifyQuery = ref('')
const searchFocused = ref(false)
const searchLoading = ref(false)

interface LiveResults {
  products: Product[]
  stores: User[]
  users: User[]
}
const empty: LiveResults = { products: [], stores: [], users: [] }
const liveResults = ref<LiveResults>({ ...empty })

const liveHasHits = computed(
  () =>
    liveResults.value.products.length > 0 ||
    liveResults.value.stores.length > 0,
)
const showLiveResults = computed(
  () => searchFocused.value && searchQuery.value.trim().length >= 2,
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = val.trim()
  if (q.length < 2) {
    liveResults.value = { ...empty }
    searchLoading.value = false
    return
  }
  searchLoading.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const res = await searchApi.search(q, 'all', 6)
      if (res?.success && res.data) {
        liveResults.value = {
          products: res.data.products ?? [],
          stores: res.data.stores ?? [],
          users: res.data.users ?? [],
        }
      }
    } catch {
      liveResults.value = { ...empty }
    } finally {
      searchLoading.value = false
    }
  }, 300)
})

const onSuggestion = (term: string) => {
  searchQuery.value = term
  recentSearches.add(term)
}
const clearSearch = () => {
  searchQuery.value = ''
  liveResults.value = { ...empty }
}
const closeSearch = () => {
  searchFocused.value = false
}
const onResultClick = () => {
  const q = searchQuery.value.trim()
  if (q) recentSearches.add(q)
  closeSearch()
}
const submitSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return navigateTo('/discover')
  recentSearches.add(q)
  closeSearch()
  return navigateTo(`/discover?q=${encodeURIComponent(q)}`)
}

const submitVerify = () => {
  const q = verifyQuery.value.trim()
  return navigateTo(
    q
      ? `/discover?tab=sellers&q=${encodeURIComponent(q)}`
      : '/discover?tab=sellers',
  )
}

const onOutsideClick = (e: MouseEvent) => {
  if (searchRoot.value && !searchRoot.value.contains(e.target as Node))
    searchFocused.value = false
}
onMounted(() => document.addEventListener('click', onOutsideClick))
onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})

const {
  selectedProduct,
  detailLoading: productDetailLoading,
  openProduct,
} = useProductDetail()
const commentProduct = ref<IProduct | null>(null)
const selectedPost = ref<IFeedItem | null>(null)

const {
  deals,
  dealsLoading,
  squares,
  squaresLoading,
  freshItems,
  freshLoading,
  section5Ref,
  marketPosts,
  postsLoading,
} = useMarketHome()

const discoveryItems = computed(() => {
  const seen = new Set<string | number>()
  const merged: any[] = []
  for (const item of [...freshItems.value, ...deals.value]) {
    const id = item?.id ?? item?.product?.id
    if (id == null || seen.has(id)) continue
    seen.add(id)
    merged.push(item)
  }
  return merged
})
const discoveryLoading = computed(
  () => freshLoading.value || dealsLoading.value,
)
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
