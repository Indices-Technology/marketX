<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
          Reports
        </h1>
        <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
          Moderation queue
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="s in STATUSES"
        :key="s.value"
        :class="[
          'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
          activeStatus === s.value
            ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
        ]"
        @click="setStatus(s.value)"
      >
        {{ s.label }}
      </button>

      <select
        v-model="contentTypeFilter"
        class="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <option value="">All types</option>
        <option v-for="t in CONTENT_TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Queue -->
    <div v-if="pending && !data" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
      />
    </div>

    <div
      v-else-if="!reports.length"
      class="py-16 text-center text-gray-400 dark:text-neutral-600"
    >
      <Icon
        name="solar:flag-2-linear"
        size="40"
        class="mx-auto mb-3 opacity-40"
      />
      <p class="text-[13px]">No {{ activeStatus.toLowerCase() }} reports</p>
    </div>

    <div v-else class="space-y-3">
      <AdminReportCard
        v-for="report in reports"
        :key="report.id"
        :report="report"
        @resolved="onResolved(report.id)"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="hasMore || offset > 0"
      class="flex items-center justify-between pt-2"
    >
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

import AdminReportCard from '~~/layers/admin/app/components/AdminReportCard.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const LIMIT = 20
const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
]
const CONTENT_TYPES = ['POST', 'PRODUCT', 'COMMENT', 'REVIEW', 'USER']

const route = useRoute()
const router = useRouter()
const activeStatus = ref((route.query.status as string) || 'PENDING')
const contentTypeFilter = ref((route.query.contentType as string) || '')
const offset = ref(0)

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  'admin-reports',
  () =>
    adminApi.getReports({
      status: activeStatus.value,
      contentType: contentTypeFilter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [activeStatus, contentTypeFilter, offset] },
)

const reports = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

function setStatus(s: string) {
  activeStatus.value = s
  offset.value = 0
  router.replace({ query: { ...route.query, status: s } })
}

function onResolved(id: string) {
  // Resolved reports leave the actionable queue — drop the row optimistically
  // instead of refetching the whole list.
  const d = data.value as any
  if (d?.items) d.items = d.items.filter((r: any) => r.id !== id)
}

watch([contentTypeFilter], () => {
  offset.value = 0
})
</script>
