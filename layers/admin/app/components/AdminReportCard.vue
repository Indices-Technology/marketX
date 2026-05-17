<template>
  <div class="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl p-4 space-y-3">
    <!-- Header row -->
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span :class="contentTypeBadgeClass">{{ report.contentType }}</span>
          <span :class="reasonBadgeClass">{{ report.reason.replace('_', ' ') }}</span>
          <span class="text-[11px] text-gray-400 dark:text-neutral-600">
            reported by @{{ report.reporter?.username ?? 'unknown' }} · {{ timeAgo(report.createdAt) }}
          </span>
        </div>
        <p v-if="report.note" class="mt-1 text-[12px] text-gray-500 dark:text-neutral-400 italic truncate">
          "{{ report.note }}"
        </p>
        <p class="mt-1 text-[11px] font-mono text-gray-300 dark:text-neutral-700">
          ID: {{ report.contentId }}
        </p>
      </div>

      <span :class="statusBadgeClass">{{ report.status }}</span>
    </div>

    <!-- Action buttons (only for pending/under_review) -->
    <div v-if="report.status === 'PENDING' || report.status === 'UNDER_REVIEW'" class="flex flex-wrap gap-2 pt-1 border-t border-gray-50 dark:border-neutral-800">
      <button
        v-for="action in ACTIONS"
        :key="action.value"
        :disabled="resolving"
        @click="resolve(action.value)"
        :class="action.class"
      >
        <Icon :name="action.icon" size="13" />
        {{ action.label }}
      </button>
    </div>

    <!-- Resolution info -->
    <div v-else-if="report.moderatorNote" class="text-[12px] text-gray-400 dark:text-neutral-600 pt-1 border-t border-gray-50 dark:border-neutral-800">
      <span class="font-medium">Note:</span> {{ report.moderatorNote }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'

const props = defineProps<{ report: any }>()
const emit = defineEmits<{ resolved: [] }>()

const resolving = ref(false)
const adminApi = useAdminApi()

const ACTIONS = [
  { value: 'DISMISS', label: 'Dismiss', icon: 'mdi:close', class: 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors' },
  { value: 'WARN', label: 'Warn', icon: 'mdi:alert-outline', class: 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 disabled:opacity-40 transition-colors' },
  { value: 'HIDE', label: 'Hide', icon: 'mdi:eye-off-outline', class: 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 disabled:opacity-40 transition-colors' },
  { value: 'REMOVE', label: 'Remove', icon: 'mdi:delete-outline', class: 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 disabled:opacity-40 transition-colors' },
]

async function resolve(action: string) {
  resolving.value = true
  try {
    await adminApi.resolveReport(props.report.id, { action })
    emit('resolved')
  } catch {
  } finally {
    resolving.value = false
  }
}

const contentTypeBadgeClass = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
const reasonBadgeClass = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 uppercase'

const statusBadgeClass = computed(() => {
  const base = 'px-2 py-0.5 rounded text-[10px] font-semibold shrink-0'
  const map: Record<string, string> = {
    PENDING: `${base} bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400`,
    UNDER_REVIEW: `${base} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`,
    RESOLVED: `${base} bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400`,
    DISMISSED: `${base} bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-500`,
  }
  return map[props.report.status] ?? base
})

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
</script>
