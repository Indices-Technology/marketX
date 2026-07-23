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

        <!-- Two clear paths: buyers see a real verified seller; sellers get
             their own card. Primary opens the live trust-profile demo. -->
        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand-sm transition-all hover:bg-brand-dark"
            @click="openTrust"
          >
            <Icon name="solar:shield-check-bold" size="18" />
            See a Verified Seller
          </button>
          <NuxtLink
            to="/sellers/create"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:text-neutral-200"
          >
            Get Your Trust Card
          </NuxtLink>
        </div>

        <!-- The core MarketX promise — the reason a buyer trusts a stranger
             here more than on Instagram or WhatsApp. Stated loud, right under
             the CTA, not buried in the card. -->
        <div
          class="flex items-start gap-2.5 rounded-xl border border-mint/30 bg-mint/5 px-4 py-3 dark:border-mint/20 dark:bg-mint/10"
        >
          <Icon
            name="solar:shield-check-bold"
            size="22"
            class="mt-0.5 shrink-0 text-mint-dark dark:text-mint"
          />
          <p
            class="text-[15px] font-bold leading-snug text-gray-900 dark:text-neutral-100"
          >
            If it's not delivered as described, your money is not released.
          </p>
        </div>

        <p class="text-xs text-gray-400 dark:text-neutral-500">
          Explore Nigeria's digital markets — Balogun, Bodija, Hamaz and more.
        </p>
      </div>

      <!-- ── hero Trust Card (the object everything revolves around) ───────
           Light elevated surface, not a dark slab: it sits inside the light
           home and reads like a real scannable card. Brand is reserved for the
           single "Pay protected" action; everything else stays neutral. -->
      <div
        v-if="featured"
        class="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-900/[0.06] transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-2xl sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30 dark:hover:border-brand/30"
        @click="openTrust"
      >
        <div class="relative">
          <div class="flex items-center justify-between">
            <span
              class="rounded-md bg-gray-100 px-2 py-0.5 text-3xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:bg-neutral-800 dark:text-neutral-400"
              >Trust Card</span
            >
            <span
              v-if="featured.publicId"
              class="font-mono text-xs font-semibold tracking-wide text-gray-400 dark:text-neutral-500"
              >{{ featured.publicId }}</span
            >
          </div>

          <div class="mt-3 flex items-center gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-900 text-lg font-black italic text-white dark:bg-neutral-800"
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
              <p
                class="flex items-center gap-1 font-display text-lg font-bold text-gray-900 dark:text-neutral-100"
              >
                <span class="truncate">{{ featuredName }}</span>
                <Icon
                  v-if="featured.is_verified"
                  name="solar:verified-check-bold"
                  size="14"
                  class="shrink-0 text-blue-500"
                />
              </p>
              <p
                class="mt-0.5 truncate text-xs text-gray-400 dark:text-neutral-500"
              >
                {{ featuredAttestation }}
              </p>
            </div>
            <span
              class="shrink-0 self-start rounded-md bg-gray-100 px-1.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
              >{{ tierLabel }}</span
            >
          </div>

          <div class="mt-5 flex gap-4">
            <div class="shrink-0 text-center">
              <div
                class="qr-tile relative h-28 w-28 cursor-pointer rounded-xl border border-gray-200 bg-white p-1.5 dark:border-neutral-700"
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
                class="mt-1.5 flex items-center justify-center gap-1 text-2xs font-semibold text-gray-500 dark:text-neutral-400"
              >
                <Icon name="solar:qr-code-linear" size="11" />
                Scan to verify
              </p>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-2">
              <span
                v-for="part in statsParts"
                :key="part"
                class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300"
              >
                <Icon
                  name="solar:check-circle-bold"
                  size="14"
                  class="shrink-0 text-mint"
                />
                {{ part }}
              </span>
            </div>
          </div>

          <!-- the human line — makes the numbers feel like people -->
          <p
            class="mt-3 flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-neutral-800/60 dark:text-neutral-300"
          >
            <Icon
              name="solar:refresh-circle-bold"
              size="14"
              class="shrink-0 text-mint"
            />
            {{ featured.loyalty }}
          </p>

          <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-semibold text-white shadow-brand-sm transition hover:bg-brand-dark"
            @click.stop="openTrust"
          >
            <Icon name="solar:lock-keyhole-minimalistic-bold" size="15" />
            Pay this seller protected
          </button>
          <!-- affordance: the whole card opens the seller's full trust profile -->
          <p
            class="mt-2.5 flex items-center justify-center gap-1 text-center text-2xs font-semibold text-gray-400 transition-colors group-hover:text-brand dark:text-neutral-500"
          >
            View full trust profile
            <Icon name="solar:arrow-right-linear" size="12" />
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
      <!-- tabindex + role: the row scrolls horizontally, so keyboard users need
           to be able to focus it and scroll with the arrow keys (axe: scrollable-region-focusable) -->
      <div
        class="scrollbar-hide flex items-stretch gap-2 overflow-x-auto pb-1"
        tabindex="0"
        role="group"
        aria-label="How the Trust Card works"
      >
        <template v-for="(step, i) in FLOW" :key="step.title">
          <div
            class="flex min-w-[140px] flex-1 shrink-0 flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400"
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

    <!-- Full trust profile, opened from the primary CTA or by tapping the card.
         Keeps the "verified seller" demo on the landing page instead of
         bouncing the buyer to a generic profile route. -->
    <BaseModal
      :model-value="showTrustModal"
      max-width="lg"
      height="screen"
      @update:model-value="showTrustModal = $event"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <Icon
            name="solar:shield-check-bold"
            size="18"
            class="text-mint-dark dark:text-mint"
          />
          <h2 class="t-heading text-base">Verified Seller</h2>
        </div>
      </template>
      <TrustProfile v-if="featured" :slug="featured.store_slug" />
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useRuntimeConfig, navigateTo } from '#imports'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import { useTrustSpotlight } from '~~/layers/reputation/app/composables/useTrustSpotlight'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import TrustProfile from './TrustProfile.vue'

const TIER_LABELS = { TIER_1: 'Tier 1', TIER_2: 'Tier 2', TIER_3: 'Tier 3' }

// Four beats, not six: scanning and verifying happen in one action, and
// building reputation is what unlocks credit — so each is a single step.
const FLOW = [
  {
    icon: 'solar:qr-code-linear',
    title: 'Scan & verify',
    desc: 'Identity, CAC and reputation, at a glance',
  },
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    title: 'Pay protected',
    desc: 'Your money is held safely in escrow',
  },
  {
    icon: 'solar:check-circle-linear',
    title: 'Confirm delivery',
    desc: 'The seller is paid only when you confirm',
  },
  {
    icon: 'solar:graph-up-linear',
    title: 'Build credit',
    desc: 'Every clean sale becomes a record lenders can read',
  },
]

const { sellers, load } = useTrustSpotlight()
onMounted(load)

const config = useRuntimeConfig()
const featured = computed(() => sellers.value[0] ?? null)

// The buyer demo: open the featured seller's full trust profile in a modal.
// If the spotlight hasn't loaded yet, fall back to the sellers directory so
// the CTA is never a dead end.
const showTrustModal = ref(false)
const openTrust = () => {
  if (featured.value) showTrustModal.value = true
  else navigateTo('/discover?tab=sellers')
}

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

/* QR: a soft neutral lift that invites a scan, deepening on hover. Kept
   brand-free — the card's only accent is the "Pay protected" button. */
.qr-tile {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}
.qr-tile:hover {
  transform: scale(1.04);
  box-shadow:
    0 0 0 2px rgba(15, 23, 42, 0.12),
    0 10px 30px -6px rgba(15, 23, 42, 0.25);
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
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }
  50% {
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.16);
  }
}
</style>
