<!-- layers/map/app/components/MapStorePanel.vue -->
<!-- Desktop left panel — search, filters, store list + expanded detail -->
<template>
  <div class="panel-root">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <div class="panel-header">
      <!-- Title row -->
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-white/60 transition hover:bg-white/15 hover:text-white"
            title="Back"
            @click="router.back()"
          >
            <Icon name="mdi:arrow-left" size="16" />
          </button>
          <div>
            <h2 class="text-base font-black text-white">Near Me</h2>
            <p class="mt-0.5 text-[11px] text-white/40">
              {{ loading ? 'Finding stores…' : `${sellers.length} store${sellers.length !== 1 ? 's' : ''} nearby` }}
            </p>
          </div>
        </div>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-white/70 transition hover:bg-white/15 hover:text-white"
          title="Recenter map"
          @click="$emit('recenter')"
        >
          <Icon name="mdi:crosshairs-gps" size="18" />
        </button>
      </div>

      <!-- Location search (geocoding — fly to any address) -->
      <div class="relative mb-2">
        <Icon name="mdi:map-marker-outline" size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand/70" />
        <input
          v-model="locationSearch"
          type="text"
          placeholder="Go to a city or address…"
          class="w-full rounded-xl border border-brand/30 bg-white/8 py-2 pl-8 pr-8 text-[12px] text-white placeholder-white/25 outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
          @input="onLocationSearchInput"
        />
        <button
          v-if="locationSearch && !locationSearchLoading"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          @click="locationSearch = ''; locationResults = []"
        >
          <Icon name="mdi:close-circle" size="14" />
        </button>
        <Icon
          v-if="locationSearchLoading"
          name="mdi:loading"
          size="14"
          class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-white/30"
        />

        <!-- Geocoding results -->
        <div
          v-if="locationResults.length"
          class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1e]/98 shadow-xl backdrop-blur-md"
        >
          <button
            v-for="r in locationResults"
            :key="r.label"
            class="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-white/8"
            @click="selectLocation(r)"
          >
            <Icon name="mdi:map-marker" size="12" class="mt-0.5 shrink-0 text-brand" />
            <span class="line-clamp-2 text-[11px] leading-snug text-white/70">{{ r.label }}</span>
          </button>
        </div>
      </div>

      <!-- Store search -->
      <div class="relative mb-3">
        <Icon name="mdi:magnify" size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          v-model="searchInput"
          type="search"
          placeholder="Search stores or products…"
          class="w-full rounded-xl border border-white/8 bg-white/6 py-2.5 pl-8 pr-8 text-[12px] text-white placeholder-white/30 outline-none transition focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
          @input="onSearchInput"
        />
        <button
          v-if="searchInput"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          @click="clearSearch"
        >
          <Icon name="mdi:close-circle" size="14" />
        </button>
      </div>

      <!-- Filter pills -->
      <div class="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1">
        <button
          v-for="pill in filterPills"
          :key="pill.value"
          class="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
          :class="activeFilter === pill.value
            ? 'bg-brand text-white shadow-sm shadow-brand/30'
            : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'"
          @click="$emit('update:filter', pill.value)"
        >
          <Icon :name="pill.icon" size="12" />
          {{ pill.label }}
          <span v-if="pill.count" class="ml-0.5 opacity-75">{{ pill.count }}</span>
        </button>
      </div>

      <!-- Category pills -->
      <div v-if="categories.length" class="scrollbar-hide mt-2 flex gap-1.5 overflow-x-auto pb-1">
        <button
          class="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
          :class="!activeCategory ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'"
          @click="$emit('update:category', '')"
        >All</button>
        <button
          v-for="cat in categories"
          :key="cat.slug"
          class="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
          :class="activeCategory === cat.slug ? 'bg-brand/80 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'"
          @click="$emit('update:category', cat.slug)"
        >
          <img v-if="cat.thumbnailCatUrl" :src="cat.thumbnailCatUrl" :alt="cat.name || 'Category'" class="h-3 w-3 rounded-full object-cover" />
          {{ cat.name }}
        </button>
      </div>

      <!-- Sort row -->
      <div class="scrollbar-hide mt-2 flex items-center gap-1 overflow-x-auto pb-0.5">
        <span class="mr-1 shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/25">Sort:</span>
        <button
          v-for="s in SORT_OPTIONS"
          :key="s.value"
          class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all"
          :class="activeSort === s.value ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/65'"
          @click="activeSort = s.value"
        >{{ s.label }}</button>
      </div>

      <!-- Radius slider -->
      <div class="mt-3">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-white/30">Search radius</span>
          <span class="text-[11px] font-bold text-white/60">{{ formatRadius(localRadius) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon name="mdi:map-marker-radius-outline" size="13" class="shrink-0 text-white/25" />
          <input
            type="range"
            :value="localRadius"
            min="5"
            max="500"
            step="5"
            class="radius-slider flex-1"
            @input="onSliderInput"
            @change="onSliderCommit"
          />
          <Icon name="mdi:earth" size="13" class="shrink-0 text-white/25" />
        </div>
        <div class="mt-1 flex justify-between text-[9px] font-medium text-white/20">
          <span>5 km</span><span>500 km</span>
        </div>
      </div>
    </div>

    <!-- ── Store list ─────────────────────────────────────────────────────── -->
    <div ref="listEl" class="panel-scroll">

      <!-- Loading skeletons -->
      <div v-if="loading && !sellers.length" class="space-y-2 p-3">
        <div v-for="n in 6" :key="n" class="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div class="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-28 animate-pulse rounded bg-white/10" />
            <div class="h-2.5 w-20 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !sellers.length" class="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          <Icon name="mdi:store-search-outline" size="28" class="text-white/30" />
        </div>
        <p class="text-sm font-semibold text-white/50">No stores found</p>
        <p class="mt-1 text-xs text-white/25">
          {{ searchInput ? `No results for "${searchInput}"` : 'Try expanding the radius or changing the filter' }}
        </p>
        <button
          v-if="searchInput"
          class="mt-3 rounded-full bg-white/8 px-4 py-1.5 text-[11px] font-bold text-white/60 transition hover:bg-white/15"
          @click="clearSearch"
        >Clear search</button>
      </div>

      <!-- Store cards -->
      <div v-else class="space-y-1.5 p-3">
        <div
          v-for="seller in sortedSellers"
          :key="seller.store_slug"
          :ref="(el) => { if (seller.store_slug === selectedSeller?.store_slug) activeCardEl = el as HTMLElement }"
          class="store-card"
          :class="{
            'store-card--selected': seller.store_slug === selectedSeller?.store_slug,
            'store-card--offline': !seller.isOnline,
          }"
          @click="$emit('select', seller)"
          @mouseenter="onCardHover(seller)"
        >
          <!-- Card header row -->
          <div class="flex items-center gap-3">
            <div class="store-logo">
              <img
                v-if="seller.store_logo"
                :src="seller.store_logo"
                :alt="seller.store_name ?? ''"
                class="h-full w-full rounded-full object-cover"
                loading="lazy"
              />
              <span v-else class="text-sm font-black text-white/80">
                {{ (seller.store_name ?? seller.store_slug ?? '?').slice(0, 2).toUpperCase() }}
              </span>
              <span class="status-dot" :class="seller.isOnline ? 'status-dot--online' : 'status-dot--offline'" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <p class="truncate text-[13px] font-bold text-white">
                  {{ seller.store_name || seller.store_slug }}
                </p>
                <Icon v-if="seller.is_verified" name="mdi:shield-check" size="13" class="shrink-0 text-blue-400" />
              </div>
              <p class="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
                <span>{{ seller.locationLabel || seller.city || 'Nearby' }} · {{ seller.distanceKm.toFixed(1) }}km</span>
                <span v-if="seller.isOpenNow" class="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-bold text-green-400">Open</span>
                <span v-else-if="seller.businessHours" class="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-semibold text-white/35">Closed</span>
                <span v-else-if="!seller.isOnline && seller.lastSeenLabel" class="text-[9px] text-white/25">{{ seller.lastSeenLabel }}</span>
              </p>
              <NuxtLink
                v-if="seller.square"
                :to="`/squares/${seller.square.slug}`"
                class="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold transition hover:opacity-80"
                :style="seller.square.accentColor
                  ? `background:${seller.square.accentColor}22;color:${seller.square.accentColor}`
                  : 'background:rgba(245,158,11,0.15);color:#f59e0b'"
                @click.stop
              >
                <Icon name="mdi:storefront-outline" size="9" />
                {{ seller.square.name }}
              </NuxtLink>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <span v-if="seller.hasActiveDeal" class="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-black text-white">DEAL</span>
              <span v-if="seller.isPremium" class="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">PRO</span>
              <span class="text-[10px] text-white/30">{{ seller.productCount }} items</span>
            </div>
          </div>

          <!-- ── Expanded detail ─────────────────────────────────────────── -->
          <Transition name="expand">
            <div v-if="seller.store_slug === selectedSeller?.store_slug" class="mt-3 border-t border-white/8 pt-3">

              <div v-if="previewLoading" class="flex items-center justify-center py-4">
                <Icon name="mdi:loading" size="20" class="animate-spin text-white/30" />
              </div>

              <template v-else-if="preview">
                <!-- Stats row -->
                <div class="mb-3 flex gap-2">
                  <div class="stat-chip">
                    <p class="stat-val">{{ formatNum(getFollowerCount(seller)) }}</p>
                    <p class="stat-lbl">Followers</p>
                  </div>
                  <div class="stat-chip">
                    <p class="stat-val">{{ preview.productCount }}</p>
                    <p class="stat-lbl">Products</p>
                  </div>
                  <div v-if="preview.isOpenNow" class="stat-chip !border-green-500/25 !bg-green-500/8">
                    <p class="stat-val text-green-400">Open</p>
                    <p class="stat-lbl text-green-400/60">{{ preview.closesAt ? `til ${preview.closesAt}` : 'Now' }}</p>
                  </div>
                  <div v-else-if="preview.hasActiveDeal" class="stat-chip !border-brand/30 !bg-brand/10">
                    <p class="stat-val text-brand">Active</p>
                    <p class="stat-lbl text-brand/60">Deal</p>
                  </div>
                </div>

                <!-- Follow button -->
                <ClientOnly>
                  <button
                    v-if="profileStore.isLoggedIn"
                    class="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-bold transition"
                    :class="isFollowing(seller)
                      ? 'border-white/10 bg-white/8 text-white/60 hover:bg-white/12'
                      : 'border-brand/30 bg-brand/15 text-brand hover:bg-brand/25'"
                    :disabled="followLoading.has(seller.id)"
                    @click.stop="toggleFollow(seller)"
                  >
                    <Icon v-if="followLoading.has(seller.id)" name="mdi:loading" size="13" class="animate-spin" />
                    <Icon v-else-if="isFollowing(seller)" name="mdi:check" size="13" />
                    <Icon v-else name="mdi:plus" size="13" />
                    {{ followLoading.has(seller.id) ? 'Updating…' : isFollowing(seller) ? 'Following' : 'Follow Store' }}
                  </button>
                </ClientOnly>

                <!-- Last seen -->
                <p v-if="!preview.isOnline && preview.lastSeenLabel" class="mb-2 text-[11px] text-white/30">
                  Last active {{ preview.lastSeenLabel }}
                </p>

                <!-- Square badge -->
                <NuxtLink
                  v-if="(preview as any).square"
                  :to="`/squares/${(preview as any).square.slug}`"
                  class="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-80"
                  :style="(preview as any).square.accentColor
                    ? `background:${(preview as any).square.accentColor}22;color:${(preview as any).square.accentColor}`
                    : 'background:rgba(245,158,11,0.15);color:#f59e0b'"
                  @click.stop
                >
                  <Icon name="mdi:storefront-outline" size="11" />
                  {{ (preview as any).square.name }}
                </NuxtLink>

                <!-- Description -->
                <p v-if="preview.description" class="mb-3 text-[12px] leading-relaxed text-white/50">
                  {{ preview.description }}
                </p>

                <!-- Opening hours -->
                <div v-if="preview.businessHours && Object.keys(preview.businessHours).length" class="mb-3">
                  <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">Opening Hours</p>
                  <div class="space-y-0.5">
                    <div
                      v-for="(hours, day) in orderedHours(preview.businessHours)"
                      :key="day"
                      class="flex items-center justify-between rounded-md px-1.5 py-0.5 text-[11px]"
                      :class="isToday(String(day)) ? 'bg-white/6 font-bold text-white' : 'text-white/40'"
                    >
                      <span class="w-8 capitalize">{{ String(day).slice(0, 3) }}</span>
                      <span v-if="(hours as any).closed" class="text-white/20">Closed</span>
                      <span v-else-if="(hours as any).open && (hours as any).close">{{ (hours as any).open }} – {{ (hours as any).close }}</span>
                      <span v-else class="text-white/20">—</span>
                    </div>
                  </div>
                </div>

                <!-- Top products strip -->
                <div v-if="preview.topProducts.length" class="mb-3">
                  <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Products</p>
                  <div class="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    <NuxtLink
                      v-for="product in preview.topProducts"
                      :key="product.id"
                      :to="`/product/${product.id}`"
                      class="group w-[72px] shrink-0 overflow-hidden rounded-lg bg-white/5 transition hover:bg-white/10"
                    >
                      <div class="aspect-square overflow-hidden bg-white/5">
                        <img
                          v-if="product.media?.[0]?.url"
                          :src="product.media[0].url"
                          :alt="product.title"
                          class="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div v-else class="flex h-full items-center justify-center">
                          <Icon name="mdi:image-outline" size="16" class="text-white/20" />
                        </div>
                      </div>
                      <div class="p-1">
                        <p class="line-clamp-1 text-[9px] text-white/60">{{ product.title }}</p>
                        <p class="text-[10px] font-bold text-brand">
                          {{ formatPrice(product.discount
                            ? Math.round(product.price * (1 - product.discount / 100))
                            : product.price) }}
                        </p>
                      </div>
                    </NuxtLink>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <NuxtLink
                    :to="`/sellers/profile/${seller.store_slug}`"
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[12px] font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand/90"
                  >
                    <Icon name="mdi:store-outline" size="14" />
                    Visit Store
                  </NuxtLink>
                  <button
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white/70 transition hover:bg-white/15 hover:text-white"
                    aria-label="Get directions"
                    title="Get directions"
                    @click.stop="preview && openDirections(preview.latitude, preview.longitude)"
                  >
                    <Icon name="mdi:navigation" size="16" />
                  </button>
                  <NuxtLink
                    :to="`/messages?seller=${seller.store_slug}`"
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white/70 transition hover:bg-white/15 hover:text-white"
                    aria-label="Message"
                  >
                    <Icon name="mdi:message-outline" size="16" />
                  </NuxtLink>
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useMapApi } from '../services/map.api'
import { useSocialApi } from '~~/layers/profile/app/services/social.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import type { IMapSeller, IMapSellerPreview, MapFilter } from '../types/map.types'
import { openDirections } from '../utils/directions'

const router = useRouter()
const profileStore = useProfileStore()
const socialApi = useSocialApi()

const props = defineProps<{
  sellers: IMapSeller[]
  selectedSeller: IMapSeller | null
  activeFilter: MapFilter
  activeCategory: string
  radiusKm: number
  loading: boolean
  fetchPreview: (slug: string) => Promise<IMapSellerPreview | null>
}>()

const emit = defineEmits<{
  select: [seller: IMapSeller]
  'update:filter': [filter: MapFilter]
  'update:category': [slug: string]
  'update:search': [q: string]
  'update:radius': [km: number]
  'update:location': [loc: { lat: number; lng: number }]
  recenter: []
}>()

const { formatPrice } = useCurrency()

// ── Categories ────────────────────────────────────────────────────────────────
const categories = ref<Array<{ id: string; name: string; slug: string; thumbnailCatUrl?: string }>>([])

onMounted(async () => {
  try {
    const res: any = await useMapApi().getCategories()
    categories.value = res.data ?? []
  } catch {}
  if (profileStore.isLoggedIn) {
    try {
      const res = await socialApi.getFollowedSellerIds()
      followedIds.value = new Set(res.data ?? [])
    } catch {}
  }
})

// ── Store search ──────────────────────────────────────────────────────────────
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('update:search', searchInput.value.trim()), 400)
}
const clearSearch = () => { searchInput.value = ''; emit('update:search', '') }

// ── Radius slider ─────────────────────────────────────────────────────────────
const localRadius = ref(props.radiusKm)
watch(() => props.radiusKm, (v) => { localRadius.value = v })
const onSliderInput = (e: Event) => { localRadius.value = Number((e.target as HTMLInputElement).value) }
const onSliderCommit = (e: Event) => {
  const km = Number((e.target as HTMLInputElement).value)
  localRadius.value = km
  emit('update:radius', km)
}
const formatRadius = (km: number) => `${km} km`

// ── Sort ──────────────────────────────────────────────────────────────────────
type SortOption = 'distance' | 'followers' | 'products' | 'deals'
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'distance',  label: 'Nearest' },
  { value: 'deals',     label: 'Deals' },
  { value: 'followers', label: 'Popular' },
  { value: 'products',  label: 'Most items' },
]
const activeSort = ref<SortOption>('distance')

const sortedSellers = computed(() => {
  const list = [...props.sellers]
  switch (activeSort.value) {
    case 'followers': return list.sort((a, b) => b.followerCount - a.followerCount)
    case 'products':  return list.sort((a, b) => b.productCount - a.productCount)
    case 'deals':     return list.sort((a, b) => Number(b.hasActiveDeal) - Number(a.hasActiveDeal))
    default:          return list.sort((a, b) => a.distanceKm - b.distanceKm)
  }
})

// ── Location search (geocoding) ───────────────────────────────────────────────
const locationSearch = ref('')
const locationResults = ref<Array<{ label: string; lat: number; lng: number }>>([])
const locationSearchLoading = ref(false)
let locationTimer: ReturnType<typeof setTimeout> | null = null

const onLocationSearchInput = () => {
  locationResults.value = []
  if (locationTimer) clearTimeout(locationTimer)
  const q = locationSearch.value.trim()
  if (!q) return
  locationTimer = setTimeout(async () => {
    locationSearchLoading.value = true
    try {
      const res = await $fetch<any[]>(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'MarketX/1.0' } },
      )
      locationResults.value = (res ?? []).map((r: any) => ({
        label: r.display_name as string,
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))
    } catch {} finally {
      locationSearchLoading.value = false
    }
  }, 500)
}

const selectLocation = (r: { label: string; lat: number; lng: number }) => {
  emit('update:location', { lat: r.lat, lng: r.lng })
  locationSearch.value = r.label.split(',')[0].trim()
  locationResults.value = []
}

// ── Follow / unfollow ─────────────────────────────────────────────────────────
const followedIds = ref(new Set<string>())
const followerOverrides = ref(new Map<string, number>())
const followLoading = ref(new Set<string>())

const isFollowing = (seller: IMapSeller) => followedIds.value.has(seller.id)

const getFollowerCount = (seller: IMapSeller) =>
  followerOverrides.value.get(seller.id) ?? seller.followerCount

const toggleFollow = async (seller: IMapSeller) => {
  const { id, store_slug } = seller
  const wasFollowing = followedIds.value.has(id)
  const current = followerOverrides.value.get(id) ?? seller.followerCount

  // Optimistic update
  followedIds.value = new Set(wasFollowing
    ? [...followedIds.value].filter(x => x !== id)
    : [...followedIds.value, id])
  followerOverrides.value = new Map([...followerOverrides.value, [id, wasFollowing ? Math.max(0, current - 1) : current + 1]])
  followLoading.value = new Set([...followLoading.value, id])

  try {
    if (wasFollowing) await socialApi.unfollowSeller(store_slug)
    else await socialApi.followSeller(store_slug)
  } catch {
    followedIds.value = new Set(wasFollowing
      ? [...followedIds.value, id]
      : [...followedIds.value].filter(x => x !== id))
    followerOverrides.value = new Map([...followerOverrides.value, [id, current]])
  } finally {
    followLoading.value = new Set([...followLoading.value].filter(x => x !== id))
  }
}

// ── Preview with prefetch cache ───────────────────────────────────────────────
const preview = ref<IMapSellerPreview | null>(null)
const previewLoading = ref(false)
const previewCache = new Map<string, IMapSellerPreview>()
const listEl = ref<HTMLElement | null>(null)
const activeCardEl = ref<HTMLElement | null>(null)

let hoverTimer: ReturnType<typeof setTimeout> | null = null
const onCardHover = (seller: IMapSeller) => {
  if (hoverTimer) clearTimeout(hoverTimer)
  if (previewCache.has(seller.store_slug)) return
  hoverTimer = setTimeout(async () => {
    const data = await props.fetchPreview(seller.store_slug)
    if (data) previewCache.set(seller.store_slug, data)
  }, 250)
}

watch(() => props.selectedSeller?.store_slug, async (slug) => {
  preview.value = null
  if (!slug) return

  const cached = previewCache.get(slug)
  if (cached) {
    preview.value = cached
    previewLoading.value = false
    await nextTick()
    activeCardEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    return
  }

  previewLoading.value = true
  const data = await props.fetchPreview(slug)
  if (data) previewCache.set(slug, data)
  preview.value = data
  previewLoading.value = false
  await nextTick()
  activeCardEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

// ── Filter pills ──────────────────────────────────────────────────────────────
const filterPills = computed(() => [
  { value: 'all' as MapFilter,      icon: 'mdi:map-marker-multiple-outline', label: 'All',      count: props.sellers.length || undefined },
  { value: 'deals' as MapFilter,    icon: 'mdi:tag-outline',                 label: 'Deals',    count: props.sellers.filter(s => s.hasActiveDeal).length || undefined },
  { value: 'premium' as MapFilter,  icon: 'mdi:crown-outline',               label: 'Premium',  count: props.sellers.filter(s => s.isPremium).length || undefined },
  { value: 'verified' as MapFilter, icon: 'mdi:shield-check-outline',        label: 'Verified', count: props.sellers.filter(s => s.is_verified).length || undefined },
])

// ── Opening hours helpers ─────────────────────────────────────────────────────
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TODAY_KEY = DAY_ORDER[(new Date().getDay() + 6) % 7] // mon=0 … sun=6

const isToday = (day: string) => day === TODAY_KEY

const orderedHours = (hours: Record<string, any>) =>
  Object.fromEntries(DAY_ORDER.filter(d => d in hours).map(d => [d, hours[d]]))

// ── Misc ──────────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
</script>

<style scoped>
.panel-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 15, 30, 0.96);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255,255,255,0.07);
}

.panel-header {
  flex-shrink: 0;
  padding: 20px 16px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.panel-scroll::-webkit-scrollbar { width: 4px; }
.panel-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }

.store-card {
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.07);
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  background: rgba(255,255,255,0.03);
}
.store-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
.store-card--selected { background: rgba(244,63,94,0.06); border-color: rgba(244,63,94,0.25); }
.store-card--selected:hover { background: rgba(244,63,94,0.09); }
.store-card--offline { opacity: 0.6; }
.store-card--offline:hover { opacity: 1; }

.store-logo {
  position: relative;
  width: 44px; height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  overflow: visible;
  border: 2px solid rgba(255,255,255,0.15);
}
.store-logo img { border-radius: 50%; }

.status-dot {
  position: absolute;
  bottom: -1px; right: -1px;
  width: 11px; height: 11px;
  border-radius: 50%;
  border: 2px solid rgba(10,15,30,0.96);
}
.status-dot--online  { background: #22c55e; }
.status-dot--offline { background: #6b7280; }

.stat-chip {
  flex: 1; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  padding: 6px 8px; text-align: center;
}
.stat-val { font-size: 13px; font-weight: 800; color: white; line-height: 1.2; }
.stat-lbl { font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

.scrollbar-hide { scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }

.bg-white\/8  { background: rgba(255,255,255,0.08); }
.bg-white\/6  { background: rgba(255,255,255,0.06); }
.bg-white\/5  { background: rgba(255,255,255,0.05); }
.bg-white\/12 { background: rgba(255,255,255,0.12); }
.bg-green-500\/8 { background: rgba(34,197,94,0.08); }

.expand-enter-active { transition: all 0.25s ease; }
.expand-leave-active { transition: all 0.18s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-6px); }

.radius-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 3px; border-radius: 9999px;
  background: rgba(255,255,255,0.12); outline: none; cursor: pointer;
}
.radius-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 50%;
  background: #F43F5E; border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 0 6px rgba(244,63,94,0.5); cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.radius-slider::-webkit-slider-thumb:hover { transform: scale(1.25); box-shadow: 0 0 10px rgba(244,63,94,0.7); }
.radius-slider::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 50%;
  background: #F43F5E; border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 0 6px rgba(244,63,94,0.5); cursor: pointer;
}
</style>
