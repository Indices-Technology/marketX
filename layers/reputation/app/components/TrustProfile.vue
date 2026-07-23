<!--
  TrustProfile — the full buyer trust view for one seller (framework §5), shown
  as the "Trust" tab on the seller profile. Reads REAL facts from
  /api/reputation/profile/[slug]: bands + human facts, no composite score.
  Consent-gated dimensions read "not provided", never a penalty (§1.5).
-->
<template>
  <div class="space-y-5">
    <!-- loading -->
    <div v-if="loading" class="space-y-4">
      <BaseSkeleton shape="block" height="120px" rounded="rounded-2xl" />
      <BaseSkeleton
        v-for="i in 4"
        :key="i"
        shape="block"
        height="44px"
        rounded="rounded-xl"
      />
    </div>

    <BaseEmptyState
      v-else-if="!data"
      icon="solar:shield-warning-linear"
      title="Trust profile unavailable"
      description="We couldn't load this seller's trust profile right now."
      compact
    />

    <template v-else>
      <!-- headline card -->
      <div
        class="rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3
                class="font-display text-base font-bold text-gray-900 dark:text-white"
              >
                {{ data.store_name || data.store_slug }}
              </h3>
              <Icon
                v-if="data.is_verified"
                name="solar:verified-check-bold"
                size="16"
                class="shrink-0 text-blue-500"
              />
            </div>
            <p
              v-if="data.publicId"
              class="mt-0.5 font-mono text-2xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
            >
              {{ data.publicId }}
            </p>
          </div>
          <span
            v-if="data.tier"
            class="shrink-0 rounded-md px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider"
            :class="tierChip"
          >
            {{ tierLabel }}
          </span>
        </div>

        <p
          class="mt-3 flex items-start gap-2 font-display text-sm font-bold leading-snug text-gray-900 dark:text-neutral-50"
        >
          <Icon
            v-if="data.enoughEvidence"
            name="solar:check-circle-bold"
            size="17"
            class="mt-px shrink-0 text-mint-dark dark:text-mint"
          />
          {{ data.headline }}
        </p>

        <!-- real facts row -->
        <div
          v-if="data.enoughEvidence"
          class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-neutral-400"
        >
          <span
            ><b class="font-display text-gray-900 dark:text-neutral-100">{{
              data.facts.sales
            }}</b>
            orders</span
          >
          <span v-if="data.facts.delivered > 0"
            ><b class="font-display text-gray-900 dark:text-neutral-100">{{
              data.facts.delivered
            }}</b>
            verified</span
          >
          <span
            ><b class="font-display text-gray-900 dark:text-neutral-100"
              >{{ data.facts.disputeRate }}%</b
            >
            disputes</span
          >
          <span v-if="data.facts.rating != null"
            ><b class="font-display text-gray-900 dark:text-neutral-100"
              >{{ data.facts.rating }}★</b
            >
            ({{ data.facts.reviewCount }})</span
          >
          <span
            ><b class="font-display text-gray-900 dark:text-neutral-100">{{
              data.facts.tenure
            }}</b></span
          >
        </div>
        <p
          v-if="data.facts.lastSale"
          class="mt-2 flex items-center gap-1.5 text-2xs text-gray-400 dark:text-neutral-500"
        >
          <Icon name="solar:map-point-linear" size="12" />
          {{ data.facts.lastSale }}
        </p>
      </div>

      <!-- dimensions -->
      <div class="space-y-3">
        <div v-for="dim in data.dimensions" :key="dim.key" class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span
              class="text-2xs font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >{{ dim.label }}</span
            >
            <span
              class="text-xs font-medium"
              :class="
                dim.score == null
                  ? 'text-gray-400 dark:text-neutral-600'
                  : 'text-gray-600 dark:text-neutral-300'
              "
              >{{ dim.fact }}</span
            >
          </div>
          <div
            class="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800"
          >
            <div
              v-if="dim.score != null"
              class="h-full rounded-full transition-all"
              :class="barTone(dim.band)"
              :style="{ width: dim.score + '%' }"
            />
          </div>
        </div>
      </div>

      <!-- how reputation works -->
      <p
        class="rounded-xl bg-gray-50 px-3.5 py-2.5 text-2xs leading-relaxed text-gray-500 dark:bg-neutral-800/50 dark:text-neutral-400"
      >
        Every number here is computed from real, completed sales on MarketX —
        earned, not bought. Dimensions a seller hasn't shared read
        <span class="font-semibold">not provided</span>, never counted against
        them.
      </p>

      <!-- protected CTA -->
      <NuxtLink
        :to="`/sellers/profile/${data.store_slug}`"
        class="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-brand-sm transition-colors hover:bg-brand-dark"
      >
        <Icon name="solar:lock-keyhole-minimalistic-bold" size="16" />
        Pay this seller protected
      </NuxtLink>
      <p class="text-center text-2xs text-gray-400 dark:text-neutral-500">
        If it's not delivered as described, your money is not released.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import { useReputationApi } from '~~/layers/reputation/app/services/reputation.api'
import type {
  TrustProfileView,
  TrustBand,
} from '~~/layers/reputation/app/types/trust.types'

const props = defineProps<{ slug: string }>()

const data = ref<TrustProfileView | null>(null)
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    const res = await useReputationApi().getProfile(props.slug)
    data.value = (res as { data?: TrustProfileView }).data ?? null
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.slug, load)

const TIER_LABELS: Record<string, string> = {
  TIER_1: 'Tier 1',
  TIER_2: 'Tier 2',
  TIER_3: 'Tier 3',
}
const tierLabel = computed(() =>
  data.value?.tier ? TIER_LABELS[data.value.tier] : '',
)
const tierChip = computed(() => {
  switch (data.value?.tier) {
    case 'TIER_1':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    case 'TIER_2':
      return 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300'
    default:
      return 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
  }
})

const barTone = (band: TrustBand) => {
  switch (band) {
    case 'HIGH':
      return 'bg-mint dark:bg-mint-light'
    case 'MEDIUM':
      return 'bg-amber-400'
    case 'LOW':
      return 'bg-gray-300 dark:bg-neutral-600'
    default:
      return 'bg-transparent'
  }
}
</script>
