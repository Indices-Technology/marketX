<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Users
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Search and manage accounts
      </p>
    </div>

    <!-- Search + filter -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Icon
          name="solar:magnifer-linear"
          size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Search by email or username…"
          class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <select
        v-model="filter"
        class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <option value="">All</option>
        <option value="banned">Banned</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <table v-if="pending && !data" class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">User</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Strikes</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Joined</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="i in 8" :key="i" class="animate-pulse">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="h-7 w-7 rounded-full bg-gray-100 dark:bg-neutral-800"
                />
                <div class="space-y-1.5">
                  <div
                    class="h-3 w-24 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                  <div
                    class="h-2.5 w-32 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-14 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-6 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-16 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-20 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-5 w-5 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-else-if="!users.length"
        class="p-8 text-center text-[13px] text-gray-400 dark:text-neutral-600"
      >
        No users found
      </div>
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">User</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Strikes</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Joined</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr
            v-for="user in users"
            :key="user.id"
            class="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/30"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  class="h-7 w-7 rounded-full object-cover"
                />
                <div
                  v-else
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-500 dark:bg-neutral-700"
                >
                  {{ (user.username || user.email)?.[0]?.toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-gray-800 dark:text-neutral-200">
                    @{{ user.username || '—' }}
                  </p>
                  <p class="text-[11px] text-gray-400 dark:text-neutral-600">
                    {{ user.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded px-2 py-0.5 text-[10px] font-semibold capitalize"
                :class="roleBadgeClass(user.role)"
                >{{ roleLabel(user.role) }}</span
              >
            </td>
            <td class="px-4 py-3 font-mono text-gray-700 dark:text-neutral-300">
              {{ user.strikeCount }}
            </td>
            <td class="px-4 py-3">
              <span
                v-if="user.bannedAt"
                class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400"
                >Banned</span
              >
              <span
                v-else-if="
                  user.suspendedUntil &&
                  new Date(user.suspendedUntil) > new Date()
                "
                class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                >Suspended</span
              >
              <span
                v-else-if="!user.isActive"
                class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-neutral-800 dark:text-neutral-500"
                >Disabled</span
              >
              <span
                v-else
                class="rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400"
                >Active</span
              >
            </td>
            <td class="px-4 py-3 text-gray-400 dark:text-neutral-600">
              {{ formatDate(user.created_at) }}
            </td>
            <td class="px-4 py-3">
              <AdminUserActions
                :user="user"
                @updated="(patch) => Object.assign(user, patch)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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
import AdminUserActions from '../../../components/AdminUserActions.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

function roleLabel(role: string) {
  return role === 'support_agent' ? 'Support Agent' : role
}
function roleBadgeClass(role: string) {
  if (role === 'admin') return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
  if (role === 'support_agent') return 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
  if (role === 'moderator') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
}

const LIMIT = 20
const route = useRoute()
const search = ref('')
// Seed from the URL so the dashboard's "Banned users" link (?filter=banned) works.
const filter = ref((route.query.filter as string) || '')
const offset = ref(0)
const debouncedSearch = useDebounce(search, 300)

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  'admin-users',
  () =>
    adminApi.getUsers({
      search: debouncedSearch.value || undefined,
      status: filter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [debouncedSearch, filter, offset] },
)

// Filtering is done server-side now (banned/suspended run in the DB, not on the
// loaded page) so the dashboard's "Banned users" link and paging are correct.
const users = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch([debouncedSearch, filter], () => {
  offset.value = 0
})

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
