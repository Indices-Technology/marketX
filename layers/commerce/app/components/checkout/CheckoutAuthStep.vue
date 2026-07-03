<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="mb-5 flex items-center gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10"
      >
        <Icon name="mdi:account-circle-outline" size="20" class="text-brand" />
      </div>
      <div>
        <p class="font-semibold text-gray-900 dark:text-neutral-100">
          {{ otpSent ? 'Enter your verification code' : "Who's buying?" }}
        </p>
        <p class="text-xs text-gray-400 dark:text-neutral-500">
          {{
            otpSent
              ? `We sent a 6-digit code to ${authForm.email}`
              : "We'll create an account for you automatically if you're new."
          }}
        </p>
      </div>
    </div>

    <!-- Step 1: email + name + phone -->
    <template v-if="!otpSent">
      <div class="space-y-3">
        <BaseInput
          v-model="authForm.email"
          type="email"
          placeholder="Email address"
          @keydown.enter="handleSendOtp"
        />
        <BaseInput
          v-model="authForm.name"
          placeholder="Full name (for your order)"
        />
        <BaseInput
          v-model="authForm.phone"
          type="tel"
          placeholder="Phone number (optional)"
        />
      </div>
      <p v-if="authError" class="mt-3 text-xs text-red-500">{{ authError }}</p>
      <BaseButton
        class="mt-4 w-full"
        :loading="authLoading"
        :disabled="authLoading || !authForm.email"
        @click="handleSendOtp"
      >
        Continue
      </BaseButton>
    </template>

    <!-- Step 2: OTP entry -->
    <template v-else>
      <div class="space-y-3">
        <input
          v-model="otpCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="6-digit code"
          class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
          @keydown.enter="handleVerifyOtp"
        />
      </div>
      <p v-if="authError" class="mt-3 text-xs text-red-500">{{ authError }}</p>
      <BaseButton
        class="mt-4 w-full"
        :loading="authLoading"
        :disabled="authLoading || otpCode.length !== 6"
        @click="handleVerifyOtp"
      >
        Verify & Continue
      </BaseButton>
      <button
        class="mt-2 w-full text-center text-xs text-gray-400 hover:text-brand dark:text-neutral-500"
        @click="resetOtp"
      >
        ← Change email
      </button>
      <button
        :disabled="authLoading"
        class="mt-1 w-full text-center text-xs text-gray-400 hover:text-brand disabled:opacity-50 dark:text-neutral-500"
        @click="handleSendOtp"
      >
        Resend code
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthApi } from '~~/layers/core/app/services/auth.api'
import { useAuthStore } from '~~/layers/core/app/stores/auth.store'
import { useAuth } from '~~/layers/core/app/composables/useAuth'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import { notify } from '@kyvg/vue3-notification'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

const emit = defineEmits<{
  authenticated: [payload: { name: string; isNewUser: boolean }]
}>()

const authStore = useAuthStore()
const { syncUserToProfile } = useAuth()
const { syncGuestCartToServer } = useCart()

const authForm = reactive({ email: '', name: '', phone: '' })
const otpCode = ref('')
const otpSent = ref(false)
const authLoading = ref(false)
const authError = ref('')

const resetOtp = () => {
  otpSent.value = false
  otpCode.value = ''
  authError.value = ''
}

const handleSendOtp = async () => {
  authError.value = ''
  if (!authForm.email) {
    authError.value = 'Please enter your email'
    return
  }
  authLoading.value = true
  try {
    await useAuthApi().sendCheckoutOtp({
      email: authForm.email,
      name: authForm.name,
      phone: authForm.phone,
    })
    otpSent.value = true
  } catch (e: unknown) {
    authError.value = extractErrorMessage(e, 'Failed to send code. Try again.')
  } finally {
    authLoading.value = false
  }
}

const handleVerifyOtp = async () => {
  authError.value = ''
  if (otpCode.value.length !== 6) {
    authError.value = 'Enter the 6-digit code'
    return
  }
  authLoading.value = true
  try {
    const res = await useAuthApi().verifyCheckoutOtp({
      email: authForm.email,
      code: otpCode.value,
      name: authForm.name,
      phone: authForm.phone,
    })
    authStore.setAccessToken(res.accessToken)
    authStore.setRefreshToken(res.refreshToken)
    await syncUserToProfile(res.user)
    await syncGuestCartToServer().catch(() => {})

    if (res.isNewUser) {
      notify({
        type: 'success',
        text: 'Account created! A password setup link was sent to your email.',
      })
    }

    emit('authenticated', { name: authForm.name, isNewUser: res.isNewUser })
  } catch (e: unknown) {
    authError.value = extractErrorMessage(
      e,
      'Invalid or expired code. Try again.',
    )
  } finally {
    authLoading.value = false
  }
}
</script>
