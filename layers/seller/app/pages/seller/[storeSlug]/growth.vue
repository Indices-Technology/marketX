<template>
  <div class="max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Growth</h1>
        <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
          Every product you've promoted, and how it's performing.
        </p>
      </div>
      <NuxtLink
        :to="`/seller/${storeSlug}/connections`"
        class="shrink-0 text-xs font-semibold text-brand hover:underline"
      >
        Connected accounts →
      </NuxtLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-3 gap-3 lg:grid-cols-6">
        <div
          v-for="n in 6"
          :key="n"
          class="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
        />
      </div>
      <div class="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
    </div>

    <template v-else-if="data">
      <!-- Funnel KPIs -->
      <div class="mb-5 grid grid-cols-3 gap-3 lg:grid-cols-6">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            {{ kpi.label }}
          </p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">{{ kpi.value }}</p>
        </div>
      </div>

      <!-- Assets -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
          <p class="text-sm font-semibold text-gray-700 dark:text-neutral-300">Promoted products</p>
        </div>

        <div v-if="!data.assets.length" class="px-5 py-16 text-center">
          <p class="mb-3 text-sm text-gray-400 dark:text-neutral-500">
            You haven't promoted a product yet.
          </p>
          <NuxtLink
            :to="`/seller/${storeSlug}/products`"
            class="inline-block rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Go to Products →
          </NuxtLink>
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
          <button
            v-for="asset in data.assets"
            :key="asset.id"
            type="button"
            class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
            @click="onPromote(asset)"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
              <img
                v-if="asset.productImage"
                :src="asset.productImage"
                :alt="asset.productTitle ?? ''"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <Icon name="solar:box-linear" size="20" class="text-gray-300 dark:text-neutral-600" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {{ asset.productTitle ?? 'Untitled product' }}
              </p>
              <p class="mt-0.5 truncate text-xs text-gray-400 dark:text-neutral-500">
                {{ asset.distributions }} shared · {{ asset.events.VIEW }} views ·
                {{ asset.events.SCAN }} scans · {{ asset.events.LEAD }} leads ·
                {{ asset.events.ORDER }} orders
              </p>
            </div>

            <BaseBadge :label="statusLabel(asset.status)" size="sm" class="shrink-0" />
            <Icon name="solar:alt-arrow-right-linear" size="16" class="shrink-0 text-gray-300 dark:text-neutral-600" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import { useGrowthDashboard } from '~~/layers/growth/app/composables/useGrowthDashboard'
import type { GrowthDashboardAssetDTO } from '~~/layers/growth/app/services/growthAsset.api'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

const route = useRoute()
const router = useRouter()
const storeSlug = computed(() => route.params.storeSlug as string)

const { data, loading, load } = useGrowthDashboard()

const kpis = computed(() => {
  const s = data.value?.summary
  return [
    { label: 'Assets', value: s?.assets ?? 0 },
    { label: 'Shared', value: s?.distributions ?? 0 },
    { label: 'Views', value: s?.events.VIEW ?? 0 },
    { label: 'Scans', value: s?.events.SCAN ?? 0 },
    { label: 'Leads', value: s?.events.LEAD ?? 0 },
    { label: 'Orders', value: s?.events.ORDER ?? 0 },
  ]
})

function statusLabel(status: string) {
  if (status === 'APPROVED') return 'Ready'
  if (status === 'DRAFT') return 'Draft'
  return status
}

// Reuses the same round-trip GrowthPromoteModal opens for "Connect TikTok" —
// Products page reads `?promote=<id>` and reopens the modal for that product.
function onPromote(asset: GrowthDashboardAssetDTO) {
  if (!asset.productId) return
  router.push(`/seller/${storeSlug.value}/products?promote=${asset.productId}`)
}

onMounted(() => load())
</script>
