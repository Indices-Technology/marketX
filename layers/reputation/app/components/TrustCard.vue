<!--
  TrustCard — the discovery projection of a seller's reputation (framework §5.4).
  Story-first: the trust story reads as a human sentence (numbers in context),
  grounded by a real recent moment and small proof chips — not a stat grid.
  Colour system: BLUE = verified identity (matches the rest of the app); MINT =
  delivery success. Type snaps to the scale (font-display for the name + claim,
  Manrope for detail). Identity is real; the story is placeholder until the
  engine lands (see useTrustSpotlight).
-->
<template>
  <NuxtLink
    :to="`/sellers/profile/${seller.store_slug}`"
    class="group relative flex w-[272px] shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/20 dark:hover:border-neutral-600"
  >
    <!-- rank hairline — the only tier chrome, capped by design (§1.4) -->
    <span class="absolute inset-x-0 top-0 h-[3px]" :class="tier.bar" />

    <!-- identity -->
    <div class="flex items-center gap-2.5">
      <div class="relative shrink-0">
        <div
          class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand/10 font-display text-sm font-black text-brand"
        >
          <img
            v-if="seller.store_logo"
            :src="logo"
            :alt="name"
            width="44"
            height="44"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <template v-else>{{ initials }}</template>
        </div>
        <span
          v-if="seller.is_verified"
          class="absolute -bottom-1 -right-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-white bg-blue-500 dark:border-neutral-900"
          title="Verified seller"
        >
          <Icon name="solar:verified-check-bold" size="11" class="text-white" />
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <p
          class="truncate font-display text-sm font-bold text-gray-900 transition-colors group-hover:text-brand dark:text-neutral-100"
        >
          {{ name }}
        </p>
        <p
          v-if="seller.publicId"
          class="mt-0.5 font-mono text-2xs font-semibold uppercase tabular-nums tracking-wide text-gray-400 dark:text-neutral-500"
        >
          {{ seller.publicId }}
        </p>
      </div>

      <span
        class="shrink-0 self-start rounded-md px-1.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider"
        :class="tier.chip"
      >
        {{ tier.label }}
      </span>
    </div>

    <!-- the story — a sentence a buyer can relate to (mint = delivered safely) -->
    <div class="flex items-start gap-2">
      <Icon
        name="solar:check-circle-bold"
        size="17"
        class="mt-px shrink-0 text-mint-dark dark:text-mint"
      />
      <p
        class="font-display text-sm font-bold leading-snug text-gray-900 dark:text-neutral-50"
      >
        {{ seller.headline }}
      </p>
    </div>

    <!-- two supporting story beats: loyalty + a real recent moment -->
    <div
      class="flex flex-col gap-1.5 text-xs leading-snug text-gray-500 dark:text-neutral-400"
    >
      <span class="flex items-center gap-1.5">
        <Icon
          name="solar:refresh-circle-linear"
          size="14"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
        {{ seller.loyalty }}
      </span>
      <span class="flex items-center gap-1.5">
        <Icon
          name="solar:map-point-linear"
          size="14"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
        <span class="truncate">{{ seller.recent }}</span>
      </span>
    </div>

    <!-- proof chips — why you can trust the story above -->
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="chip in seller.chips"
        :key="chip.label"
        class="inline-flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-2xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
      >
        <Icon
          :name="chip.icon"
          size="11"
          class="text-gray-400 dark:text-neutral-500"
        />
        {{ chip.label }}
      </span>
    </div>

    <!-- entry point into the full buyer view (/t/{publicId}) -->
    <div
      class="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-neutral-800"
    >
      <span class="flex items-center gap-1 text-xs font-bold text-brand">
        View trust profile
        <Icon name="solar:arrow-right-linear" size="13" />
      </span>
      <span
        class="flex items-center gap-1 text-2xs font-semibold text-gray-400 dark:text-neutral-500"
      >
        <Icon name="solar:lock-keyhole-minimalistic-bold" size="11" />
        Protected
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import type { TrustSpotlightSeller } from '~~/layers/reputation/app/types/trust.types'

const props = defineProps<{ seller: TrustSpotlightSeller }>()

const name = computed(
  () => props.seller.store_name || props.seller.store_slug || 'Store',
)

const logo = computed(() =>
  props.seller.store_logo ? imgAvatar(props.seller.store_logo) : '',
)

const initials = computed(() =>
  (props.seller.store_name || props.seller.store_slug || '?')
    .slice(0, 2)
    .toUpperCase(),
)

// Rank chrome — shown, but structurally minor (a hairline + a small chip).
const TIERS = {
  TIER_1: {
    label: 'Tier 1',
    bar: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  TIER_2: {
    label: 'Tier 2',
    bar: 'bg-slate-300 dark:bg-slate-500',
    chip: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
  TIER_3: {
    label: 'Tier 3',
    bar: 'bg-orange-300 dark:bg-orange-500/60',
    chip: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  },
} as const

const tier = computed(() => TIERS[props.seller.tier])
</script>
