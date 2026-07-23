<!--
  ScanFunnelPanel — a seller's Trust Card funnel metrics (framework §3). Shown
  on their /store/card page: how many people scanned the card, from which
  surface, the 14-day trend, and (once conversion attribution lands) the
  scan→protected-payment rate. This is the pilot's kill/scale dashboard.
-->
<template>
  <div
    class="rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="mb-4 flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-brand">
          Card performance
        </p>
        <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
          Last 60 days
        </p>
      </div>
      <Icon
        name="solar:chart-2-linear"
        size="18"
        class="text-gray-300 dark:text-neutral-600"
      />
    </div>

    <div v-if="loading" class="space-y-3">
      <BaseSkeleton shape="block" height="56px" rounded="rounded-xl" />
      <BaseSkeleton shape="block" height="72px" rounded="rounded-xl" />
    </div>

    <template v-else-if="stats && stats.totalScans > 0">
      <!-- headline numbers -->
      <div class="flex gap-3">
        <div
          class="flex-1 rounded-xl bg-gray-50 px-3 py-2.5 text-center dark:bg-neutral-800/50"
        >
          <p
            class="font-display text-2xl font-bold text-gray-900 dark:text-white"
          >
            {{ stats.totalScans }}
          </p>
          <p
            class="text-2xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
          >
            Scans
          </p>
        </div>
        <div
          class="flex-1 rounded-xl bg-gray-50 px-3 py-2.5 text-center dark:bg-neutral-800/50"
        >
          <p
            class="font-display text-2xl font-bold text-gray-900 dark:text-white"
          >
            {{ stats.conversions }}
          </p>
          <p
            class="text-2xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
          >
            Paid
          </p>
        </div>
        <div
          class="flex-1 rounded-xl bg-mint/10 px-3 py-2.5 text-center dark:bg-mint/10"
        >
          <p
            class="font-display text-2xl font-bold text-mint-dark dark:text-mint"
          >
            {{ stats.conversionRate.toFixed(0) }}%
          </p>
          <p
            class="text-2xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
          >
            Converted
          </p>
        </div>
      </div>

      <!-- 14-day trend -->
      <div class="mt-4">
        <p
          class="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
        >
          Scans · last 14 days
        </p>
        <div class="flex h-16 items-end gap-1">
          <div
            v-for="d in stats.daily"
            :key="d.date"
            class="flex-1 rounded-t bg-brand/70 transition-all"
            :style="{ height: barHeight(d.count) }"
            :title="`${d.date}: ${d.count}`"
          />
        </div>
      </div>

      <!-- by surface -->
      <div v-if="stats.bySurface.length" class="mt-4 flex flex-wrap gap-1.5">
        <span
          v-for="s in stats.bySurface"
          :key="s.surface"
          class="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-2xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <Icon
            :name="surfaceIcon(s.surface)"
            size="12"
            class="text-gray-400"
          />
          {{ surfaceLabel(s.surface) }} · {{ s.count }}
        </span>
      </div>

      <p
        v-if="stats.conversions === 0"
        class="mt-3 text-2xs leading-relaxed text-gray-400 dark:text-neutral-500"
      >
        Conversion tracking (scan → protected payment) turns on as buyers pay
        through a scanned card.
      </p>
    </template>

    <!-- empty -->
    <BaseEmptyState
      v-else
      icon="solar:qr-code-linear"
      title="No scans yet"
      description="Share your Trust Card — every scan shows up here."
      compact
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import { useReputationApi } from '~~/layers/reputation/app/services/reputation.api'
import type { ScanStats } from '~~/layers/reputation/server/utils/scanStats'

const props = defineProps<{ slug: string }>()

const stats = ref<ScanStats | null>(null)
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    const res = await useReputationApi().getScanStats(props.slug)
    stats.value = (res as { data?: ScanStats }).data ?? null
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.slug, load)

const maxCount = computed(() =>
  Math.max(1, ...(stats.value?.daily.map((d) => d.count) ?? [1])),
)
const barHeight = (count: number) =>
  `${Math.max(4, Math.round((count / maxCount.value) * 100))}%`

const surfaceLabel = (s: string) =>
  ({
    CARD: 'Card',
    PLAQUE: 'Plaque',
    IG_BIO: 'IG bio',
    PARCEL: 'Parcel',
  })[s] ?? 'Other'

const surfaceIcon = (s: string) =>
  ({
    CARD: 'solar:card-linear',
    PLAQUE: 'solar:buildings-2-linear',
    IG_BIO: 'solar:users-group-rounded-linear',
    PARCEL: 'solar:box-linear',
  })[s] ?? 'solar:qr-code-linear'
</script>
