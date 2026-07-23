<!-- ~~/layers/core/app/layouts/children/RightSideNav.vue -->
<template>
  <div class="flex h-full flex-col bg-white dark:bg-neutral-900">
    <!-- ── Tab Bar ───────────────────────────────────────────────────────────── -->
    <div
      class="flex shrink-0 gap-1 border-b border-gray-200 bg-gray-50/80 p-2 backdrop-blur-sm dark:border-neutral-800/50 dark:bg-neutral-900/70"
    >
      <button
        class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all"
        :class="
          activeTab === 'discover'
            ? 'border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
        "
        @click="activeTab = 'discover'"
      >
        <Icon name="solar:compass-linear" size="17" />
        <span>Discover</span>
      </button>

      <button
        class="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-semibold transition-all"
        :class="
          activeTab === 'ai'
            ? 'bg-brand text-white shadow-sm shadow-brand/20'
            : 'text-gray-500 hover:bg-gray-100 hover:text-brand dark:text-neutral-400 dark:hover:bg-neutral-800'
        "
        @click="activeTab = 'ai'"
      >
        <div
          v-if="activeTab === 'ai'"
          class="pointer-events-none absolute inset-0 bg-white/15 blur-sm"
        />
        <Icon
          :name="
            activeTab === 'ai'
              ? 'solar:programming-bold'
              : 'solar:programming-linear'
          "
          size="17"
          class="relative z-10"
        />
        <span class="relative z-10">MarketX AI</span>
      </button>
    </div>

    <!-- ── Discover Tab ──────────────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'discover'"
      class="custom-scrollbar flex-1 overflow-y-auto"
    >
      <div class="pb-8">
        <!-- ── Markets by category (category squares) ───────────────────────── -->
        <div
          v-if="squares.length || !hasData"
          class="border-b border-gray-100 dark:border-neutral-800"
        >
          <div class="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 class="t-heading">Markets by category</h3>
            <NuxtLink
              to="/squares"
              class="text-xs font-semibold text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
              >All markets</NuxtLink
            >
          </div>

          <div v-if="squares.length">
            <NuxtLink
              v-for="sq in squares.slice(0, 4)"
              :key="sq.id"
              :to="`/squares/${sq.slug}`"
              class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-black text-white"
                :style="`background: ${sq.accentColor || '#f59e0b'}`"
              >
                {{ sq.name.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-[13px] font-bold text-gray-900 dark:text-white"
                >
                  {{ sq.name }}
                </p>
                <p
                  class="truncate text-[11px] text-gray-500 dark:text-neutral-400"
                >
                  {{ sq.memberCount ?? 0 }} traders<span
                    v-if="sq.productCount != null"
                  >
                    · {{ sq.productCount }} goods</span
                  >
                </p>
              </div>
              <Icon
                name="solar:alt-arrow-right-linear"
                size="18"
                class="shrink-0 text-gray-300 dark:text-neutral-600"
              />
            </NuxtLink>
          </div>

          <!-- Skeleton -->
          <div v-else-if="!hasData">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 px-4 py-2.5"
            >
              <div
                class="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-800"
              />
              <div class="flex-1 space-y-2">
                <div
                  class="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
                <div
                  class="h-2.5 w-20 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Traders to discover ──────────────────────────────────────────── -->
        <div class="border-b border-gray-100 dark:border-neutral-800">
          <div class="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 class="t-heading">Traders to discover</h3>
            <NuxtLink
              to="/sellers"
              class="text-xs font-semibold text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
              >See all</NuxtLink
            >
          </div>

          <!-- Skeleton (only when no fallback data yet) -->
          <div v-if="loadingTrending && !whoToFollow.length" class="space-y-0">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 px-4 py-3"
            >
              <div
                class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-800"
              />
              <div class="flex-1 space-y-2">
                <div
                  class="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
                <div
                  class="h-2.5 w-20 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
              </div>
              <div
                class="h-7 w-16 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-800"
              />
            </div>
          </div>

          <!-- Seller rows (Twitter-style) -->
          <div v-else>
            <div
              v-for="seller in whoToFollow.slice(0, 5)"
              :key="seller.id"
              class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
            >
              <NuxtLink
                :to="`/sellers/profile/${seller.store_slug}`"
                class="relative shrink-0"
              >
                <StoreAvatar
                  :store-name="seller.store_name ?? undefined"
                  :logo="seller.store_logo ?? undefined"
                  size="lg"
                />
                <div
                  v-if="seller.is_verified"
                  class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-900"
                >
                  <Icon
                    name="solar:check-circle-linear"
                    size="10"
                    class="text-white"
                  />
                </div>
              </NuxtLink>

              <NuxtLink
                :to="`/sellers/profile/${seller.store_slug}`"
                class="min-w-0 flex-1"
              >
                <p
                  class="truncate text-[13px] font-bold text-gray-900 transition-colors hover:text-brand dark:text-white"
                >
                  {{ seller.store_name }}
                </p>
                <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                  {{ formatNumber(getFollowerCount(seller)) }} followers
                </p>
              </NuxtLink>

              <!-- Text link, not a filled pill — keeps brand strategic and stops
                   the rail reading as a column of coral buttons. Guests get the
                   same affordance, routed to sign-in. -->
              <ClientOnly>
                <button
                  v-if="profileStore.isLoggedIn"
                  class="follow-link"
                  :class="
                    followedIds.has(seller.id)
                      ? 'text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                      : 'text-brand hover:text-brand-dark'
                  "
                  @click.stop.prevent="toggleFollow(seller)"
                >
                  {{ followedIds.has(seller.id) ? 'Following' : 'Follow' }}
                </button>
                <NuxtLink
                  v-else
                  to="/user-login"
                  class="follow-link text-brand hover:text-brand-dark"
                >
                  Follow
                </NuxtLink>

                <template #fallback>
                  <div class="h-5 w-16 shrink-0" />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- ── Flash Sales ──────────────────────────────────────────────────── -->
        <div
          v-if="loadingDeals || activeDeals.length"
          class="border-b border-gray-100 dark:border-neutral-800"
        >
          <div class="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 class="t-heading">Deals in the market</h3>
            <NuxtLink
              to="/deals"
              class="text-xs font-semibold text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
              >See all</NuxtLink
            >
          </div>

          <!-- Skeleton -->
          <div v-if="loadingDeals && !hasData">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 px-4 py-2.5"
            >
              <div
                class="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-800"
              />
              <div class="flex-1 space-y-2">
                <div
                  class="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
                <div
                  class="h-2.5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
                <div
                  class="h-2 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
                />
              </div>
            </div>
          </div>

          <!-- Deal rows -->
          <div v-else>
            <NuxtLink
              v-for="deal in activeDeals.slice(0, 3)"
              :key="deal.id"
              :to="`/product/${deal.slug}`"
              class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
            >
              <div
                class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800"
              >
                <img
                  v-if="deal.media?.[0]?.url"
                  :src="imgThumb(deal.media[0].url) ?? deal.media[0].url"
                  :alt="deal.title ?? 'Deal'"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center"
                >
                  <Icon
                    name="solar:tag-linear"
                    size="18"
                    class="text-gray-400"
                  />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-[13px] font-semibold text-gray-900 dark:text-white"
                >
                  {{ deal.title }}
                </p>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <span class="text-[13px] font-bold text-brand">{{
                    formatPrice(dealPrice(deal))
                  }}</span>
                  <span
                    v-if="deal.discount"
                    class="rounded bg-brand/10 px-1 py-0.5 text-[10px] font-bold text-brand"
                    >-{{ Math.round(deal.discount) }}%</span
                  >
                </div>
                <DealCountdown
                  v-if="deal.dealEndsAt"
                  :ends-at="String(deal.dealEndsAt)"
                  class="mt-0.5"
                />
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- ── What's Happening ─────────────────────────────────────────────── -->
        <div class="border-b border-gray-100 dark:border-neutral-800">
          <div class="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 class="t-heading">Trending goods</h3>
            <NuxtLink
              to="/discover?tab=products"
              class="text-xs font-semibold text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
              >See all</NuxtLink
            >
          </div>

          <!-- Skeleton -->
          <div v-if="loadingTrending && !hasData" class="space-y-0">
            <div v-for="i in 4" :key="i" class="space-y-1.5 px-4 py-3">
              <div
                class="h-2.5 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
              />
              <div
                class="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
              />
              <div
                class="h-2 w-20 animate-pulse rounded bg-gray-200 dark:bg-neutral-800"
              />
            </div>
          </div>

          <!-- Product rows -->
          <div v-else>
            <template v-if="trendingProducts.length">
              <NuxtLink
                v-for="p in trendingProducts.slice(0, 5)"
                :key="p.id"
                :to="`/product/${p.slug}`"
                class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
              >
                <div
                  class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800"
                >
                  <img
                    v-if="p.media?.[0]?.url"
                    :src="imgThumb(p.media[0].url) ?? p.media[0].url"
                    :alt="p.title ?? 'Product'"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon
                      name="solar:bag-4-linear"
                      size="16"
                      class="text-gray-400"
                    />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-[13px] font-semibold text-gray-900 dark:text-white"
                  >
                    {{ p.title }}
                  </p>
                  <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                    {{ p.seller?.store_name ?? p.store_slug }}
                  </p>
                </div>
                <p class="shrink-0 text-[13px] font-bold text-brand">
                  {{ formatPrice(p.price) }}
                </p>
              </NuxtLink>
            </template>

            <!-- Empty state -->
            <div
              v-if="!trendingProducts.length && hasData"
              class="px-4 py-5 text-center text-[13px] text-gray-500 dark:text-neutral-400"
            >
              Nothing trending right now
            </div>
          </div>
        </div>

        <!-- ── Footer ──────────────────────────────────────────────────────── -->
        <div class="px-4 py-5 text-center">
          <div
            class="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[11px] font-medium text-gray-400 dark:text-neutral-500"
          >
            <NuxtLink
              to="/about"
              class="hover:text-gray-700 dark:hover:text-neutral-300"
              >About</NuxtLink
            >
            <NuxtLink
              to="/help"
              class="hover:text-gray-700 dark:hover:text-neutral-300"
              >Help</NuxtLink
            >
            <NuxtLink
              to="/terms"
              class="hover:text-gray-700 dark:hover:text-neutral-300"
              >Terms</NuxtLink
            >
            <NuxtLink
              to="/privacy"
              class="hover:text-gray-700 dark:hover:text-neutral-300"
              >Privacy</NuxtLink
            >
            <NuxtLink
              to="/map"
              class="hover:text-gray-700 dark:hover:text-neutral-300"
              >Near Me</NuxtLink
            >
          </div>
          <p class="mt-3 text-[11px] text-gray-400 dark:text-neutral-600">
            © {{ new Date().getFullYear() }}
            {{ $config.public.siteName || 'MarketX' }}. All rights reserved.
          </p>
        </div>
      </div>
    </div>

    <!-- ── AI Tab ────────────────────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'ai'"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <ClientOnly>
        <DassaChat
          v-if="authStore.accessToken"
          :token="authStore.accessToken"
          :default-mode="
            profileStore.me?.role === 'SELLER' ? 'seller' : 'buyer'
          "
          class="flex-1"
        />
        <div v-else class="flex flex-1 items-center justify-center px-6">
          <BaseEmptyState
            icon="solar:programming-linear"
            title="Sign in to use MarketX AI"
            description="Ask about products, prices and traders, and get answers from the live market."
          >
            <template #actions>
              <BaseButton
                variant="primary"
                size="sm"
                @click="navigateTo('/user-login')"
              >
                Sign in
              </BaseButton>
            </template>
          </BaseEmptyState>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAuthStore } from '~~/layers/core/app/stores/auth.store'
import { useLayoutData } from '~~/layers/core/app/composables/useLayoutData'
import {
  useRightSidebarData,
  type SidebarSeller,
} from '~~/layers/core/app/composables/useRightSidebarData'
import { useSocialApi } from '~~/layers/profile/app/services/social.api'
import { useDassaPanel } from '~~/layers/ai/app/composables/useDassaPanel'
import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'
import DassaChat from '~~/layers/ai/app/components/dassa/Chat.vue'
import DealCountdown from '~~/layers/commerce/app/components/DealCountdown.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { navigateTo } from '#imports'

// ── Stores & data ─────────────────────────────────────────────────────────────

const profileStore = useProfileStore()
const authStore = useAuthStore()
const { data: layoutData } = useLayoutData()
const {
  trendingProducts,
  featuredSellers,
  activeDeals,
  squares,
  loadingTrending,
  loadingDeals,
  hasData,
  load: loadSidebarData,
} = useRightSidebarData()

const activeTab = ref<'discover' | 'ai'>('discover')

// Switch to AI tab when a product question is queued from any page
const { pendingMessage } = useDassaPanel()
watch(pendingMessage, (msg) => {
  if (msg) activeTab.value = 'ai'
})

// Who to follow: use fetched featuredSellers when available, fall back to layout topSellers immediately
const topSellers = computed(() => layoutData.value?.topSellers ?? [])
const whoToFollow = computed((): SidebarSeller[] =>
  featuredSellers.value.length
    ? featuredSellers.value
    : (topSellers.value as unknown as SidebarSeller[]),
)

// ── Follow state ──────────────────────────────────────────────────────────────

const socialApi = useSocialApi()
const followedIds = ref(new Set<string>())
const followerCountOverrides = ref(new Map<string, number>())

interface MinSeller {
  id: string
  store_slug: string
  followers_count?: number | null
}

const getFollowerCount = (seller: MinSeller) =>
  followerCountOverrides.value.get(seller.id) ?? seller.followers_count ?? 0

const toggleFollow = async (seller: MinSeller) => {
  const { id, store_slug: slug } = seller
  const wasFollowing = followedIds.value.has(id)
  const current = getFollowerCount(seller)

  if (wasFollowing) {
    followedIds.value.delete(id)
    followerCountOverrides.value.set(id, Math.max(0, current - 1))
  } else {
    followedIds.value.add(id)
    followerCountOverrides.value.set(id, current + 1)
  }

  try {
    if (wasFollowing) await socialApi.unfollowSeller(slug)
    else await socialApi.followSeller(slug)
  } catch {
    if (wasFollowing) {
      followedIds.value.add(id)
      followerCountOverrides.value.set(id, current)
    } else {
      followedIds.value.delete(id)
      followerCountOverrides.value.set(id, current)
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const { formatPrice } = useCurrency()

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const dealPrice = (deal: { price: number; discount?: number | null }) => {
  if (!deal.discount || deal.discount <= 0) return deal.price
  return Math.round(deal.price * (1 - deal.discount / 100))
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadSidebarData()
  if (profileStore.isLoggedIn) {
    try {
      const res = await socialApi.getFollowedSellerIds()
      followedIds.value = new Set(res.data ?? [])
    } catch {
      // non-critical
    }
  }
})
</script>

<style scoped>
.follow-link {
  @apply shrink-0 text-[13px] font-bold transition-colors;
}

/* Custom thin scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}
.dark .custom-scrollbar {
  scrollbar-color: #4b5563 transparent;
}
</style>
