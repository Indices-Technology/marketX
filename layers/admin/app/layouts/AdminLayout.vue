<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
    <!-- Sidebar -->
    <aside
      class="hidden min-h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="border-b border-gray-200 px-5 py-5 dark:border-neutral-800">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-lg font-black tracking-tight text-rose-500"
            >MarketX</span
          >
          <span
            class="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            >Admin</span
          >
        </NuxtLink>
      </div>

      <nav class="flex-1 space-y-0.5 px-3 py-4">
        <AdminNavItem
          to="/admin"
          icon="solar:widget-5-linear"
          label="Dashboard"
          exact
        />
        <AdminNavItem
          to="/admin/reports"
          icon="solar:flag-linear"
          label="Reports"
          :badge="pendingCount"
        />
        <AdminNavItem
          to="/admin/users"
          icon="solar:users-group-two-rounded-linear"
          label="Users"
        />
        <AdminNavItem
          to="/admin/sellers"
          icon="solar:shop-2-linear"
          label="Sellers"
        />
        <AdminNavItem
          to="/admin/squares"
          icon="solar:city-linear"
          label="Squares"
          :badge="pendingSquaresCount"
          :admin-only="true"
        />
        <AdminNavItem
          to="/admin/categories"
          icon="solar:widget-linear"
          label="Categories"
        />
        <AdminNavItem
          to="/admin/payouts"
          icon="solar:money-bag-linear"
          label="Payouts"
          :badge="pendingPayoutsCount"
          :admin-only="true"
        />
        <AdminNavItem
          to="/admin/finance"
          icon="solar:chart-square-linear"
          label="Finance"
          :admin-only="true"
        />
        <AdminNavItem
          to="/admin/shipping"
          icon="solar:test-tube-linear"
          label="Carrier Sim"
          :admin-only="true"
        />
        <AdminNavItem
          to="/admin/announcements"
          icon="solar:speaker-linear"
          label="Announcements"
          :admin-only="true"
        />
        <AdminNavItem
          to="/support/agent"
          icon="solar:headphones-round-linear"
          label="Support"
          :admin-only="true"
        />
        <AdminNavItem
          to="/admin/audit-logs"
          icon="solar:magnifer-linear"
          label="Audit Logs"
          :admin-only="true"
        />
      </nav>

      <ClientOnly>
        <div
          class="border-t border-gray-200 px-4 py-4 text-[12px] text-gray-400 dark:border-neutral-800 dark:text-neutral-600"
        >
          Logged in as
          <span class="font-semibold text-gray-600 dark:text-neutral-400">{{
            profile.me?.username
          }}</span>
          <span
            class="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] capitalize dark:bg-neutral-800"
            >{{ profile.me?.role }}</span
          >
        </div>
      </ClientOnly>
    </aside>

    <!-- Mobile top bar -->
    <div
      class="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden dark:border-neutral-800 dark:bg-neutral-900"
    >
      <NuxtLink to="/" class="text-base font-black tracking-tight text-rose-500"
        >MarketX
        <span
          class="rounded bg-rose-100 px-1 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          >Admin</span
        ></NuxtLink
      >
      <button
        class="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
        @click="mobileOpen = !mobileOpen"
      >
        <Icon :name="mobileOpen ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'" size="22" />
      </button>
    </div>

    <!-- Mobile drawer -->
    <Transition name="slide-down">
      <div v-if="mobileOpen" class="fixed inset-0 z-30 pt-12 lg:hidden">
        <div class="absolute inset-0 bg-black/30" @click="mobileOpen = false" />
        <nav
          class="relative h-full w-64 space-y-1 bg-white p-4 shadow-xl dark:bg-neutral-900"
        >
          <AdminNavItem
            to="/admin"
            icon="solar:widget-5-linear"
            label="Dashboard"
            exact
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/reports"
            icon="solar:flag-linear"
            label="Reports"
            :badge="pendingCount"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/users"
            icon="solar:users-group-two-rounded-linear"
            label="Users"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/sellers"
            icon="solar:shop-2-linear"
            label="Sellers"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/squares"
            icon="solar:city-linear"
            label="Squares"
            :badge="pendingSquaresCount"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/categories"
            icon="solar:widget-linear"
            label="Categories"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/payouts"
            icon="solar:money-bag-linear"
            label="Payouts"
            :badge="pendingPayoutsCount"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/finance"
            icon="solar:chart-square-linear"
            label="Finance"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/shipping"
            icon="solar:test-tube-linear"
            label="Carrier Sim"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/announcements"
            icon="solar:speaker-linear"
            label="Announcements"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/support/agent"
            icon="solar:headphones-round-linear"
            label="Support"
            :admin-only="true"
            @click="mobileOpen = false"
          />
          <AdminNavItem
            to="/admin/audit-logs"
            icon="solar:magnifer-linear"
            label="Audit Logs"
            :admin-only="true"
            @click="mobileOpen = false"
          />
        </nav>
      </div>
    </Transition>

    <!-- Main content -->
    <main class="flex min-w-0 flex-1 flex-col pt-12 lg:pt-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'

import AdminNavItem from '../components/AdminNavItem.vue'

const profile = useProfileStore()
const mobileOpen = ref(false)

const adminApi = useAdminApi()
const { data: statsData } = await useAsyncData(
  'admin-layout-stats',
  () => adminApi.getStats(),
  { lazy: true },
)
const pendingCount = computed(
  () => (statsData.value as any)?.data?.pendingReports ?? 0,
)
const pendingPayoutsCount = computed(
  () => (statsData.value as any)?.data?.pendingPayouts ?? 0,
)
const pendingSquaresCount = computed(
  () => (statsData.value as any)?.data?.pendingSquares ?? 0,
)
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
}
</style>
