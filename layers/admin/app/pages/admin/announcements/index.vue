<template>
  <div class="mx-auto max-w-2xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">Announcements</h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Send a platform-wide notification to your users
      </p>
    </div>

    <div class="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <!-- Audience -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Audience</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="t in TARGETS"
            :key="t.value"
            type="button"
            class="rounded-xl border p-3 text-left transition-colors"
            :class="
              target === t.value
                ? 'border-brand bg-brand/5 dark:bg-brand/10'
                : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600'
            "
            @click="target = t.value"
          >
            <p class="text-[13px] font-semibold text-gray-900 dark:text-neutral-100">{{ t.label }}</p>
            <p class="text-[11px] text-gray-400 dark:text-neutral-500">
              {{ audienceCount(t.value) }} {{ audienceCount(t.value) === 1 ? 'user' : 'users' }}
            </p>
          </button>
        </div>
      </div>

      <!-- Message -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Message</label>
        <textarea
          v-model="message"
          rows="4"
          maxlength="500"
          placeholder="e.g. We've added flash deals — check the home feed!"
          class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <p class="mt-1 text-right text-[11px] text-gray-400">{{ message.length }}/500</p>
      </div>

      <!-- Preview -->
      <div v-if="message.trim()" class="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Preview</p>
        <div class="flex items-start gap-2.5">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
            <Icon name="solar:speaker-linear" size="16" class="text-brand" />
          </div>
          <p class="text-[13px] text-gray-800 dark:text-neutral-200">{{ message }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-neutral-800">
        <p class="text-[12px] text-gray-500 dark:text-neutral-400">
          Reaches <span class="font-semibold text-gray-900 dark:text-neutral-100">{{ audienceCount(target) }}</span>
          {{ audienceCount(target) === 1 ? 'user' : 'users' }}
        </p>
        <BaseButton
          variant="primary"
          :loading="sending"
          :disabled="sending || message.trim().length < 3"
          @click="send"
        >
          <Icon name="solar:plain-2-bold" size="15" /> Send announcement
        </BaseButton>
      </div>
    </div>

    <p class="text-[12px] text-gray-400 dark:text-neutral-500">
      Announcements appear in each user's notification inbox. Large audiences are
      delivered in the background over a few moments.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { notify } from '@kyvg/vue3-notification'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const TARGETS = [
  { value: 'all' as const, label: 'Everyone' },
  { value: 'sellers' as const, label: 'Sellers' },
  { value: 'buyers' as const, label: 'Buyers' },
]

const adminApi = useAdminApi()
const message = ref('')
const target = ref<'all' | 'sellers' | 'buyers'>('all')
const sending = ref(false)

// Client-only: admin auth (Bearer token) isn't available during SSR, so an SSR
// fetch would 401 and cache empty counts.
const { data: audienceData } = useAsyncData(
  'admin-broadcast-audience',
  () => adminApi.getBroadcastAudience(),
  { lazy: true, server: false },
)
const audience = computed(() => (audienceData.value as any)?.data ?? {})
function audienceCount(t: 'all' | 'sellers' | 'buyers') {
  return audience.value?.[t] ?? 0
}

async function send() {
  const text = message.value.trim()
  if (text.length < 3 || sending.value) return
  const count = audienceCount(target.value)
  if (!window.confirm(`Send this announcement to ${count} ${count === 1 ? 'user' : 'users'}?`)) return

  sending.value = true
  try {
    const res: any = await adminApi.sendBroadcast({ message: text, target: target.value })
    const n = res?.data?.targeted ?? count
    notify({ type: 'success', text: `Announcement sent to ${n} ${n === 1 ? 'user' : 'users'}.` })
    message.value = ''
  } catch {
    // BaseApiClient surfaces the error toast
  } finally {
    sending.value = false
  }
}
</script>
