<template>
  <HomeLayout
    :narrow-feed="false"
    :hide-right-sidebar="true"
    :custom-padding="true"
  >
    <div class="sq-profile-wrap relative w-full pb-20 md:pb-0">
      <!-- Loading skeleton -->
      <div v-if="pending" class="animate-pulse space-y-4 pt-4">
        <div class="h-44 rounded-2xl bg-gray-100 dark:bg-neutral-800" />
        <div class="h-5 w-48 rounded-md bg-gray-100 dark:bg-neutral-800" />
        <div class="h-4 w-32 rounded-md bg-gray-100 dark:bg-neutral-800" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="py-24 text-center">
        <Icon
          name="mdi:store-off-outline"
          size="52"
          class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
        />
        <p class="text-sm font-semibold text-gray-500 dark:text-neutral-400">
          Square not found
        </p>
        <NuxtLink
          to="/discover?tab=squares"
          class="mt-4 inline-block text-xs text-brand hover:underline"
          >Browse all squares</NuxtLink
        >
      </div>

      <template v-else-if="square">
        <!-- ── Banner ─────────────────────────────────────────────────────── -->
        <div class="relative h-44 overflow-hidden rounded-2xl">
          <img
            v-if="square.bannerUrl"
            :src="square.bannerUrl"
            :alt="square.name"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="h-full w-full"
            :style="`background: linear-gradient(135deg, ${square.accentColor || '#f59e0b'}55, ${square.accentColor || '#f59e0b'}11)`"
          />
          <span
            class="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
          >
            {{ square.type === 'GEOGRAPHIC' ? '📍 Location' : '🏷️ Category' }}
          </span>
        </div>

        <!-- ── Header row ──────────────────────────────────────────────────── -->
        <div class="relative -mt-7 px-1">
          <div class="flex items-end justify-between gap-3">
            <!-- Icon -->
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-md dark:border-neutral-900 dark:bg-neutral-900"
              :style="`border-color: ${square.accentColor || '#f59e0b'}66`"
            >
              <img
                v-if="square.iconUrl"
                :src="square.iconUrl"
                :alt="square.name"
                class="h-full w-full rounded-xl object-cover"
              />
              <span
                v-else
                class="text-xl font-black"
                :style="`color: ${square.accentColor || '#f59e0b'}`"
              >
                {{ square.name.slice(0, 2).toUpperCase() }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 pb-1">
              <button
                class="rounded-full px-5 py-2 text-sm font-bold transition-all"
                :class="
                  isFollowing
                    ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700/50'
                    : 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 hover:bg-amber-600'
                "
                :disabled="followLoading"
                @click="toggleFollow"
              >
                <Icon
                  v-if="followLoading"
                  name="eos-icons:loading"
                  size="14"
                  class="mr-1 inline"
                />
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button>
              <NuxtLink
                v-if="canJoin"
                :to="`/squares/${square.slug}/join`"
                class="rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
              >
                Join as Seller
              </NuxtLink>
            </div>
          </div>

          <!-- Name + location -->
          <div class="mt-3">
            <h1 class="text-xl font-black text-gray-900 dark:text-neutral-100">
              {{ square.name }}
            </h1>
            <p
              v-if="square.city || square.state"
              class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400"
            >
              📍
              {{
                [square.city, square.state, square.country]
                  .filter(Boolean)
                  .join(', ')
              }}
            </p>
            <p
              v-if="square.description"
              class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
            >
              {{ square.description }}
            </p>
          </div>

          <!-- Stats row -->
          <div
            class="mt-4 flex items-center gap-5 border-b border-gray-100 pb-4 dark:border-neutral-800"
          >
            <div class="text-center">
              <p class="text-lg font-black text-gray-900 dark:text-neutral-100">
                {{ formatNum(square.memberCount || 0) }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                Sellers
              </p>
            </div>
            <div class="text-center">
              <p class="text-lg font-black text-gray-900 dark:text-neutral-100">
                {{ formatNum(square.followerCount || 0) }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                Followers
              </p>
            </div>
            <div class="text-center">
              <p class="text-lg font-black text-gray-900 dark:text-neutral-100">
                {{ formatNum(square.postCount || 0) }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                Posts
              </p>
            </div>
          </div>

          <!-- Officers row -->
          <div v-if="square.officers?.length" class="mb-2 mt-4">
            <p
              class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
            >
              Leadership
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="officer in square.officers"
                :key="officer.id"
                class="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs dark:bg-neutral-800"
              >
                <img
                  v-if="officer.profile?.avatar"
                  :src="officer.profile.avatar"
                  class="h-5 w-5 rounded-full object-cover"
                />
                <Icon
                  v-else
                  name="mdi:account"
                  size="14"
                  class="text-gray-400"
                />
                <span
                  class="font-semibold text-gray-700 dark:text-neutral-300"
                  >{{ officer.profile?.username }}</span
                >
                <span class="text-gray-400 dark:text-neutral-500"
                  >· {{ officerLabel(officer.role) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- ── Tabs ────────────────────────────────────────────────────────── -->
        <div class="mt-5">
          <!-- Tab bar — horizontally scrollable on mobile -->
          <div
            class="scrollbar-none mb-4 flex gap-0 overflow-x-auto border-b border-gray-100 dark:border-neutral-800"
          >
            <button
              v-for="t in tabs"
              :key="t.key"
              class="shrink-0 pb-2 pr-5 text-sm font-semibold transition-colors"
              :class="
                activeTab === t.key
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400'
              "
              @click="activeTab = t.key"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- ── ANNOUNCEMENTS tab ──────────────────────────────────────────── -->
          <div v-if="activeTab === 'announcements'" class="space-y-3">
            <!-- Officer post form -->
            <div
              v-if="square.isOfficer"
              class="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-900/10"
            >
              <p
                class="mb-3 text-sm font-bold text-amber-700 dark:text-amber-400"
              >
                Post Announcement
              </p>
              <input
                v-model="announcementForm.title"
                type="text"
                placeholder="Title (e.g. Market closed Monday)"
                maxlength="120"
                class="mb-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <textarea
                v-model="announcementForm.body"
                placeholder="What do members need to know?"
                rows="3"
                maxlength="2000"
                class="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <div class="mt-2 flex items-center justify-between">
                <label
                  class="flex cursor-pointer items-center gap-2 text-xs text-gray-500 dark:text-neutral-400"
                >
                  <input
                    v-model="announcementForm.isPinned"
                    type="checkbox"
                    class="rounded accent-amber-500"
                  />
                  Pin to top
                </label>
                <button
                  :disabled="
                    !announcementForm.title.trim() ||
                    !announcementForm.body.trim() ||
                    announcementPosting
                  "
                  class="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
                  @click="postAnnouncement"
                >
                  <Icon
                    v-if="announcementPosting"
                    name="eos-icons:loading"
                    size="14"
                    class="mr-1 inline"
                  />
                  Post
                </button>
              </div>
            </div>

            <!-- Announcement list -->
            <div
              v-if="announcementsLoading && !announcements.length"
              class="space-y-3"
            >
              <div
                v-for="n in 3"
                :key="n"
                class="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
              />
            </div>
            <div v-else-if="!announcements.length" class="py-16 text-center">
              <Icon
                name="mdi:bullhorn-outline"
                size="44"
                class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
              />
              <p class="text-sm text-gray-500 dark:text-neutral-400">
                No announcements yet
              </p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="a in announcements"
                :key="a.id"
                class="rounded-2xl border bg-white p-4 dark:bg-neutral-900"
                :class="
                  a.isPinned
                    ? 'border-amber-200 dark:border-amber-700/40'
                    : 'border-gray-100 dark:border-neutral-800'
                "
              >
                <!-- Pinned badge -->
                <div
                  v-if="a.isPinned"
                  class="mb-2 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                >
                  <Icon name="mdi:pin" size="12" />
                  Pinned
                </div>
                <p class="font-bold text-gray-900 dark:text-neutral-100">
                  {{ a.title }}
                </p>
                <p
                  class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
                >
                  {{ a.body }}
                </p>
                <div class="mt-3 flex items-center gap-2">
                  <img
                    v-if="a.author?.avatar"
                    :src="a.author.avatar"
                    class="h-5 w-5 rounded-full object-cover"
                  />
                  <Icon
                    v-else
                    name="mdi:account"
                    size="16"
                    class="text-gray-400"
                  />
                  <span class="text-xs text-gray-400 dark:text-neutral-500">
                    @{{ a.author?.username }} · {{ timeAgo(a.created_at) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Load more -->
            <div ref="announcementsTrigger" class="h-4" />
          </div>

          <!-- ── SELLERS tab ─────────────────────────────────────────────────── -->
          <div v-else-if="activeTab === 'sellers'">
            <div
              v-if="sellersLoading && !sellers.length"
              class="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              <div
                v-for="n in 6"
                :key="n"
                class="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
              />
            </div>
            <div v-else-if="!sellers.length" class="py-16 text-center">
              <Icon
                name="mdi:store-outline"
                size="44"
                class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
              />
              <p class="text-sm text-gray-500 dark:text-neutral-400">
                No sellers in this square yet
              </p>
            </div>
            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <NuxtLink
                v-for="seller in sellers"
                :key="seller.id"
                :to="`/sellers/profile/${seller.store_slug}`"
                class="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <!-- Store logo / placeholder -->
                <div
                  class="relative h-20 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
                >
                  <img
                    v-if="seller.store_logo"
                    :src="seller.store_logo"
                    :alt="seller.store_name"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon
                      name="mdi:storefront-outline"
                      size="32"
                      class="text-gray-300 dark:text-neutral-600"
                    />
                  </div>
                  <!-- Badges -->
                  <div class="absolute right-2 top-2 flex gap-1">
                    <span
                      v-if="seller.isPrimary"
                      class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white"
                      >Home</span
                    >
                    <span
                      v-if="seller.is_verified"
                      class="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                      >✓</span
                    >
                  </div>
                </div>
                <!-- Info -->
                <div class="p-3">
                  <p
                    class="truncate text-sm font-bold text-gray-900 group-hover:text-amber-600 dark:text-neutral-100 dark:group-hover:text-amber-400"
                  >
                    {{ seller.store_name || seller.store_slug }}
                  </p>
                  <p
                    class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500"
                  >
                    {{ seller._count?.products ?? 0 }} products
                  </p>
                </div>
              </NuxtLink>
            </div>
            <!-- Load more -->
            <div ref="sellersTrigger" class="mt-4 h-4" />
          </div>

          <!-- ── FEED tabs (all / posts / products) ─────────────────────────── -->
          <div v-else>
            <div v-if="feedLoading && !feedItems.length" class="space-y-4">
              <div
                v-for="n in 4"
                :key="n"
                class="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
              />
            </div>
            <div
              v-else-if="!feedLoading && !feedItems.length"
              class="py-20 text-center"
            >
              <Icon
                name="mdi:storefront-outline"
                size="44"
                class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
              />
              <p class="text-sm text-gray-500 dark:text-neutral-400">
                No activity in this square yet
              </p>
            </div>
            <div v-else class="space-y-4">
              <!-- Products tab -->
              <template v-if="activeTab === 'products'">
                <FeedProductShelf
                  v-if="productItems.length"
                  :products="productItems"
                  :label="square.name"
                  @open-product="openDetail"
                />
              </template>
              <!-- All / Posts tab -->
              <template v-else>
                <template v-for="(chunk, ci) in postChunks" :key="ci">
                  <NuxtLink
                    v-for="item in chunk"
                    :key="item.id"
                    :to="`/post/${item.id}`"
                    class="flex items-start gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                  >
                    <img
                      v-if="item.author?.avatar"
                      :src="item.author.avatar"
                      class="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <Icon
                      v-else
                      name="mdi:account"
                      size="36"
                      class="shrink-0 text-gray-300 dark:text-neutral-600"
                    />
                    <div class="min-w-0">
                      <p
                        class="text-xs font-bold text-gray-700 dark:text-neutral-300"
                      >
                        @{{ item.author?.username }}
                      </p>
                      <p
                        class="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-neutral-400"
                      >
                        {{ item.caption || item.content }}
                      </p>
                    </div>
                  </NuxtLink>
                  <FeedProductShelf
                    v-if="ci < postChunks.length - 1 && productItems.length"
                    :products="shelfSlice(ci)"
                    :label="square.name"
                    @open-product="openDetail"
                  />
                </template>
                <FeedProductShelf
                  v-if="!postChunks.length && productItems.length"
                  :products="productItems"
                  :label="square.name"
                  @open-product="openDetail"
                />
              </template>
            </div>

            <div ref="feedTrigger" class="mt-6 h-6" />
            <div
              v-if="feedLoading && feedItems.length"
              class="flex justify-center py-6"
            >
              <Icon name="eos-icons:loading" size="24" class="text-amber-500" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Product detail modal -->
    <ProductDetailModal
      :product="selectedProduct"
      :loading="detailLoading"
      @close="selectedProduct = null"
    />
  </HomeLayout>
</template>

<script setup lang="ts">
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import FeedProductShelf from '~~/layers/feed/app/components/FeedProductShelf.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import { useProductDetail } from '~~/layers/commerce/app/composables/useProductDetail'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const squareApi = useSquareApi()

// ── Fetch Square ──────────────────────────────────────────────────────────────
const {
  data: squareData,
  pending,
  error,
} = await useFetch(() => `/api/squares/${slug.value}`)
const square = computed(() => (squareData.value as any)?.data)

useSeoMeta({
  title: computed(() =>
    square.value ? `${square.value.name} Square | MarketX` : 'Square | MarketX',
  ),
  description: computed(
    () =>
      square.value?.description ??
      `Discover sellers and products in ${square.value?.name} Square`,
  ),
})

// ── Follow ────────────────────────────────────────────────────────────────────
const isFollowing = ref((squareData.value as any)?.data?.isFollowing ?? false)
const followLoading = ref(false)

const toggleFollow = async () => {
  if (followLoading.value || !square.value) return
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await squareApi.unfollowSquare(square.value.slug)
      isFollowing.value = false
      if (square.value)
        square.value.followerCount = Math.max(
          0,
          (square.value.followerCount ?? 0) - 1,
        )
    } else {
      await squareApi.followSquare(square.value.slug)
      isFollowing.value = true
      if (square.value)
        square.value.followerCount = (square.value.followerCount ?? 0) + 1
    }
  } catch {
    /* silent */
  } finally {
    followLoading.value = false
  }
}

const canJoin = computed(() => !!square.value)

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'all', label: 'All' },
  { key: 'posts', label: 'Posts' },
  { key: 'products', label: 'Products' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'announcements', label: '📢 Announcements' },
]
const activeTab = ref<
  'all' | 'posts' | 'products' | 'sellers' | 'announcements'
>('all')

// ── Feed ──────────────────────────────────────────────────────────────────────
const feedItems = ref<any[]>([])
const feedTotal = ref(0)
const feedLoading = ref(false)
const feedTrigger = ref<HTMLElement | null>(null)
const feedOffset = ref(0)
const FEED_LIMIT = 20

const loadFeed = async (reset = false) => {
  if (!square.value) return
  if (reset) {
    feedItems.value = []
    feedTotal.value = 0
    feedOffset.value = 0
  }
  if (feedLoading.value) return
  feedLoading.value = true
  try {
    const res = await squareApi.getSquareFeed(square.value.slug, {
      limit: FEED_LIMIT,
      offset: feedOffset.value,
      type: activeTab.value,
    })
    const items = res?.data?.items ?? []
    feedItems.value.push(...items)
    feedTotal.value = res?.data?.meta?.total ?? feedItems.value.length
    feedOffset.value += items.length
  } catch {
    /* silent */
  } finally {
    feedLoading.value = false
  }
}

const feedHasMore = computed(() => feedOffset.value < feedTotal.value)

const productItems = computed(() =>
  feedItems.value
    .filter((i) => i.type === 'PRODUCT' && i.product)
    .map((i) => i.product),
)
const postItems = computed(() =>
  feedItems.value.filter((i) => i.type === 'POST'),
)

const CHUNK_SIZE = 4
const postChunks = computed(() => {
  const chunks: any[][] = []
  for (let i = 0; i < postItems.value.length; i += CHUNK_SIZE)
    chunks.push(postItems.value.slice(i, i + CHUNK_SIZE))
  return chunks
})

const SHELF_SIZE = 6
const shelfSlice = (ci: number) => {
  const items = productItems.value
  if (!items.length) return []
  const start = (ci * SHELF_SIZE) % items.length
  const end = start + SHELF_SIZE
  return end <= items.length
    ? items.slice(start, end)
    : [...items.slice(start), ...items.slice(0, end - items.length)]
}

// ── Sellers ───────────────────────────────────────────────────────────────────
const sellers = ref<any[]>([])
const sellersTotal = ref(0)
const sellersLoading = ref(false)
const sellersTrigger = ref<HTMLElement | null>(null)
const sellersOffset = ref(0)
const SELLERS_LIMIT = 24

const loadSellers = async (reset = false) => {
  if (!square.value) return
  if (reset) {
    sellers.value = []
    sellersTotal.value = 0
    sellersOffset.value = 0
  }
  if (sellersLoading.value) return
  sellersLoading.value = true
  try {
    const res = await squareApi.getSquareSellers(square.value.slug, {
      limit: SELLERS_LIMIT,
      offset: sellersOffset.value,
    })
    const list = res?.data?.sellers ?? []
    sellers.value.push(...list)
    sellersTotal.value = res?.data?.total ?? sellers.value.length
    sellersOffset.value += list.length
  } catch {
    /* silent */
  } finally {
    sellersLoading.value = false
  }
}

const sellersHasMore = computed(() => sellersOffset.value < sellersTotal.value)

// ── Announcements ─────────────────────────────────────────────────────────────
const announcements = ref<any[]>([])
const announcementsTotal = ref(0)
const announcementsLoading = ref(false)
const announcementsTrigger = ref<HTMLElement | null>(null)
const announcementsOffset = ref(0)
const ANNOUNCEMENTS_LIMIT = 20

const announcementForm = reactive({ title: '', body: '', isPinned: false })
const announcementPosting = ref(false)

const loadAnnouncements = async (reset = false) => {
  if (!square.value) return
  if (reset) {
    announcements.value = []
    announcementsTotal.value = 0
    announcementsOffset.value = 0
  }
  if (announcementsLoading.value) return
  announcementsLoading.value = true
  try {
    const res = await squareApi.getAnnouncements(square.value.slug, {
      limit: ANNOUNCEMENTS_LIMIT,
      offset: announcementsOffset.value,
    })
    const list = res?.data?.announcements ?? []
    announcements.value.push(...list)
    announcementsTotal.value = res?.data?.total ?? announcements.value.length
    announcementsOffset.value += list.length
  } catch {
    /* silent */
  } finally {
    announcementsLoading.value = false
  }
}

const postAnnouncement = async () => {
  if (
    !square.value ||
    !announcementForm.title.trim() ||
    !announcementForm.body.trim()
  )
    return
  announcementPosting.value = true
  try {
    const res = await squareApi.postAnnouncement(square.value.slug, {
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
      isPinned: announcementForm.isPinned,
    })
    announcements.value.unshift(res.data)
    announcementForm.title = ''
    announcementForm.body = ''
    announcementForm.isPinned = false
  } catch {
    /* silent */
  } finally {
    announcementPosting.value = false
  }
}

// ── Tab switching — lazy load ─────────────────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'sellers' && !sellers.value.length) loadSellers()
  else if (tab === 'announcements' && !announcements.value.length)
    loadAnnouncements()
  else if (['all', 'posts', 'products'].includes(tab)) loadFeed(true)
})

// Initial load
watch(
  square,
  (sq) => {
    if (sq) loadFeed()
  },
  { immediate: true },
)

// ── Infinite scroll observers ─────────────────────────────────────────────────
onMounted(() => {
  const observe = (
    el: Ref<HTMLElement | null>,
    hasMore: Ref<boolean>,
    load: () => void,
  ) => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore.value) load()
      },
      { rootMargin: '300px' },
    )
    watchEffect(() => {
      if (el.value) obs.observe(el.value)
    })
    onUnmounted(() => obs.disconnect())
  }

  observe(feedTrigger, feedHasMore, loadFeed)
  observe(sellersTrigger, sellersHasMore, loadSellers)
  observe(
    announcementsTrigger,
    computed(() => announcementsOffset.value < announcementsTotal.value),
    loadAnnouncements,
  )
})

// ── Product detail ────────────────────────────────────────────────────────────
const {
  selectedProduct,
  detailLoading,
  openProduct: openDetail,
} = useProductDetail()

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const officerLabel = (role: string) =>
  ({
    CHAIRMAN: 'Chairman',
    SECRETARY: 'Secretary',
    TREASURER: 'Treasurer',
    MODERATOR: 'Moderator',
    GOVT_REP: 'Govt Rep',
  })[role] ?? role

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
</script>

<style scoped>
.sq-profile-wrap {
  padding-top: calc(3.5rem + env(safe-area-inset-top, 0px));
}
@media (min-width: 768px) {
  .sq-profile-wrap {
    padding-top: 0;
  }
}
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
