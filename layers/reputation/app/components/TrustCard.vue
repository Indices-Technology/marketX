<template>
  <article
    :class="[
      'group relative flex min-w-[280px] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 dark:bg-neutral-900',
      tierStyles.container,
      loading ? 'animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg',
    ]"
    :aria-busy="loading"
  >
    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="flex flex-1 flex-col gap-4 p-5">
        <div class="flex items-center gap-3">
          <div
            class="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-800"
          />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div class="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
        <div class="h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div class="space-y-2">
          <div class="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div class="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <NuxtLink
        :to="sellerRoute"
        class="flex flex-1 flex-col gap-4 p-5 transition-colors"
      >
        <!-- Header: Identity + Tier -->
        <header class="flex items-start gap-3">
          <!-- Avatar with verified overlay -->
          <div class="relative shrink-0">
            <div
              class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 dark:bg-neutral-800 dark:ring-white/10"
            >
              <img
                v-if="seller.store_logo && !logoError"
                :src="logoUrl"
                :alt="`${name} logo`"
                width="48"
                height="48"
                class="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                @error="logoError = true"
              />
              <span
                v-else
                class="font-display text-sm font-black text-neutral-700 dark:text-neutral-300"
              >
                {{ initials }}
              </span>
            </div>

            <!-- Verified: Better visual weight -->
            <div
              v-if="seller.is_verified"
              class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-md ring-2 ring-white dark:ring-neutral-900"
              title="Identity verified by platform"
            >
              <Icon name="solar:verified-check-bold" size="12" />
            </div>
          </div>

          <!-- Name & Meta -->
          <div class="min-w-0 flex-1 pt-0.5">
            <h3
              class="truncate font-display text-[15px] font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-brand dark:text-neutral-100"
            >
              {{ name }}
            </h3>
            <p
              v-if="seller.publicId"
              class="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500"
            >
              {{ seller.publicId }}
            </p>
          </div>

          <!-- Tier Badge: Icon + Label for instant recognition -->
          <span
            class="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
            :class="tierStyles.badge"
          >
            <Icon :name="tierStyles.icon" size="12" />
            {{ tierStyles.label }}
          </span>
        </header>

        <!-- Trust Credential: The "why" this seller is safe -->
        <div
          v-if="seller.headline"
          class="relative overflow-hidden rounded-xl border p-3"
          :class="tierStyles.trustBox"
        >
          <div class="flex items-start gap-2.5">
            <div
              class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              :class="tierStyles.trustIconBg"
            >
              <Icon
                name="solar:shield-check-bold"
                size="14"
                :class="tierStyles.trustIcon"
              />
            </div>
            <p
              class="font-display text-[13px] font-semibold leading-snug"
              :class="tierStyles.trustText"
            >
              {{ seller.headline }}
            </p>
          </div>
        </div>

        <!-- Supporting Evidence: Compact, scannable list -->
        <dl
          class="flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400"
        >
          <div v-if="seller.loyalty" class="flex items-center gap-2">
            <dt class="shrink-0">
              <Icon
                name="solar:medal-ribbon-star-linear"
                size="14"
                class="text-neutral-400 dark:text-neutral-500"
              />
            </dt>
            <dd class="truncate font-medium">{{ seller.loyalty }}</dd>
          </div>
          <div v-if="seller.recent" class="flex items-center gap-2">
            <dt class="shrink-0">
              <Icon
                name="solar:map-point-linear"
                size="14"
                class="text-neutral-400 dark:text-neutral-500"
              />
            </dt>
            <dd class="truncate font-medium">{{ seller.recent }}</dd>
          </div>
        </dl>

        <!-- Proof Chips: Horizontal scroll on overflow instead of wrapping -->
        <div v-if="seller.chips?.length" class="-mx-5 px-5">
          <div class="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            <span
              v-for="(chip, i) in seller.chips"
              :key="chip.label"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition-all duration-200 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:text-neutral-300"
              :class="[
                chipBorder,
                {
                  'animate-in fade-in slide-in-from-bottom-2 translate-y-2 opacity-0':
                    mounted,
                },
              ]"
              :style="{
                animationDelay: `${i * 60}ms`,
                animationFillMode: 'forwards',
              }"
            >
              <Icon
                :name="chip.icon"
                size="12"
                class="text-neutral-400 dark:text-neutral-500"
              />
              {{ chip.label }}
            </span>
          </div>
        </div>

        <!-- Footer: Clear CTA + Security Lockup -->
        <footer
          class="mt-auto flex items-center justify-between border-t pt-4"
          :class="tierStyles.footerBorder"
        >
          <span
            class="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900 transition-colors group-hover:text-brand dark:text-white"
          >
            View profile
            <Icon
              name="solar:arrow-right-linear"
              size="14"
              class="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>

          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            :class="tierStyles.escrow"
          >
            <Icon name="solar:lock-keyhole-minimalistic-bold" size="11" />
            Escrow
          </span>
        </footer>
      </NuxtLink>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import type { TrustSpotlightSeller } from '~~/layers/reputation/app/types/trust.types'

const props = withDefaults(
  defineProps<{
    seller: TrustSpotlightSeller
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const mounted = ref(false)
const logoError = ref(false)

onMounted(() => {
  mounted.value = true
})

// ─── Route ─────────────────────────────────────────────
const sellerRoute = computed(() => {
  if (!props.seller?.store_slug) return '#'
  return `/sellers/profile/${props.seller.store_slug}`
})

// ─── Identity ──────────────────────────────────────────
const name = computed(() => {
  return (
    props.seller?.store_name?.trim() ||
    props.seller?.store_slug ||
    'Unnamed Store'
  )
})

const logoUrl = computed(() => {
  if (!props.seller?.store_logo) return ''
  return imgAvatar(props.seller.store_logo)
})

const initials = computed(() => {
  const source = props.seller?.store_name || props.seller?.store_slug || '?'
  return source
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

// ─── Tier System: Semantic, accessible, scalable ───────
type TierKey = 'TIER_1' | 'TIER_2' | 'TIER_3'

const TIERS: Record<
  TierKey,
  {
    label: string
    icon: string
    container: string
    badge: string
    trustBox: string
    trustIconBg: string
    trustIcon: string
    trustText: string
    escrow: string
    footerBorder: string
  }
> = {
  TIER_1: {
    label: 'Gold',
    icon: 'solar:crown-bold',
    container:
      'border-amber-200/60 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
    trustBox:
      'border-amber-100 bg-amber-50/50 dark:border-amber-500/15 dark:bg-amber-500/10',
    trustIconBg:
      'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    trustIcon: 'text-amber-600 dark:text-amber-300',
    trustText: 'text-amber-900 dark:text-amber-100',
    escrow:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    footerBorder: 'border-amber-100 dark:border-amber-500/10',
  },
  TIER_2: {
    label: 'Silver',
    icon: 'solar:medal-star-circle-bold',
    container:
      'border-slate-200 dark:border-slate-600/30 hover:border-slate-300 dark:hover:border-slate-500/50',
    badge:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200',
    trustBox:
      'border-slate-100 bg-slate-50/50 dark:border-slate-500/15 dark:bg-slate-500/10',
    trustIconBg:
      'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    trustIcon: 'text-slate-600 dark:text-slate-300',
    trustText: 'text-slate-900 dark:text-slate-100',
    escrow:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    footerBorder: 'border-slate-100 dark:border-slate-500/10',
  },
  TIER_3: {
    label: 'Bronze',
    icon: 'solar:star-bold',
    container:
      'border-orange-200/60 dark:border-orange-500/20 hover:border-orange-300 dark:hover:border-orange-500/40',
    badge:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300',
    trustBox:
      'border-orange-100 bg-orange-50/50 dark:border-orange-500/15 dark:bg-orange-500/10',
    trustIconBg:
      'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
    trustIcon: 'text-orange-600 dark:text-orange-300',
    trustText: 'text-orange-900 dark:text-orange-100',
    escrow:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    footerBorder: 'border-orange-100 dark:border-orange-500/10',
  },
}

const tierStyles = computed(() => {
  const key = (props.seller?.tier as TierKey) ?? 'TIER_2'
  return TIERS[key] ?? TIERS.TIER_2
})

const chipBorder = computed(() => {
  return 'border-black/[0.04] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/10'
})
</script>

<style scoped>
/* Hide scrollbar for chip row while keeping scrollability */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Staggered chip entrance */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-in-from-bottom-2 {
  from {
    transform: translateY(0.5rem);
  }
  to {
    transform: translateY(0);
  }
}
.animate-in {
  animation:
    fade-in 0.4s ease-out,
    slide-in-from-bottom-2 0.4s ease-out;
}
</style>
