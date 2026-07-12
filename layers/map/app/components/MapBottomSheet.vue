<!-- layers/map/app/components/MapBottomSheet.vue -->
<!-- Snapchat-style bottom sheet that slides up when a pin is tapped -->
<template>
  <!-- Collapsed peek bar (always visible when a seller is selected) -->
  <Transition name="sheet-in">
    <div
      v-if="seller"
      class="sheet-container"
      :class="{ expanded: isExpanded }"
    >
      <!-- Drag handle + close button -->
      <div class="relative flex items-center justify-center py-3" @click="isExpanded = !isExpanded">
        <div class="sheet-handle" />
        <button
          class="absolute right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
          aria-label="Close"
          @click.stop="$emit('close')"
        >
          <Icon name="solar:close-circle-linear" size="15" />
        </button>
      </div>

      <!-- ── Peek view (always shown) ─────────────────────────────────── -->
      <div class="px-4 pb-4">
        <!-- Row 1: logo + name/meta -->
        <div class="flex items-center gap-3 mb-3">
          <div class="store-avatar">
            <img
              v-if="seller.store_logo"
              :src="seller.store_logo"
              :alt="seller.store_name ?? ''"
              class="h-full w-full rounded-xl object-cover"
            />
            <span v-else class="text-sm font-black text-white">
              {{ (seller.store_name ?? seller.store_slug ?? '?').slice(0, 2).toUpperCase() }}
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="truncate text-[15px] font-bold text-white">
                {{ seller.store_name || seller.store_slug }}
              </p>
              <Icon
                v-if="seller.is_verified"
                name="solar:shield-check-bold"
                size="14"
                class="shrink-0 text-blue-400"
              />
              <span
                v-if="seller.hasActiveDeal"
                class="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-black text-white"
              >DEAL</span>
            </div>
            <p class="text-[12px] text-white/60 flex flex-wrap items-center gap-1">
              <span>{{ seller.locationLabel || seller.city || 'Nearby' }} · {{ seller.distanceKm.toFixed(1) }}km</span>
              <span
                v-if="seller.isOpenNow"
                class="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-bold text-green-400"
              >Open{{ seller.closesAt ? ` · til ${seller.closesAt}` : '' }}</span>
              <span
                v-else-if="seller.businessHours"
                class="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/40"
              >Closed</span>
              <span
                v-if="!seller.isOnline && seller.lastSeenLabel"
                class="text-[10px] text-white/30"
              >· {{ seller.lastSeenLabel }}</span>
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
              <Icon name="solar:shop-linear" size="9" />
              {{ seller.square.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- Row 2: action buttons -->
        <div class="flex items-center gap-2">
          <NuxtLink
            :to="`/messages?seller=${seller.store_slug}`"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
            aria-label="Message seller"
            @click.stop
          >
            <Icon name="solar:chat-round-line-linear" size="18" />
          </NuxtLink>
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
            aria-label="Get directions"
            @click.stop="openDirections(seller.latitude, seller.longitude)"
          >
            <Icon name="solar:compass-linear" size="18" />
          </button>
          <NuxtLink
            :to="`/sellers/profile/${seller.store_slug}`"
            class="flex h-10 flex-1 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white shadow-lg shadow-brand/30 transition active:scale-95"
            @click.stop
          >
            Visit Store
          </NuxtLink>
        </div>
      </div>

      <!-- ── Expanded view ─────────────────────────────────────────────── -->
      <div v-if="isExpanded" class="expanded-content">

        <!-- Loading preview -->
        <div v-if="loadingPreview" class="flex items-center justify-center py-8">
          <Icon name="solar:refresh-linear" size="24" class="animate-spin text-white/40" />
        </div>

        <template v-else-if="preview">
          <!-- Stats row -->
          <div class="mx-4 mb-4 flex gap-3">
            <div class="stat-chip">
              <p class="stat-value">{{ formatNum(sheetFollowerCount) }}</p>
              <p class="stat-label">Followers</p>
            </div>
            <div class="stat-chip">
              <p class="stat-value">{{ preview.productCount }}</p>
              <p class="stat-label">Products</p>
            </div>
            <div v-if="preview.isOpenNow" class="stat-chip" style="border-color:rgba(34,197,94,0.25);background:rgba(34,197,94,0.08)">
              <p class="stat-value" style="color:#4ade80">Open</p>
              <p class="stat-label" style="color:rgba(74,222,128,0.6)">{{ preview.closesAt ? `til ${preview.closesAt}` : 'Now' }}</p>
            </div>
            <div v-else-if="preview.hasActiveDeal" class="stat-chip border-brand/30 bg-brand/10">
              <p class="stat-value text-brand">Active</p>
              <p class="stat-label text-brand/70">Deal</p>
            </div>
          </div>

          <!-- Follow button -->
          <ClientOnly>
            <div v-if="profileStore.isLoggedIn" class="mx-4 mb-3">
              <button
                class="flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-bold transition"
                :class="sheetIsFollowing
                  ? 'border-white/10 bg-white/8 text-white/60 hover:bg-white/12'
                  : 'border-brand/30 bg-brand/15 text-brand hover:bg-brand/25'"
                :disabled="sheetFollowLoading"
                @click.stop="toggleSheetFollow"
              >
                <Icon v-if="sheetFollowLoading" name="solar:refresh-linear" size="14" class="animate-spin" />
                <Icon v-else-if="sheetIsFollowing" name="solar:check-circle-linear" size="14" />
                <Icon v-else name="solar:add-circle-linear" size="14" />
                {{ sheetFollowLoading ? 'Updating…' : sheetIsFollowing ? 'Following' : 'Follow Store' }}
              </button>
            </div>
          </ClientOnly>

          <!-- Square badge -->
          <div v-if="(preview as any).square" class="mx-4 mb-3">
            <NuxtLink
              :to="`/squares/${(preview as any).square.slug}`"
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-80"
              :style="(preview as any).square.accentColor
                ? `background:${(preview as any).square.accentColor}22;color:${(preview as any).square.accentColor}`
                : 'background:rgba(245,158,11,0.15);color:#f59e0b'"
            >
              <Icon name="solar:shop-linear" size="11" />
              {{ (preview as any).square.name }}
            </NuxtLink>
          </div>

          <!-- Description -->
          <p
            v-if="preview.description"
            class="mx-4 mb-4 text-[13px] leading-relaxed text-white/60"
          >{{ preview.description }}</p>

          <!-- Opening hours -->
          <div v-if="preview.businessHours && Object.keys(preview.businessHours).length" class="mx-4 mb-4">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">Opening Hours</p>
            <div class="space-y-0.5">
              <div
                v-for="(hours, day) in orderedHours(preview.businessHours)"
                :key="day"
                class="flex items-center justify-between rounded-md px-2 py-1 text-[12px]"
                :class="isToday(String(day)) ? 'bg-white/6 font-bold text-white' : 'text-white/40'"
              >
                <span class="w-10 capitalize">{{ String(day).slice(0, 3) }}</span>
                <span v-if="(hours as any).closed" class="text-white/20">Closed</span>
                <span v-else-if="(hours as any).open && (hours as any).close">{{ (hours as any).open }} – {{ (hours as any).close }}</span>
                <span v-else class="text-white/20">—</span>
              </div>
            </div>
          </div>

          <!-- Top products -->
          <div v-if="preview.topProducts.length" class="mb-4">
            <p class="mb-2 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">
              Top Products
            </p>
            <div class="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
              <NuxtLink
                v-for="product in preview.topProducts"
                :key="product.id"
                :to="`/product/${product.id}`"
                class="group flex w-[100px] shrink-0 flex-col overflow-hidden rounded-xl bg-white/5"
              >
                <div class="relative aspect-square overflow-hidden bg-white/5">
                  <img
                    v-if="product.media?.[0]?.url"
                    :src="product.media[0].url"
                    :alt="product.title"
                    class="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div v-else class="flex h-full items-center justify-center">
                    <Icon name="solar:gallery-linear" size="20" class="text-white/20" />
                  </div>
                </div>
                <div class="p-1.5">
                  <p class="line-clamp-1 text-[10px] text-white/70">{{ product.title }}</p>
                  <p class="text-[11px] font-bold text-brand">
                    {{ formatPrice(product.discount
                      ? Math.round(product.price * (1 - product.discount / 100))
                      : product.price)
                    }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { IMapSeller, IMapSellerPreview } from '../types/map.types'
import { openDirections } from '../utils/directions'
import { useSocialApi } from '~~/layers/profile/app/services/social.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

const props = defineProps<{
  seller: IMapSeller | null
  fetchPreview: (slug: string) => Promise<IMapSellerPreview | null>
  startExpanded?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const profileStore = useProfileStore()
const socialApi = useSocialApi()
const { formatPrice } = useCurrency()

const isExpanded = ref(props.startExpanded ?? false)
const preview = ref<IMapSellerPreview | null>(null)
const loadingPreview = ref(false)

// ── Follow state ──────────────────────────────────────────────────────────────
const followedIds = ref(new Set<string>())
const followerOverride = ref<number | null>(null)
const sheetFollowLoading = ref(false)

const sheetIsFollowing = computed(() =>
  props.seller ? followedIds.value.has(props.seller.id) : false,
)
const sheetFollowerCount = computed(() =>
  followerOverride.value ?? preview.value?.followerCount ?? 0,
)

onMounted(async () => {
  if (profileStore.isLoggedIn) {
    try {
      const res = await socialApi.getFollowedSellerIds()
      followedIds.value = new Set(res.data ?? [])
    } catch {}
  }
  // If sheet mounts already expanded (deep-link), load preview immediately
  if (isExpanded.value) loadPreview()
})

const toggleSheetFollow = async () => {
  if (!props.seller) return
  const { id, store_slug } = props.seller
  const wasFollowing = followedIds.value.has(id)
  const current = followerOverride.value ?? preview.value?.followerCount ?? 0

  followedIds.value = new Set(wasFollowing
    ? [...followedIds.value].filter(x => x !== id)
    : [...followedIds.value, id])
  followerOverride.value = wasFollowing ? Math.max(0, current - 1) : current + 1
  sheetFollowLoading.value = true

  try {
    if (wasFollowing) await socialApi.unfollowSeller(store_slug)
    else await socialApi.followSeller(store_slug)
  } catch {
    followedIds.value = new Set(wasFollowing
      ? [...followedIds.value, id]
      : [...followedIds.value].filter(x => x !== id))
    followerOverride.value = current
  } finally {
    sheetFollowLoading.value = false
  }
}

// ── Opening hours helpers ─────────────────────────────────────────────────────
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TODAY_KEY = DAY_ORDER[(new Date().getDay() + 6) % 7]
const isToday = (day: string) => day === TODAY_KEY
const orderedHours = (hours: Record<string, any>) =>
  Object.fromEntries(DAY_ORDER.filter(d => d in hours).map(d => [d, hours[d]]))

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ── Preview fetch ─────────────────────────────────────────────────────────────
const loadPreview = async () => {
  if (!props.seller || preview.value) return
  loadingPreview.value = true
  preview.value = await props.fetchPreview(props.seller.store_slug)
  loadingPreview.value = false
}

watch(isExpanded, (expanded) => { if (expanded) loadPreview() })

// Reset when seller changes; auto-fetch preview if starting expanded
watch(() => props.seller?.store_slug, () => {
  isExpanded.value = props.startExpanded ?? false
  preview.value = null
  followerOverride.value = null
  if (props.startExpanded) loadPreview()
})
</script>

<style scoped>
/* ── Sheet container ─────────────────────────────────────────────────────── */
.sheet-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
  max-height: 88dvh;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ── Drag handle ─────────────────────────────────────────────────────────── */
.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.2);
  cursor: pointer;
}

/* ── Store avatar ────────────────────────────────────────────────────────── */
.store-avatar {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ── Expanded content ────────────────────────────────────────────────────── */
.expanded-content {
  overflow-y: auto;
  max-height: calc(85dvh - 120px);
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

/* ── Stat chips ──────────────────────────────────────────────────────────── */
.stat-chip {
  flex: 1;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 8px 10px;
  text-align: center;
}
.stat-value {
  font-size: 14px;
  font-weight: 800;
  color: white;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  margin-top: 2px;
  font-weight: 600;
}

/* ── Scrollbar hide ──────────────────────────────────────────────────────── */
.scrollbar-hide { scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }

/* ── Non-standard Tailwind fractions ────────────────────────────────────── */
.bg-white\/8  { background: rgba(255,255,255,0.08); }
.bg-white\/12 { background: rgba(255,255,255,0.12); }
.bg-white\/6  { background: rgba(255,255,255,0.06); }

/* ── Transition ──────────────────────────────────────────────────────────── */
.sheet-in-enter-active {
  transition: transform 0.38s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease;
}
.sheet-in-leave-active {
  transition: transform 0.28s ease-in, opacity 0.2s ease;
}
.sheet-in-enter-from,
.sheet-in-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
