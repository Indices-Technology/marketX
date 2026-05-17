<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Sellers
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Manage stores and verifications
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        :class="[
          'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
          statusFilter === f.value
            ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'border border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
        ]"
        @click=" statusFilter = f.value; offset = 0"
      >
        {{ f.label }}
      </button>

      <div class="relative ml-auto">
        <Icon
          name="mdi:magnify"
          size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          placeholder="Search store…"
          class="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <table v-if="pending" class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Owner</th>
            <th class="px-4 py-3">Products</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Verification</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="i in 8" :key="i" class="animate-pulse">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="h-8 w-8 rounded-lg bg-gray-100 dark:bg-neutral-800"
                />
                <div class="space-y-1.5">
                  <div
                    class="h-3 w-28 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                  <div
                    class="h-2.5 w-20 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="h-3 w-24 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-3 w-8 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-14 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-16 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3" />
          </tr>
        </tbody>
      </table>
      <div
        v-else-if="!sellers.length"
        class="p-8 text-center text-[13px] text-gray-400"
      >
        No sellers found
      </div>
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Owner</th>
            <th class="px-4 py-3">Products</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Verification</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr
            v-for="seller in sellers"
            :key="seller.id"
            class="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/30"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="seller.store_logo"
                  :src="seller.store_logo"
                  class="h-8 w-8 rounded-lg object-cover"
                />
                <div
                  v-else
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800"
                >
                  <Icon
                    name="mdi:store-outline"
                    size="15"
                    class="text-gray-400"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-800 dark:text-neutral-200">
                    {{ seller.store_name || seller.store_slug }}
                  </p>
                  <p class="text-[11px] text-gray-400 dark:text-neutral-600">
                    {{ seller.store_slug }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
              {{ seller.profile?.username || seller.profile?.email }}
            </td>
            <td class="px-4 py-3 font-mono text-gray-700 dark:text-neutral-300">
              {{ seller._count?.products ?? 0 }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="
                  seller.is_active
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-neutral-800'
                "
                class="rounded px-2 py-0.5 text-[10px] font-semibold"
              >
                {{ seller.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="verificationClass(seller.verification_status)"
                class="rounded px-2 py-0.5 text-[10px] font-semibold"
              >
                {{ seller.verification_status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div
                v-if="seller.verification_status === 'PENDING'"
                class="flex gap-1.5"
              >
                <button
                  class="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                  @click="verify(seller.id, 'VERIFIED')"
                >
                  Approve
                </button>
                <button
                  class="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                  @click="verify(seller.id, 'REJECTED')"
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasMore || offset > 0" class="flex justify-between">
      <button
        :disabled="offset === 0"
        class="rounded-lg border border-gray-200 px-4 py-2 text-[13px] disabled:opacity-40 dark:border-neutral-700"
        @click="offset = Math.max(0, offset - LIMIT)"
      >
        Previous
      </button>
      <button
        :disabled="!hasMore"
        class="rounded-lg border border-gray-200 px-4 py-2 text-[13px] disabled:opacity-40 dark:border-neutral-700"
        @click="offset += LIMIT"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const LIMIT = 20
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'inactive', label: 'Inactive' },
]

const search = ref('')
const statusFilter = ref('')
const offset = ref(0)

const adminApi = useAdminApi()
const { data, pending, refresh } = useAsyncData(
  'admin-sellers',
  () =>
    adminApi.getSellers({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [search, statusFilter, offset] },
)

const sellers = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch([search, statusFilter], () => {
  offset.value = 0
})

async function verify(id: string, status: 'VERIFIED' | 'REJECTED') {
  try {
    await adminApi.verifySeller(id, status)
    refresh()
  } catch {}
}

function verificationClass(status: string) {
  const map: Record<string, string> = {
    PENDING:
      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    VERIFIED:
      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    REJECTED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }
  return map[status] ?? ''
}
</script>
