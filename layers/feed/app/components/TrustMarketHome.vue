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
        <p
          class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
        >
          Nigeria's safe-commerce network
        </p>

        <h1
          class="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl dark:text-white"
        >
          Buy safely from trusted<br class="hidden sm:block" />
          Nigerian businesses.
        </h1>
        <p
          class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-neutral-300"
        >
          Verify any seller in seconds. Pay into protected escrow, and release
          funds only when your order arrives.
        </p>
      </div>

      <div class="mx-auto mt-8 max-w-2xl">
        <TrustFindVerifyDock />
      </div>
    </section>

    <!-- ── 2. HOW PROTECTED BUYING WORKS ──────────────────────────────────── -->
    <section>
      <div class="mx-auto mb-8 max-w-xl text-center">
        <p
          class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
        >
          Guaranteed protection
        </p>
        <h2
          class="mt-1 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white"
        >
          How protected buying works
        </h2>
      </div>
      <ol class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(step, i) in HOW_IT_WORKS"
          :key="step.title"
          class="rounded-lg border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white dark:bg-white dark:text-gray-900"
              aria-hidden="true"
              >{{ i + 1 }}</span
            >
            <Icon
              :name="step.icon"
              size="20"
              class="text-gray-500 dark:text-neutral-400"
            />
          </div>
          <h3 class="mt-4 text-sm font-bold text-gray-900 dark:text-white">
            {{ step.title }}
          </h3>
          <p
            class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-neutral-400"
          >
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
            class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
          >
            Local hubs
          </p>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Nigeria's markets, online
          </h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
            Real market squares — step in and meet the traders inside
          </p>
        </div>
        <NuxtLink
          to="/squares"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
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
          class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-white"
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
            class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
          >
            Live inventory
          </p>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Fresh from verified traders
          </h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
            Every one from a seller you can pay protected
          </p>
        </div>
        <NuxtLink
          to="/discover?tab=fresh"
          class="mb-0.5 shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
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
    <section
      class="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/60"
    >
      <div class="mb-5">
        <p
          class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
        >
          For businesses
        </p>
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          Why sellers join
        </h2>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
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
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <Icon :name="reason.icon" size="18" />
          </span>
          <div>
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ reason.title }}
            </p>
            <p
              class="mt-0.5 text-[13px] leading-relaxed text-gray-500 dark:text-neutral-400"
            >
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
    <section
      class="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p
        class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
      >
        Where this goes
      </p>
      <h2
        class="mt-1 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white"
      >
        Today's transaction becomes tomorrow's loan.
      </h2>
      <p
        class="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
      >
        Every clean, protected sale becomes a record lenders can read. Sellers
        who build reputation on MarketX build the credit history Nigeria's
        informal economy has never had a way to prove.
      </p>
    </section>

    <!-- ── 9. MARKET PULSE ────────────────────────────────────────────────── -->
    <section ref="section5Ref" class="mx-auto max-w-[560px]">
      <div class="mb-4">
        <p
          class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
        >
          From the community
        </p>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Real people, trading now
        </h2>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
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
          <p class="text-base font-bold text-gray-900 dark:text-white">
            This is just a peek.
          </p>
          <p
            class="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-neutral-400"
          >
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
import { ref, computed } from 'vue'
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
import TrustFindVerifyDock from '~~/layers/feed/app/components/TrustFindVerifyDock.vue'

import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useMarketHome } from '../composables/useMarketHome'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'

defineOptions({ name: 'TrustMarketHome' })
defineEmits<{ 'sign-in': [] }>()

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
