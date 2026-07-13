<template>
  <div class="mt-5 space-y-8">
    <!-- Category grid — only shown on the browse landing, not on standalone trending -->
    <section v-if="isBrowseTab">
      <h2 class="mb-3 t-heading text-lg">
        What are you looking for today?
      </h2>
      <DiscoverCategoryGrid />
    </section>

    <!-- Markets near you — leads discovery on the browse landing -->
    <section v-if="isBrowseTab && (marketsLoading || marketStrip.length)">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="solar:shop-bold" size="18" class="text-brand" />
          <h2 class="t-heading">
            Markets near you
          </h2>
        </div>
        <button
          class="text-xs font-semibold text-brand hover:underline"
          @click="activeTab = 'squares'"
        >
          See all →
        </button>
      </div>
      <div class="scroll-strip-wrap">
        <div class="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          <template v-if="marketsLoading && !marketStrip.length">
            <div
              v-for="n in 4"
              :key="n"
              class="h-[200px] w-60 shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
            />
          </template>
          <SquareCard
            v-for="sq in marketStrip"
            :key="sq.id"
            :square="sq"
            variant="spotlight"
          />
        </div>
        <div class="scroll-fade-right" />
      </div>
    </section>

    <!-- Fresh from a featured market — context-aware, market-specific section -->
    <section v-if="isBrowseTab && featuredMarket && marketProducts.length">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="solar:shop-2-linear" size="18" class="text-brand" />
          <h2 class="t-heading">
            Fresh from {{ featuredMarket.name }}
          </h2>
        </div>
        <NuxtLink
          :to="`/squares/${featuredMarket.slug}`"
          class="text-xs font-semibold text-brand hover:underline"
        >
          Visit market →
        </NuxtLink>
      </div>
      <div class="scroll-strip-wrap">
        <div
          class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          <div
            v-for="product in marketProducts"
            :key="product.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini
              :product="product"
              @open-detail="emit('open-detail', $event)"
            />
          </div>
        </div>
        <div class="scroll-fade-right" />
      </div>
    </section>

    <!-- Horizontal strips -->
    <section>
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="solar:bolt-bold" size="18" class="text-amber-400" />
          <h2
            class="t-heading"
          >
            Fresh from the markets
          </h2>
        </div>
        <button
          class="text-xs font-semibold text-brand hover:underline"
          @click="activeTab = 'fresh'"
        >
          See all →
        </button>
      </div>
      <div class="scroll-strip-wrap">
        <div
          v-if="stripsLoading && !freshStrip.length"
          class="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-52 w-40 shrink-0 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
          />
        </div>
        <div
          v-else-if="freshStrip.length"
          class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          <div
            v-for="product in freshStrip"
            :key="product.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="product" @open-detail="emit('open-detail', $event)" />
          </div>
        </div>
        <div class="scroll-fade-right" />
      </div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="solar:tag-linear" size="18" class="text-brand" />
          <h2
            class="t-heading"
          >
            Deals across the markets
          </h2>
        </div>
        <button
          class="text-xs font-semibold text-brand hover:underline"
          @click="activeTab = 'deals'"
        >
          See all →
        </button>
      </div>
      <div class="scroll-strip-wrap">
        <div
          v-if="stripsLoading && !dealStrip.length"
          class="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-52 w-40 shrink-0 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
          />
        </div>
        <div
          v-else-if="dealStrip.length"
          class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          <div
            v-for="product in dealStrip"
            :key="product.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="product" @open-detail="emit('open-detail', $event)" />
          </div>
        </div>
        <div class="scroll-fade-right" />
      </div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="solar:recive-square-linear" size="18" class="text-emerald-500" />
          <h2
            class="t-heading"
          >
            Pre-loved from traders
          </h2>
        </div>
        <button
          class="text-xs font-semibold text-brand hover:underline"
          @click="activeTab = 'preloved'"
        >
          See all →
        </button>
      </div>
      <div class="scroll-strip-wrap">
        <div
          v-if="stripsLoading && !prelovedStrip.length"
          class="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-52 w-40 shrink-0 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
          />
        </div>
        <div
          v-else-if="prelovedStrip.length"
          class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          <div
            v-for="product in prelovedStrip"
            :key="product.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="product" @open-detail="emit('open-detail', $event)" />
          </div>
        </div>
        <div class="scroll-fade-right" />
      </div>
    </section>

    <!-- Trending main content -->
    <div v-if="trendingLoading" class="space-y-8">
      <div class="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <div
          v-for="n in 10"
          :key="n"
          class="h-8 w-20 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-neutral-800"
        />
      </div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="n in 8"
          :key="n"
          class="aspect-[4/5] animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
        />
      </div>
    </div>

    <template v-else>
      <section v-if="trendingTags.length">
        <div class="mb-3 flex items-center gap-2">
          <Icon name="solar:fire-bold" size="18" class="text-orange-500" />
          <h2
            class="t-heading"
          >
            Popular in the markets
          </h2>
        </div>
        <div
          class="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          <button
            v-for="tag in trendingTags"
            :key="tag.id"
            class="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-brand/50 dark:hover:text-brand"
            @click="navigateTo({ query: { tagName: tag.name } }, { replace: true })"
          >
            <span class="text-gray-500 dark:text-neutral-400">#</span>
            {{ tag.name }}
            <span
              class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-neutral-800 dark:text-neutral-400"
              >{{ tag._count.products }}</span
            >
          </button>
        </div>
      </section>

      <section v-if="trendingProducts.length">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon name="solar:graph-up-linear" size="18" class="text-brand" />
            <h2
              class="t-heading"
            >
              Trending with traders
            </h2>
          </div>
          <button
            class="text-xs font-semibold text-brand hover:underline"
            @click="activeTab = 'products'"
          >
            See all →
          </button>
        </div>
        <div
          class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <ProductCardMini
            v-for="product in trendingProducts"
            :key="product.id"
            :product="product"
            @open-detail="emit('open-detail', $event)"
          />
        </div>
      </section>

      <section v-if="featuredSellers.length">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon name="solar:shop-2-linear" size="18" class="text-brand" />
            <h2
              class="t-heading"
            >
              Traders to discover
            </h2>
          </div>
          <button
            class="text-xs font-semibold text-brand hover:underline"
            @click="activeTab = 'sellers'"
          >
            See all →
          </button>
        </div>
        <!-- Mobile: horizontal scroll strip -->
        <div class="scroll-strip-wrap md:hidden">
          <div
            class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
          >
            <NuxtLink
              v-for="seller in featuredSellers"
              :key="seller.id"
              :to="`/sellers/profile/${seller.store_slug}`"
              class="group flex w-[100px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-center transition-all dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div
                class="h-14 w-14 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <img
                  v-if="seller.store_logo"
                  :src="imgAvatar(seller.store_logo)"
                  :alt="seller.store_name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-brand"
                >
                  <Icon name="solar:shop-bold" size="20" class="text-white" />
                </div>
              </div>
              <div class="w-full min-w-0">
                <p
                  class="flex items-center justify-center gap-0.5 truncate text-[11px] font-semibold ink-strong group-hover:text-brand"
                >
                  <span class="truncate">{{ seller.store_name }}</span>
                  <Icon
                    v-if="seller.is_verified"
                    name="solar:verified-check-bold"
                    size="11"
                    class="shrink-0 text-blue-500"
                  />
                </p>
                <p class="text-[10px] ink-soft">
                  <span
                    v-if="seller.averageRating"
                    class="font-semibold text-amber-500"
                    >★ {{ seller.averageRating.toFixed(1) }}</span
                  >
                  <span v-else
                    >{{ formatNum(seller.followers_count || 0) }} followers</span
                  >
                </p>
              </div>
            </NuxtLink>
          </div>
          <div class="scroll-fade-right" />
        </div>
        <!-- Desktop grid -->
        <div class="hidden gap-3 sm:grid-cols-3 md:grid lg:grid-cols-6">
          <NuxtLink
            v-for="seller in featuredSellers"
            :key="seller.id"
            :to="`/sellers/profile/${seller.store_slug}`"
            class="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-brand/20 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div
              class="h-14 w-14 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <img
                v-if="seller.store_logo"
                :src="seller.store_logo"
                :alt="seller.store_name"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-brand"
              >
                <Icon name="solar:shop-bold" size="22" class="text-white" />
              </div>
            </div>
            <div class="w-full min-w-0">
              <p
                class="flex items-center justify-center gap-0.5 truncate text-xs font-semibold ink-strong transition-colors group-hover:text-brand"
              >
                <span class="truncate">{{ seller.store_name }}</span>
                <Icon
                  v-if="seller.is_verified"
                  name="solar:verified-check-bold"
                  size="12"
                  class="shrink-0 text-blue-500"
                />
              </p>
              <p class="text-[11px] ink-soft">
                <span
                  v-if="seller.averageRating"
                  class="font-semibold text-amber-500"
                  >★ {{ seller.averageRating.toFixed(1) }}</span
                >
                <span v-else
                  >{{ formatNum(seller.followers_count || 0) }} followers</span
                >
              </p>
            </div>
          </NuxtLink>
        </div>
      </section>

      <div
        v-if="
          !trendingProducts.length &&
          !trendingTags.length &&
          !featuredSellers.length
        "
        class="py-24 text-center"
      >
        <Icon
          name="solar:fire-linear"
          size="48"
          class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
        />
        <p class="text-sm text-gray-500 dark:text-neutral-400">
          The markets are quiet right now — explore traders near you.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'
import ProductCardMini from '~~/layers/commerce/app/components/ProductCardMini.vue'
import DiscoverCategoryGrid from '~~/layers/commerce/app/components/discover/CategoryGrid.vue'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import { useDiscoverFilters } from '~~/layers/commerce/app/composables/useDiscoverFilters'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import { useFeedApi } from '~~/layers/feed/app/services/feed.api'
import { useSquareApi } from '~~/layers/square/app/services/square.api'

const emit = defineEmits<{
  'open-detail': [product: IProduct]
}>()

const { activeTab, filters: discoverFilters } = useDiscoverFilters()
const feedApi = useFeedApi()
const squareApi = useSquareApi()

const isBrowseTab = computed(() => activeTab.value === 'browse')

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const trendingLoading = ref(true)
const trendingProducts = ref<IProduct[]>([])
const trendingTags = ref<any[]>([])
const featuredSellers = ref<any[]>([])

const freshStrip = ref<IProduct[]>([])
const dealStrip = ref<IProduct[]>([])
const prelovedStrip = ref<IProduct[]>([])
const stripsLoading = ref(true)

const marketStrip = ref<any[]>([])
const marketsLoading = ref(true)
const featuredMarket = ref<any | null>(null)
const marketProducts = ref<IProduct[]>([])

const loadMarkets = async () => {
  marketsLoading.value = true
  try {
    const res: any = await squareApi.listSquares({
      type: 'GEOGRAPHIC',
      limit: 8,
    })
    marketStrip.value = res.data ?? []

    // Feature the top market with a "Fresh from {market}" strip of its goods.
    const top = marketStrip.value[0]
    if (top) {
      featuredMarket.value = top
      const pr: any = await $fetch(
        `/api/commerce/products?squareSlug=${top.slug}&sortBy=newest&limit=8`,
      )
      marketProducts.value = pr?.data?.products ?? []
    }
  } catch {
    //
  } finally {
    marketsLoading.value = false
  }
}

const loadTrending = async () => {
  trendingLoading.value = true
  stripsLoading.value = true
  try {
    const res = await feedApi.getTrending()
    if (res?.data) {
      trendingProducts.value = res.data.trendingProducts ?? []
      trendingTags.value = res.data.trendingTags ?? []
      featuredSellers.value = res.data.featuredSellers ?? []
      // Strips are now bundled in the same response — no extra round trips
      freshStrip.value = res.data.strips?.fresh ?? []
      dealStrip.value = res.data.strips?.deals ?? []
      prelovedStrip.value = res.data.strips?.preloved ?? []
    }
  } catch {
    //
  } finally {
    trendingLoading.value = false
    stripsLoading.value = false
  }
}

watch(
  () => discoverFilters.trending.timeRange,
  () => loadTrending(),
)

onMounted(() => {
  loadTrending()
  loadMarkets()
})
</script>

<style scoped>
.scroll-strip-wrap {
  position: relative;
  max-width: 100%;
  overflow: hidden;
}

.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scroll-fade-right {
  position: absolute;
  top: 0;
  right: -1px;
  bottom: 4px;
  width: 52px;
  pointer-events: none;
  background: linear-gradient(to right, transparent, #f9fafb);
}

:global(.dark) .scroll-fade-right {
  background: linear-gradient(to right, transparent, #030712);
}
</style>
