<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">Squares</h1>
        <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
          Create, approve and moderate market squares
        </p>
      </div>
      <BaseButton size="sm" variant="primary" @click="openCreate">
        <Icon name="solar:add-circle-linear" size="15" /> New square
      </BaseButton>
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
        @click="statusFilter = f.value; offset = 0"
      >
        {{ f.label }}
      </button>
      <div class="relative ml-auto">
        <Icon name="solar:magnifer-linear" size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search square…"
          class="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <!-- Skeleton -->
      <div v-if="pending && !data" class="divide-y divide-gray-50 dark:divide-neutral-800">
        <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-4 py-4">
          <div class="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
            <div class="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
          </div>
          <div class="h-6 w-20 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!squares.length" class="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-neutral-500">
        <Icon name="solar:city-linear" size="30" class="mb-2 opacity-40" />
        <p class="text-[13px]">No {{ (statusFilter || 'matching').toLowerCase() }} squares</p>
      </div>

      <!-- Rows -->
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            <th class="px-4 py-3">Square</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Location</th>
            <th class="px-4 py-3">Activity</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="s in squares" :key="s.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
                  <img v-if="s.iconUrl" :src="s.iconUrl" class="h-full w-full object-cover" alt="" />
                  <Icon v-else name="solar:city-linear" size="15" class="text-gray-400" />
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-900 dark:text-neutral-100">{{ s.name }}</p>
                  <p class="truncate text-[11px] text-gray-400 dark:text-neutral-500">@{{ s.slug }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400">
                {{ s.type === 'GEOGRAPHIC' ? 'Geographic' : 'Category' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
              {{ [s.city, s.state].filter(Boolean).join(', ') || '—' }}
            </td>
            <td class="px-4 py-3 text-[11px] text-gray-500 dark:text-neutral-400">
              {{ s.memberCount }} members · {{ s.followerCount }} followers · {{ s.postCount }} posts
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(s.status)">
                {{ s.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <BaseButton
                  v-if="s.status !== 'ACTIVE'"
                  size="sm"
                  variant="primary"
                  :loading="busyId === s.id"
                  @click="act(s, 'ACTIVE')"
                >
                  {{ s.status === 'PENDING' ? 'Approve' : 'Reactivate' }}
                </BaseButton>
                <BaseButton
                  v-if="s.status !== 'SUSPENDED'"
                  size="sm"
                  variant="secondary"
                  :loading="busyId === s.id"
                  @click="act(s, 'SUSPENDED')"
                >
                  {{ s.status === 'PENDING' ? 'Reject' : 'Suspend' }}
                </BaseButton>
                <button
                  class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  title="Edit"
                  @click="openEdit(s)"
                >
                  <Icon name="solar:pen-linear" size="16" />
                </button>
                <button
                  class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="Delete"
                  @click="removeSquare(s)"
                >
                  <Icon name="solar:trash-bin-trash-linear" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasMore || offset > 0" class="flex justify-between">
      <BaseButton size="sm" variant="secondary" :disabled="offset === 0" @click="offset = Math.max(0, offset - LIMIT)">
        Previous
      </BaseButton>
      <BaseButton size="sm" variant="secondary" :disabled="!hasMore" @click="offset += LIMIT">
        Next
      </BaseButton>
    </div>

    <SquareFormModal
      :open="formOpen"
      :square="editing"
      @close="formOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { notify } from '@kyvg/vue3-notification'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import SquareFormModal from '../../../components/SquareFormModal.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const FILTERS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: '', label: 'All' },
]

const LIMIT = 20
const route = useRoute()
const statusFilter = ref((route.query.status as string) || 'PENDING')
const search = ref('')
const offset = ref(0)
const debouncedSearch = useDebounce(search, 300)

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  'admin-squares',
  () =>
    adminApi.getSquares({
      status: statusFilter.value || undefined,
      search: debouncedSearch.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [statusFilter, debouncedSearch, offset] },
)

const squares = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch([statusFilter, debouncedSearch], () => {
  offset.value = 0
})

// ── Create / edit / delete ──────────────────────────────────────────────────
const formOpen = ref(false)
const editing = ref<any>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(square: any) {
  editing.value = square
  formOpen.value = true
}
function onSaved(saved: any) {
  formOpen.value = false
  const items = (data.value as any)?.items
  if (items && saved) {
    if (editing.value) {
      const row = items.find((r: any) => r.id === saved.id || r.slug === saved.slug)
      if (row) Object.assign(row, saved)
    } else if (statusFilter.value === 'PENDING' || statusFilter.value === '') {
      // New squares are PENDING — show them right away in the queue / All view.
      items.unshift({ memberCount: 0, followerCount: 0, postCount: 0, ...saved })
    }
  }
  editing.value = null
}

async function removeSquare(square: any) {
  if (!window.confirm(`Delete "${square.name}"? This cannot be undone.`)) return
  try {
    await adminApi.deleteSquare(square.slug)
    const items = (data.value as any)?.items
    if (items) (data.value as any).items = items.filter((r: any) => r.id !== square.id)
    notify({ type: 'success', text: 'Square deleted' })
  } catch {
    // BaseApiClient surfaces the guard error (e.g. has members)
  }
}

const busyId = ref<string | null>(null)

async function act(square: any, status: 'ACTIVE' | 'SUSPENDED') {
  if (busyId.value) return
  busyId.value = square.id
  try {
    await adminApi.setSquareStatus(square.id, status)
    const items = (data.value as any)?.items
    if (items) {
      // In the Pending queue an approved/rejected square leaves the list;
      // otherwise patch its status in place.
      if (statusFilter.value === 'PENDING') {
        ;(data.value as any).items = items.filter((r: any) => r.id !== square.id)
      } else {
        const row = items.find((r: any) => r.id === square.id)
        if (row) row.status = status
      }
    }
  } catch {
    // BaseApiClient surfaces the error toast
  } finally {
    busyId.value = null
  }
}

function statusClass(status: string) {
  if (status === 'PENDING')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (status === 'ACTIVE')
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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
