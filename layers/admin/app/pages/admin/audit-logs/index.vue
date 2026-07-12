<template>
  <div class="mx-auto max-w-6xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Audit Logs
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Platform security and activity trail
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <select
        v-model="eventTypeFilter"
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <option value="">All events</option>
        <optgroup label="Auth">
          <option value="LOGIN_SUCCESS">Login success</option>
          <option value="LOGIN_FAILED">Login failed</option>
          <option value="LOGIN_FAILED_RATE_LIMITED">Rate limited</option>
          <option value="LOGOUT">Logout</option>
        </optgroup>
        <optgroup label="Account">
          <option value="REGISTER_SUCCESS">Register</option>
          <option value="PASSWORD_RESET_REQUESTED">Password reset request</option>
          <option value="PASSWORD_RESET_SUCCESS">Password reset</option>
          <option value="PASSWORD_CHANGED">Password changed</option>
        </optgroup>
        <optgroup label="Security">
          <option value="SUSPICIOUS_ACTIVITY">Suspicious activity</option>
        </optgroup>
      </select>

      <div class="relative">
        <Icon
          name="solar:magnifer-linear"
          size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="userIdFilter"
          placeholder="Filter by user ID…"
          class="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        />
      </div>

      <div class="ml-auto flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-neutral-600">
        <Icon name="solar:shield-keyhole-linear" size="14" />
        Admin-only view
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <!-- Skeleton -->
      <table v-if="pending" class="w-full text-[12px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            <th class="px-4 py-3">Time</th>
            <th class="px-4 py-3">Event</th>
            <th class="px-4 py-3">User</th>
            <th class="px-4 py-3">IP</th>
            <th class="px-4 py-3">Result</th>
            <th class="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="i in 12" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><div class="h-3 w-28 rounded bg-gray-100 dark:bg-neutral-800" /></td>
            <td class="px-4 py-3"><div class="h-4 w-32 rounded bg-gray-100 dark:bg-neutral-800" /></td>
            <td class="px-4 py-3"><div class="h-3 w-40 rounded bg-gray-100 dark:bg-neutral-800" /></td>
            <td class="px-4 py-3"><div class="h-3 w-24 rounded bg-gray-100 dark:bg-neutral-800" /></td>
            <td class="px-4 py-3"><div class="h-4 w-14 rounded bg-gray-100 dark:bg-neutral-800" /></td>
            <td class="px-4 py-3"><div class="h-3 w-36 rounded bg-gray-100 dark:bg-neutral-800" /></td>
          </tr>
        </tbody>
      </table>

      <!-- Empty -->
      <div
        v-else-if="!logs.length"
        class="py-16 text-center text-gray-400 dark:text-neutral-600"
      >
        <Icon name="solar:magnifer-linear" size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-[13px]">No audit logs found</p>
      </div>

      <!-- Data -->
      <table v-else class="w-full text-[12px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">Time</th>
            <th class="px-4 py-3">Event</th>
            <th class="px-4 py-3">User</th>
            <th class="px-4 py-3">IP</th>
            <th class="px-4 py-3">Result</th>
            <th class="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr
            v-for="log in logs"
            :key="log.id"
            class="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/30"
            :class="{ 'opacity-60': log.success === false }"
          >
            <td class="px-4 py-3 font-mono text-[11px] text-gray-400 dark:text-neutral-600 whitespace-nowrap">
              {{ formatDate(log.created_at) }}
            </td>
            <td class="px-4 py-3">
              <span :class="eventBadgeClass(log.event_type)" class="rounded px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                {{ formatEventType(log.event_type) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <p class="truncate max-w-[180px] text-gray-700 dark:text-neutral-300">{{ log.email || '—' }}</p>
              <p class="font-mono text-[10px] text-gray-400 dark:text-neutral-600 truncate max-w-[180px]">{{ log.user_id }}</p>
            </td>
            <td class="px-4 py-3 font-mono text-[11px] text-gray-500 dark:text-neutral-400">
              {{ log.ip_address || '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                v-if="log.success"
                class="rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400"
              >OK</span>
              <span
                v-else
                class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400"
              >Failed</span>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
              <span class="truncate max-w-[200px] block">{{ log.reason || '—' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="hasMore || offset > 0" class="flex items-center justify-between">
      <button
        :disabled="offset === 0"
        class="rounded-lg border border-gray-200 px-4 py-2 text-[13px] disabled:opacity-40 dark:border-neutral-700"
        @click="offset = Math.max(0, offset - LIMIT)"
      >
        Previous
      </button>
      <span class="text-[12px] text-gray-400">Page {{ page }}</span>
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

const LIMIT = 50

const eventTypeFilter = ref('')
const userIdFilter = ref('')
const offset = ref(0)
const page = computed(() => Math.floor(offset.value / LIMIT) + 1)

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  () => `admin-audit-logs:${eventTypeFilter.value}:${userIdFilter.value}:${offset.value}`,
  () =>
    adminApi.getAuditLogs({
      eventType: eventTypeFilter.value || undefined,
      userId: userIdFilter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true },
)

const logs = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch([eventTypeFilter, userIdFilter], () => { offset.value = 0 })

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

function formatEventType(t: string) {
  return t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

function eventBadgeClass(type: string) {
  if (type.includes('FAILED') || type.includes('SUSPICIOUS')) {
    return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  }
  if (type.includes('LOGIN_SUCCESS') || type.includes('REGISTER_SUCCESS')) {
    return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
  }
  if (type.includes('PASSWORD') || type.includes('RESET')) {
    return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
  }
  if (type.includes('LOGOUT')) {
    return 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
  return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
}
</script>
