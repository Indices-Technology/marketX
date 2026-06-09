<template>
  <!-- Drop-in menu item: place inside any existing three-dot dropdown -->
  <button
    @click="open = true"
    class="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
  >
    <Icon name="mdi:flag-outline" size="16" />
    Report
  </button>

  <BaseModal v-model="open" :title="`Report ${contentTypeLabel}`" max-width="sm">
    <div class="space-y-4">
      <p class="text-[12px] text-gray-400 dark:text-neutral-500">Why are you reporting this?</p>

      <div class="space-y-1.5">
        <button
          v-for="reason in REASONS"
          :key="reason.value"
          @click="selectedReason = reason.value"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-colors text-left',
            selectedReason === reason.value
              ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
              : 'border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-gray-200 dark:hover:border-neutral-700',
          ]"
        >
          <Icon :name="reason.icon" size="16" />
          {{ reason.label }}
        </button>
      </div>

      <textarea
        v-if="selectedReason"
        v-model="note"
        rows="2"
        placeholder="Add more context (optional)..."
        class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
      />

      <div v-if="submitted" class="flex items-center gap-2 text-[13px] text-green-600 dark:text-green-400">
        <Icon name="mdi:check-circle-outline" size="18" />
        Report submitted. Thank you.
      </div>
      <div v-else class="flex gap-2">
        <BaseButton @click="open = false" variant="secondary" size="sm" class="flex-1">
          Cancel
        </BaseButton>
        <BaseButton
          @click="submit"
          variant="danger"
          size="sm"
          class="flex-1"
          :loading="submitting"
          :disabled="!selectedReason || submitting"
        >
          {{ submitting ? 'Sending...' : 'Submit Report' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'

const props = defineProps<{
  contentType: 'POST' | 'PRODUCT' | 'COMMENT' | 'REVIEW' | 'SELLER_REVIEW' | 'USER' | 'STORY'
  contentId: string
}>()

const open = ref(false)
const selectedReason = ref('')
const note = ref('')
const submitting = ref(false)
const submitted = ref(false)
const adminApi = useAdminApi()

const REASONS = [
  { value: 'SPAM', label: 'Spam or misleading', icon: 'mdi:email-alert-outline' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content', icon: 'mdi:eye-off-outline' },
  { value: 'COUNTERFEIT', label: 'Counterfeit or fake product', icon: 'mdi:tag-off-outline' },
  { value: 'HARASSMENT', label: 'Harassment or bullying', icon: 'mdi:account-alert-outline' },
  { value: 'MISINFORMATION', label: 'False information', icon: 'mdi:information-off-outline' },
  { value: 'VIOLENCE', label: 'Violence or dangerous', icon: 'mdi:shield-alert-outline' },
  { value: 'OTHER', label: 'Something else', icon: 'mdi:dots-horizontal-circle-outline' },
]

const contentTypeLabel = computed(() => {
  const map: Record<string, string> = {
    POST: 'post', PRODUCT: 'product', COMMENT: 'comment',
    REVIEW: 'review', SELLER_REVIEW: 'review', USER: 'account', STORY: 'story',
  }
  return map[props.contentType] ?? 'content'
})

async function submit() {
  submitting.value = true
  try {
    await adminApi.submitReport({
      contentType: props.contentType,
      contentId: props.contentId,
      reason: selectedReason.value,
      note: note.value || undefined,
    })
    submitted.value = true
    setTimeout(() => { open.value = false; submitted.value = false }, 1800)
  } catch {
  } finally {
    submitting.value = false
  }
}

watch(open, (v) => {
  if (!v) { selectedReason.value = ''; note.value = '' }
})
</script>
