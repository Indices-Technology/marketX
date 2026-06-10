<template>
  <div class="max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
        Analytics
      </h1>
      <!-- Day range selector -->
      <div
        class="flex rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      >
        <button
          v-for="d in RANGES"
          :key="d"
          class="px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="
            days === d
              ? 'rounded-xl bg-brand text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
          "
          @click="setDays(d)"
        >
          {{ d }}d
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="n in 5"
          :key="n"
          class="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
        />
      </div>
      <div
        class="h-52 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      />
      <div
        class="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      />
    </div>

    <template v-else-if="data">
      <!-- KPI cards -->
      <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p
            class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
          >
            {{ kpi.label }}
          </p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ kpi.value }}
          </p>
          <p
            v-if="kpi.sub"
            class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500"
          >
            {{ kpi.sub }}
          </p>
        </div>
      </div>

      <!-- Revenue chart -->
      <div
        class="mb-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p
          class="mb-4 text-sm font-semibold text-gray-700 dark:text-neutral-300"
        >
          Revenue (last {{ days }} days)
        </p>
        <RevenueChart :points="data.chart" />
      </div>

      <!-- Top products -->
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
          <p class="text-sm font-semibold text-gray-700 dark:text-neutral-300">
            Top Products
          </p>
        </div>

        <div
          v-if="!data.topProducts.length"
          class="py-16 text-center text-sm text-gray-400 dark:text-neutral-500"
        >
          No sales data yet for this period.
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
          <NuxtLink
            v-for="p in data.topProducts"
            :key="p.productId"
            :to="`/seller/${storeSlug}/products/${p.productId}/edit`"
            class="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
          >
            <!-- Thumbnail -->
            <div
              class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800"
            >
              <img
                v-if="p.thumbnail"
                :src="p.thumbnail"
                :alt="p.title"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center"
              >
                <Icon
                  name="mdi:image-outline"
                  size="20"
                  class="text-gray-300 dark:text-neutral-600"
                />
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100"
              >
                {{ p.title }}
              </p>
              <div
                class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-neutral-400"
              >
                <span>{{ formatKobo(p.revenue) }} revenue</span>
                <span>·</span>
                <span>{{ p.unitsSold }} sold</span>
                <span>·</span>
                <span>{{ p.views }} views</span>
                <span v-if="p.impressions"
                  >· {{ p.impressions }} impressions</span
                >
              </div>
            </div>

            <!-- Net revenue chip -->
            <div class="shrink-0 text-right">
              <p
                class="text-sm font-bold text-emerald-600 dark:text-emerald-400"
              >
                {{ formatKobo(p.revenue - p.affiliatePaid) }}
              </p>
              <p class="text-[10px] text-gray-400 dark:text-neutral-500">net</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Daily breakdown -->
      <div
        class="mt-5 rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <button
          class="flex w-full items-center justify-between px-5 py-4"
          @click="showDaily = !showDaily"
        >
          <p class="text-sm font-semibold text-gray-700 dark:text-neutral-300">
            Daily Breakdown
          </p>
          <Icon
            :name="showDaily ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            size="20"
            class="text-gray-400 dark:text-neutral-500"
          />
        </button>

        <div v-if="showDaily">
          <!-- Column headers -->
          <div
            class="grid grid-cols-[1fr_repeat(5,auto)] gap-x-4 border-t border-gray-100 px-5 py-2 dark:border-neutral-800"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Date</span
            >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Revenue</span
            >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Net</span
            >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Orders</span
            >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Units</span
            >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
              >Views</span
            >
          </div>

          <div class="divide-y divide-gray-50 dark:divide-neutral-800/60">
            <div
              v-for="day in dailyRows"
              :key="day.date"
              class="grid grid-cols-[1fr_repeat(5,auto)] items-center gap-x-4 px-5 py-3"
              :class="day.orders > 0 ? '' : 'opacity-40'"
            >
              <span
                class="text-xs font-medium text-gray-700 dark:text-neutral-300"
                >{{ day.label }}</span
              >
              <span
                class="text-xs font-semibold text-gray-900 dark:text-neutral-100"
                >{{ formatKobo(day.revenue) }}</span
              >
              <span
                class="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                >{{ formatKobo(day.net) }}</span
              >
              <span class="text-xs text-gray-600 dark:text-neutral-400">{{
                day.orders
              }}</span>
              <span class="text-xs text-gray-600 dark:text-neutral-400">{{
                day.unitsSold
              }}</span>
              <span class="text-xs text-gray-600 dark:text-neutral-400">{{
                day.views
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="error" class="py-20 text-center">
      <Icon
        name="mdi:alert-circle-outline"
        size="40"
        class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
      />
      <p class="text-sm text-gray-500 dark:text-neutral-400">
        Failed to load analytics. Try again.
      </p>
      <button
        class="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        @click="load"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/multi-word-component-names */
import { computed, ref } from 'vue'
import { definePageMeta, useRoute } from '#imports'
import { useAnalytics } from '~~/layers/seller/app/composables/useAnalytics'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import RevenueChart from '~~/layers/seller/app/components/RevenueChart.vue'

definePageMeta({ layout: 'store-layout' })

const route = useRoute()
const storeSlug = computed(() => route.params.storeSlug as string)
const { formatNGN: formatKobo } = useCurrency()

const {
  data,
  loading,
  error,
  days,
  kpis: rawKpis,
  RANGES,
  load,
  setDays,
} = useAnalytics(storeSlug)

const kpis = computed(() =>
  rawKpis.value.map((k) => ({
    label: k.label,
    sub: k.sub,
    value:
      k.format === 'currency'
        ? formatKobo(k.value)
        : k.format === 'percent'
          ? `${k.value}%`
          : k.value.toLocaleString(),
  })),
)

const showDaily = ref(false)

const dailyRows = computed(() => {
  if (!data.value) return []
  return [...data.value.chart].reverse().map((d) => ({
    date: d.date,
    label: new Date(d.date).toLocaleDateString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    revenue: d.revenue,
    net: d.revenue - d.affiliatePaid,
    orders: d.orders,
    unitsSold: d.unitsSold,
    views: d.views,
  }))
})
</script>
