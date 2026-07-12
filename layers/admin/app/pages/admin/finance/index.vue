<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
          Finance
        </h1>
        <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
          Revenue and orders across the platform
        </p>
      </div>
      <select
        v-model.number="days"
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <option :value="7">Last 7 days</option>
        <option :value="30">Last 30 days</option>
        <option :value="90">Last 90 days</option>
      </select>
    </div>

    <!-- Overview tiles -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="t in tiles"
        :key="t.label"
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Icon :name="t.icon" size="18" :class="`text-${t.color}-500`" />
        <p class="mt-2 text-lg font-bold text-gray-900 dark:text-neutral-100">
          <span
            v-if="financePending && !financeData"
            class="inline-block h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-neutral-800"
          />
          <span v-else>{{ t.value }}</span>
        </p>
        <p class="mt-0.5 text-[12px] text-gray-400 dark:text-neutral-500">
          {{ t.label }}
        </p>
      </div>
    </div>

    <!-- Payment status breakdown -->
    <div v-if="byStatus.length" class="flex flex-wrap items-center gap-2">
      <span
        class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500"
      >
        All orders
      </span>
      <span
        v-for="s in byStatus"
        :key="s.status"
        class="rounded-full px-2.5 py-1 text-[11px] font-medium"
        :class="paymentClass(s.status)"
      >
        {{ s.status }} · {{ s.count.toLocaleString() }}
      </span>
    </div>

    <!-- Orders -->
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          :class="[
            'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
            paymentFilter === f.value
              ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'border border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
          ]"
          @click="
            paymentFilter = f.value;
            offset = 0;
          "
        >
          {{ f.label }}
        </button>
        <div class="relative ml-auto">
          <Icon
            name="solar:magnifer-linear"
            size="15"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Buyer or order #…"
            class="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Skeleton -->
        <div
          v-if="ordersPending && !ordersData"
          class="divide-y divide-gray-50 dark:divide-neutral-800"
        >
          <div
            v-for="i in 6"
            :key="i"
            class="flex items-center gap-4 px-4 py-4"
          >
            <div
              class="h-3 w-12 animate-pulse rounded bg-gray-100 dark:bg-neutral-800"
            />
            <div
              class="h-3 flex-1 animate-pulse rounded bg-gray-100 dark:bg-neutral-800"
            />
            <div
              class="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-neutral-800"
            />
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!orders.length"
          class="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-neutral-500"
        >
          <Icon
            name="solar:bill-list-linear"
            size="30"
            class="mb-2 opacity-40"
          />
          <p class="text-[13px]">No orders found</p>
        </div>

        <!-- Rows -->
        <table v-else class="w-full text-[13px]">
          <thead class="bg-gray-50 dark:bg-neutral-800/50">
            <tr
              class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
            >
              <th class="px-4 py-3">Order</th>
              <th class="px-4 py-3">Buyer</th>
              <th class="px-4 py-3">Items</th>
              <th class="px-4 py-3">Amount</th>
              <th class="px-4 py-3">Method</th>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
            <tr v-for="o in orders" :key="o.id">
              <td
                class="px-4 py-3 font-medium text-gray-900 dark:text-neutral-100"
              >
                #{{ o.id }}
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-neutral-300">
                {{ o.name || '—' }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
                {{ o._count?.orderItem ?? 0 }}
              </td>
              <td
                class="px-4 py-3 font-semibold text-gray-900 dark:text-neutral-100"
              >
                {{ formatNGN((o.totalAmount || 0) + (o.shippingCost || 0)) }}
              </td>
              <td
                class="px-4 py-3 capitalize text-gray-500 dark:text-neutral-400"
              >
                {{ o.paymentMethod }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="paymentClass(o.paymentStatus)"
                >
                  {{ o.paymentStatus }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
                {{ formatDate(o.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="hasMore || offset > 0" class="flex justify-between">
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="offset === 0"
          @click="offset = Math.max(0, offset - LIMIT)"
        >
          Previous
        </BaseButton>
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="!hasMore"
          @click="offset += LIMIT"
        >
          Next
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const { formatNGN } = useCurrency()
const adminApi = useAdminApi()

// ── Overview ────────────────────────────────────────────────────────────────
const days = ref(30)
const { data: financeData, pending: financePending } = useAsyncData(
  'admin-finance',
  () => adminApi.getFinance({ days: days.value }),
  { lazy: true, watch: [days] },
)
const fin = computed(() => (financeData.value as any)?.data)

const tiles = computed(() => {
  const f = fin.value
  if (!f) return SKELETON_TILES
  return [
    {
      label: `GMV · ${f.days}d`,
      value: formatNGN(f.gmv),
      icon: 'solar:money-bag-linear',
      color: 'green',
    },
    {
      label: `Orders · ${f.days}d`,
      value: (f.orders ?? 0).toLocaleString(),
      icon: 'solar:bill-list-linear',
      color: 'blue',
    },
    {
      label: 'Avg order value',
      value: formatNGN(f.aov),
      icon: 'solar:chart-2-linear',
      color: 'purple',
    },
    {
      label: `Shipping · ${f.days}d`,
      value: formatNGN(f.shipping),
      icon: 'solar:delivery-linear',
      color: 'amber',
    },
    {
      label: `Affiliate paid · ${f.days}d`,
      value: formatNGN(f.affiliatePaid),
      icon: 'solar:user-hand-up-linear',
      color: 'rose',
    },
    {
      label: 'GMV · all time',
      value: formatNGN(f.allTimeGmv),
      icon: 'solar:chart-2-linear',
      color: 'gray',
    },
  ]
})
const SKELETON_TILES = [
  { label: 'GMV', value: '—', icon: 'solar:money-bag-linear', color: 'green' },
  {
    label: 'Orders',
    value: '—',
    icon: 'solar:bill-list-linear',
    color: 'blue',
  },
  {
    label: 'Avg order value',
    value: '—',
    icon: 'solar:chart-2-linear',
    color: 'purple',
  },
  { label: 'Shipping', value: '—', icon: 'solar:delivery-linear', color: 'amber' },
  {
    label: 'Affiliate paid',
    value: '—',
    icon: 'solar:user-hand-up-linear',
    color: 'rose',
  },
  { label: 'GMV · all time', value: '—', icon: 'solar:chart-2-linear', color: 'gray' },
]

const byStatus = computed(() => {
  const m = fin.value?.byPaymentStatus ?? {}
  return Object.entries(m).map(([status, count]) => ({
    status,
    count: count as number,
  }))
})

// ── Orders list ─────────────────────────────────────────────────────────────
const LIMIT = 20
const paymentFilter = ref('')
const search = ref('')
const offset = ref(0)
const debouncedSearch = useDebounce(search, 300)

const { data: ordersData, pending: ordersPending } = useAsyncData(
  'admin-orders',
  () =>
    adminApi.getOrders({
      paymentStatus: paymentFilter.value || undefined,
      search: debouncedSearch.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [paymentFilter, debouncedSearch, offset] },
)
const orders = computed(() => (ordersData.value as any)?.items ?? [])
const hasMore = computed(
  () => (ordersData.value as any)?.meta?.hasMore ?? false,
)

watch([paymentFilter, debouncedSearch], () => {
  offset.value = 0
})

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SHIPPING_PAID', label: 'POD' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
]

function paymentClass(status: string) {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    SHIPPING_PAID:
      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    PENDING:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    UNPAID:
      'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
    FAILED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    REFUNDED:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    map[status] ??
    'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function useDebounce<T>(value: Ref<T>, delay: number) {
  const debounced = ref(value.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout>
  watch(value, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = v
    }, delay)
  })
  return debounced
}
</script>
