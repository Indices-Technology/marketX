<template>
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-950">
    <div
      class="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 md:py-12 lg:px-8"
    >
      <!-- Brand — identical lockup, size and link on every auth screen. -->
      <NuxtLink
        to="/"
        class="mb-8 flex justify-center"
        aria-label="MarketX home"
      >
        <BrandLogo variant="full" class="h-10 w-auto" />
      </NuxtLink>

      <div
        class="fade-in w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:max-w-lg md:p-10 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Header -->
        <div class="mb-7 text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10"
          >
            <Icon
              name="simple-icons:whatsapp"
              size="24"
              class="text-[#25D366]"
            />
          </div>
          <p
            class="mb-2 text-xs font-bold uppercase tracking-widest text-brand"
          >
            {{ otpSent ? 'Verify your number' : 'Continue with WhatsApp' }}
          </p>
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
          >
            {{ otpSent ? 'Enter your code' : 'Sign in with your phone' }}
          </h1>
          <p
            class="mt-2.5 text-base leading-relaxed text-gray-700 dark:text-gray-300"
          >
            {{
              otpSent
                ? `We sent a 6-digit code to ${phone} on WhatsApp.`
                : "We'll text a code to your WhatsApp — no password needed."
            }}
          </p>
        </div>

        <!-- Alerts -->
        <div
          v-if="error"
          class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </div>

        <!-- Step 1: phone entry -->
        <template v-if="!otpSent">
          <form class="space-y-5" @submit.prevent="handleSendOtp">
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
              type="submit"
              size="lg"
              class="w-full"
              :loading="isLoading"
              :disabled="isLoading || !phone"
            >
              Send code
            </BaseButton>
          </form>
        </template>

        <!-- Step 2: code entry -->
        <template v-else>
          <div class="space-y-5">
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="6-digit code"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              @keydown.enter="handleVerifyOtp"
            />
            <BaseButton
              size="lg"
              class="w-full"
              :loading="isLoading"
              :disabled="isLoading || code.length !== 6"
              @click="handleVerifyOtp"
            >
              Verify &amp; continue
            </BaseButton>
            <div class="flex items-center justify-between text-xs">
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
          </div>
        </template>

        <!-- Footer Links -->
        <div class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Prefer email?
            <NuxtLink
              to="/user-login"
              class="font-semibold text-brand transition hover:text-brand/80"
            >
              Sign in with email
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
import { ref } from 'vue'
import { definePageMeta, navigateTo, useRoute } from '#imports'
import { useAuthApi } from '~~/layers/core/app/services/auth.api'
import { useAuthStore } from '~~/layers/core/app/stores/auth.store'
import { useAuth } from '~~/layers/core/app/composables/useAuth'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

const route = useRoute()
const authStore = useAuthStore()
const { syncUserToProfile, notifyWelcome } = useAuth()

// Arrived from the seller "I want to Sell" path (?intent=seller) — after
// verifying, drop back into user-register.vue's store-setup step instead of
// home, so phone signup doesn't strand a seller with a bare account and no store.
const intent = typeof route.query.intent === 'string' ? route.query.intent : ''

const phone = ref('')
const code = ref('')
const otpSent = ref(false)
const isLoading = ref(false)
const error = ref('')

const resetOtp = () => {
  otpSent.value = false
  code.value = ''
  error.value = ''
}

const handleSendOtp = async () => {
  error.value = ''
  if (!phone.value) {
    error.value = 'Enter your phone number'
    return
  }
  isLoading.value = true
  try {
    await useAuthApi().sendPhoneOtp(phone.value.trim())
    otpSent.value = true
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Failed to send code. Try again.')
  } finally {
    isLoading.value = false
  }
}

const handleVerifyOtp = async () => {
  error.value = ''
  if (code.value.length !== 6) {
    error.value = 'Enter the 6-digit code'
    return
  }
  isLoading.value = true
  try {
    const res = await useAuthApi().verifyPhoneOtp(
      phone.value.trim(),
      code.value,
    )
    authStore.setAccessToken(res.accessToken)
    authStore.setRefreshToken(res.refreshToken)
    await syncUserToProfile(res.user)
    notifyWelcome()
    await navigateTo(intent === 'seller' ? '/user-register?step=2' : '/')
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Invalid or expired code. Try again.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-in {
  animation: fadeInUp 0.55s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
