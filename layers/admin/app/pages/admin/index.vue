<template>
  <div class="mx-auto max-w-5xl space-y-8 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Dashboard
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Platform overview
      </p>
    </div>

    <!-- Stat cards skeleton -->
    <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
      />
    </div>

    <!-- Stat cards -->
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <AdminStatCard
        label="Pending Reports"
        :value="stats?.pendingReports ?? 0"
        icon="mdi:flag-outline"
        color="rose"
        to="/admin/reports"
      />
      <AdminStatCard
        label="Resolved Today"
        :value="stats?.resolvedToday ?? 0"
        icon="mdi:check-circle-outline"
        color="green"
      />
      <AdminStatCard
        label="Flagged Content"
        :value="stats?.flaggedContent ?? 0"
        icon="mdi:alert-outline"
        color="amber"
        to="/admin/reports?status=FLAGGED"
      />
      <AdminStatCard
        label="Active Users"
        :value="stats?.activeUsers ?? 0"
        icon="mdi:account-outline"
        color="blue"
        to="/admin/users"
      />
      <AdminStatCard
        label="Active Sellers"
        :value="stats?.activeSellers ?? 0"
        icon="mdi:store-outline"
        color="purple"
        to="/admin/sellers"
      />
      <AdminStatCard
        label="Banned Users"
        :value="stats?.bannedUsers ?? 0"
        icon="mdi:account-cancel-outline"
        color="gray"
        to="/admin/users?filter=banned"
      />
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NuxtLink
        to="/admin/reports"
        class="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-rose-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-rose-800"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 transition-colors group-hover:bg-rose-100 dark:bg-rose-900/20 dark:group-hover:bg-rose-900/40"
        >
          <Icon name="mdi:flag-outline" size="20" class="text-rose-500" />
        </div>
        <div>
          <p
            class="text-[13px] font-semibold text-gray-800 dark:text-neutral-200"
          >
            Review Reports
          </p>
          <p class="text-[12px] text-gray-400 dark:text-neutral-500">
            {{ stats?.pendingReports ?? 0 }} pending
          </p>
        </div>
        <Icon
          name="mdi:chevron-right"
          size="18"
          class="ml-auto text-gray-300 transition-colors group-hover:text-rose-400 dark:text-neutral-700"
        />
      </NuxtLink>

      <NuxtLink
        to="/admin/sellers?status=pending"
        class="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-purple-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-purple-800"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 transition-colors group-hover:bg-purple-100 dark:bg-purple-900/20 dark:group-hover:bg-purple-900/40"
        >
          <Icon
            name="mdi:store-check-outline"
            size="20"
            class="text-purple-500"
          />
        </div>
        <div>
          <p
            class="text-[13px] font-semibold text-gray-800 dark:text-neutral-200"
          >
            Seller Verification
          </p>
          <p class="text-[12px] text-gray-400 dark:text-neutral-500">
            Review pending applications
          </p>
        </div>
        <Icon
          name="mdi:chevron-right"
          size="18"
          class="ml-auto text-gray-300 transition-colors group-hover:text-purple-400 dark:text-neutral-700"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'

import AdminStatCard from '../../components/AdminStatCard.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  'admin-stats',
  () => adminApi.getStats(),
  { lazy: true },
)
const stats = computed(() => (data.value as any)?.data)
</script>
