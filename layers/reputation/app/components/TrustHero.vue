<!--
  TrustHero — the top-of-page statement that frames MarketX as trust
  infrastructure, not a marketplace (framework §5.4). Three parts:
    1. the vision headline + buyer/seller CTAs,
    2. a hero Trust Card with a REAL scannable QR + earned stats — the object
       the whole product revolves around,
    3. the scan → verify → pay → confirm → reputation → credit flow.
  Preview-only for now; rendered by MarketHome behind the trustSpotlight prop.
-->
<template>
  <section class="space-y-8">
    <div class="grid items-center gap-8 lg:grid-cols-[1fr_1.12fr] lg:gap-12">
      <!-- ── vision ─────────────────────────────────────────────────────── -->
      <div class="space-y-5">
        <p class="text-xs font-bold uppercase tracking-widest text-brand">
          Trust infrastructure · MarketX
        </p>
        <h1
          class="font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl dark:text-white"
        >
          Trust infrastructure for Nigeria's informal commerce
        </h1>
        <p
          class="max-w-md text-[15px] leading-relaxed text-gray-500 dark:text-neutral-400"
        >
          Scan a seller's Trust Card, verify their reputation, pay protected,
          and help them build a
          <span class="font-semibold text-gray-800 dark:text-neutral-200"
            >portable business identity.</span
          >
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/discover?tab=sellers"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand-sm transition-all hover:bg-brand-dark"
          >
            <Icon name="solar:qr-code-linear" size="18" />
            Scan a Trust Card
          </NuxtLink>
          <NuxtLink
            to="/squares"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:text-neutral-200"
          >
            Discover markets
          </NuxtLink>
        </div>

        <p class="text-xs text-gray-400 dark:text-neutral-500">
          Explore Nigeria's digital markets — Balogun, Bodija, Hamaz and more.
        </p>
      </div>

      <!-- ── hero Trust Card (the object everything revolves around) ─────── -->
      <div
        v-if="featured"
        class="relative overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-2xl shadow-black/30 ring-1 ring-white/10 sm:p-6 dark:bg-neutral-900"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/20 blur-2xl"
        />
        <div class="relative">
          <div class="flex items-center justify-between">
            <span
              class="rounded-md bg-white/10 px-2 py-0.5 text-3xs font-bold uppercase tracking-[0.2em] text-white/60"
              >Trust Card</span
            >
            <span
              v-if="featured.publicId"
              class="font-mono text-xs font-semibold tracking-wide text-brand-light"
              >{{ featured.publicId }}</span
            >
          </div>

          <div class="mt-3 flex items-center gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand text-lg font-black italic"
            >
              <img
                v-if="featured.store_logo"
                :src="featuredLogo"
                :alt="featuredName"
                class="h-full w-full object-cover"
              />
              <template v-else>{{ featuredInitials }}</template>
            </div>
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1 font-display text-lg font-bold">
                <span class="truncate">{{ featuredName }}</span>
                <Icon
                  v-if="featured.is_verified"
                  name="solar:verified-check-bold"
                  size="14"
                  class="shrink-0 text-blue-400"
                />
              </p>
              <p class="mt-0.5 truncate text-xs text-white/50">
                {{ featuredAttestation }}
              </p>
            </div>
            <span
              class="shrink-0 self-start rounded-md bg-white/10 px-1.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-white/70"
              >{{ tierLabel }}</span
            >
          </div>

          <div class="mt-5 flex gap-4">
            <div class="shrink-0 text-center">
              <div
                class="qr-tile relative h-28 w-28 cursor-pointer rounded-xl bg-white p-1.5"
              >
                <img
                  v-if="qr"
                  :src="qr"
                  alt="Scan this seller's Trust Card"
                  class="h-full w-full"
                  width="112"
                  height="112"
                />
                <div
                  v-else
                  class="h-full w-full animate-pulse rounded-lg bg-gray-200"
                />
              </div>
              <p
                class="mt-1.5 flex items-center justify-center gap-1 text-2xs font-semibold text-brand-light"
              >
                <Icon name="solar:qr-code-linear" size="11" />
                Scan to verify
              </p>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-2">
              <span
                v-for="part in statsParts"
                :key="part"
                class="flex items-center gap-1.5 text-xs font-medium text-white/85"
              >
                <Icon
                  name="solar:check-circle-bold"
                  size="14"
                  class="shrink-0 text-mint-light"
                />
                {{ part }}
              </span>
            </div>
          </div>

          <!-- the human line — makes the numbers feel like people -->
          <p
            class="mt-3 flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white/75"
          >
            <Icon
              name="solar:refresh-circle-bold"
              size="14"
              class="shrink-0 text-mint-light"
            />
            {{ featured.loyalty }}
          </p>

          <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-semibold shadow-brand-sm transition hover:bg-brand-dark"
          >
            <Icon name="solar:lock-keyhole-minimalistic-bold" size="15" />
            Pay this seller protected
          </button>
          <!-- the buyer-protection promise, stated as a benefit not a mechanism -->
          <p
            class="mt-2.5 flex items-start justify-center gap-1.5 text-center text-xs font-semibold leading-snug text-white/75"
          >
            <Icon
              name="solar:shield-check-bold"
              size="14"
              class="mt-px shrink-0 text-mint-light"
            />
            If it's not delivered as described, your money is not released.
          </p>
        </div>
      </div>

      <!-- loading placeholder for the hero card -->
      <div
        v-else
        class="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      />
    </div>

    <!-- ── the flow: what the Trust Card sets in motion ─────────────────── -->
    <div>
      <p
        class="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
      >
        One card. The whole trust loop.
      </p>
      <div class="scrollbar-hide flex items-stretch gap-2 overflow-x-auto pb-1">
        <template v-for="(step, i) in FLOW" :key="step.title">
          <div
            class="flex min-w-[140px] flex-1 shrink-0 flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand"
            >
              <Icon :name="step.icon" size="18" />
            </span>
            <div>
              <p class="text-xs font-bold text-gray-900 dark:text-neutral-100">
                {{ i + 1 }}. {{ step.title }}
              </p>
              <p
                class="mt-0.5 text-2xs leading-snug text-gray-500 dark:text-neutral-400"
              >
                {{ step.desc }}
              </p>
            </div>
          </div>
          <Icon
            v-if="i < FLOW.length - 1"
            name="solar:alt-arrow-right-linear"
            size="16"
            class="hidden shrink-0 self-center text-gray-300 lg:block dark:text-neutral-600"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useRuntimeConfig } from '#imports'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import { useTrustSpotlight } from '~~/layers/reputation/app/composables/useTrustSpotlight'

const TIER_LABELS = { TIER_1: 'Tier 1', TIER_2: 'Tier 2', TIER_3: 'Tier 3' }

const FLOW = [
  {
    icon: 'solar:qr-code-linear',
    title: 'Scan Trust Card',
    desc: 'On a card, plaque, parcel or bio',
  },
  {
    icon: 'solar:shield-check-linear',
    title: 'Verify seller',
    desc: 'Identity, CAC & community, at a glance',
  },
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    title: 'Pay protected',
    desc: 'Your money is held safely in escrow',
  },
  {
    icon: 'solar:check-circle-linear',
    title: 'Confirm delivery',
    desc: 'Seller is paid only when you confirm',
  },
  {
    icon: 'solar:graph-up-linear',
    title: 'Build reputation',
    desc: 'Every clean sale is recorded for good',
  },
  {
    icon: 'solar:money-bag-linear',
    title: 'Unlock credit',
    desc: 'A track record lenders can read',
  },
]

const { sellers, load } = useTrustSpotlight()
onMounted(load)

const config = useRuntimeConfig()
const featured = computed(() => sellers.value[0] ?? null)

const featuredName = computed(
  () => featured.value?.store_name || featured.value?.store_slug || 'Store',
)
const featuredLogo = computed(() =>
  featured.value?.store_logo ? imgAvatar(featured.value.store_logo) : '',
)
const featuredInitials = computed(() =>
  (featured.value?.store_name || featured.value?.store_slug || '?')
    .slice(0, 2)
    .toUpperCase(),
)
const featuredAttestation = computed(
  () => featured.value?.chips?.[1]?.label ?? 'Verified seller',
)
const tierLabel = computed(() =>
  featured.value ? TIER_LABELS[featured.value.tier] : '',
)
const statsParts = computed(() => featured.value?.stats.split(' · ') ?? [])

// Real, scannable QR of the seller's shareable link — the central anchor.
const qr = ref('')
watch(
  featured,
  async (f) => {
    if (!f) {
      qr.value = ''
      return
    }
    try {
      // QR opens the seller's Trust tab directly — scan → verify.
      const base = String(config.public.baseURL || '').replace(/\/+$/, '')
      const url = `${base}/sellers/profile/${f.store_slug}?tab=trust&mx_scan=card`
      qr.value = await QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      })
    } catch {
      qr.value = ''
    }
  },
  { immediate: true },
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

/* QR: a soft brand glow that invites a scan, intensifying on hover. */
.qr-tile {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.25);
}
.qr-tile:hover {
  transform: scale(1.04);
  box-shadow:
    0 0 0 3px rgba(244, 63, 94, 0.45),
    0 10px 30px -6px rgba(244, 63, 94, 0.5);
}
@media (prefers-reduced-motion: no-preference) {
  .qr-tile {
    animation: qr-breathe 3.2s ease-in-out infinite;
  }
  .qr-tile:hover {
    animation: none;
  }
}
@keyframes qr-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.2);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.35);
  }
}
</style>
