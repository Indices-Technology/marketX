<template>
  <BaseModal
    :model-value="modelValue"
    title="Verify your phone"
    max-width="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      v-if="error"
      class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
    >
      {{ error }}
    </div>

    <!-- Step 1: phone entry -->
    <template v-if="!otpSent">
      <p class="mb-4 text-[13px] text-gray-500 dark:text-neutral-400">
        We'll WhatsApp a 6-digit code to confirm this number. Once verified,
        it's the phone MarketX uses for order alerts and sign-in.
      </p>
      <BaseInput
        v-model="phone"
        type="tel"
        autocomplete="tel"
        :disabled="isLoading"
        placeholder="0803 123 4567"
        icon-left="solar:phone-linear"
        size="lg"
        @keydown.enter="handleSendOtp"
      />
      <BaseButton
        class="mt-4 w-full"
        size="lg"
        :loading="isLoading"
        :disabled="isLoading || !phone"
        @click="handleSendOtp"
      >
        Send code
      </BaseButton>
    </template>

    <!-- Step 2: code entry -->
    <template v-else>
      <p class="mb-4 text-[13px] text-gray-500 dark:text-neutral-400">
        Enter the 6-digit code sent to {{ phone }} on WhatsApp.
      </p>
      <input
        v-model="code"
        type="text"
        inputmode="numeric"
        maxlength="6"
        placeholder="6-digit code"
        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        @keydown.enter="handleVerify"
      />
      <BaseButton
        class="mt-4 w-full"
        size="lg"
        :loading="isLoading"
        :disabled="isLoading || code.length !== 6"
        @click="handleVerify"
      >
        Verify
      </BaseButton>
      <div class="mt-3 flex items-center justify-between text-xs">
        <button
          type="button"
          class="text-gray-400 transition hover:text-brand dark:text-neutral-500"
          @click="resetOtp"
        >
          ← Change number
        </button>
        <button
          type="button"
          :disabled="isLoading"
          class="text-gray-400 transition hover:text-brand disabled:opacity-50 dark:text-neutral-500"
          @click="handleSendOtp"
        >
          Resend code
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useAuthApi } from '~~/layers/core/app/services/auth.api'
import { useAuth } from '~~/layers/core/app/composables/useAuth'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import { validatePhone } from '~~/shared/utils/phone'

const props = defineProps<{
  modelValue: boolean
  initialPhone?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  verified: [phone: string]
}>()

const { syncUserToProfile } = useAuth()
const authApi = useAuthApi()

const phone = ref(props.initialPhone ?? '')
const code = ref('')
const otpSent = ref(false)
const isLoading = ref(false)
const error = ref('')

// Reset to a clean step-1 state every time the modal is (re)opened, seeded
// with whatever phone the caller wants verified (e.g. a settings field).
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    phone.value = props.initialPhone ?? ''
    code.value = ''
    otpSent.value = false
    error.value = ''
  },
)

const resetOtp = () => {
  otpSent.value = false
  code.value = ''
  error.value = ''
}

const handleSendOtp = async () => {
  error.value = ''
  if (!phone.value.trim()) {
    error.value = 'Enter your phone number'
    return
  }
  const validationError = validatePhone(phone.value)
  if (validationError) {
    error.value = validationError
    return
  }
  isLoading.value = true
  try {
    await authApi.sendPhoneOtp(phone.value.trim())
    otpSent.value = true
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Failed to send code. Try again.')
  } finally {
    isLoading.value = false
  }
}

const handleVerify = async () => {
  error.value = ''
  if (code.value.length !== 6) {
    error.value = 'Enter the 6-digit code'
    return
  }
  isLoading.value = true
  try {
    const res = await authApi.verifyPhoneAttach(phone.value.trim(), code.value)
    await syncUserToProfile()
    notify({
      type: 'success',
      text: 'Phone verified — WhatsApp alerts are now on.',
    })
    emit('verified', res.phone)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Invalid or expired code. Try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
