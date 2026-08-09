<!-- layers/auth/pages/resend-verification.vue -->
<template>
  <!-- Plain surface, no background image and no glass — matches the rest
       of the auth flow. -->
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-950">
    <!-- Main Content – centered glassmorphism card -->
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
        class="fade-in w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:max-w-lg md:p-10 lg:max-w-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Header & Motivational Copy -->
        <div class="mb-7 text-center">
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
          >
            Verify Your Email
          </h1>
          <p
            class="mt-2.5 text-base leading-relaxed text-gray-700 dark:text-gray-300"
          >
            One quick step before you can start sharing your style, following
            creators, and shopping the latest vibes on
            {{ $config.public.siteName || 'MarketX' }}
          </p>
        </div>

        <!-- Status / Info Messages -->
        <div v-if="verificationState === 'sent'" class="mb-6 space-y-4">
          <div
            class="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950/40"
          >
            <div class="flex gap-3">
              <Icon
                name="solar:check-circle-bold"
                class="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400"
              />
              <div>
                <h3
                  class="text-base font-semibold text-green-900 dark:text-green-300"
                >
                  Verification email sent!
                </h3>
                <p class="mt-1.5 text-sm text-green-800 dark:text-green-300">
                  We've sent a link to <strong>{{ email }}</strong
                  >.<br />
                  Check your inbox (and spam/junk folder). Link expires in 24
                  hours.
                </p>
              </div>
            </div>
          </div>

          <!-- Back to Login -->
          <BaseButton
            to="/user-login"
            tag="NuxtLink"
            variant="secondary"
            size="lg"
            class="w-full"
          >
            Back to Login
          </BaseButton>

          <!-- Resend to different email -->
          <BaseButton
            type="button"
            variant="ghost"
            class="w-full"
            @click="resetForm"
          >
            Resend to a different email
          </BaseButton>
        </div>

        <!-- Pending state info (before sending) -->
        <div
          v-else-if="verificationState === 'pending' && email"
          class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
        >
          <div class="flex gap-3">
            <Icon
              name="solar:info-circle-bold"
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            />
            <p>
              We sent a verification email earlier, but if you haven't received
              it yet or need a new one, enter your email below.
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </div>

        <!-- Resend Form (shown when not yet sent in this session) -->
        <form
          v-if="verificationState !== 'sent'"
          class="space-y-5"
          @submit.prevent="handleResend"
        >
          <!-- Email -->
          <BaseInput
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="Your email address"
            :disabled="isLoading"
            icon-left="solar:letter-linear"
            size="lg"
            :error="errors.email"
          />

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            size="lg"
            class="w-full"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{
              isLoading
                ? 'Sending verification email...'
                : 'Send Verification Email'
            }}
          </BaseButton>
        </form>

        <!-- Tip Box -->
        <div
          class="mt-6 rounded-xl border border-yellow-200/70 bg-yellow-50/60 p-4 text-xs text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-950/20 dark:text-yellow-300"
        >
          <div class="flex gap-3">
            <Icon
              name="solar:lightbulb-bold"
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
            />
            <p>
              <strong>Quick tip:</strong> After clicking the link in your email,
              you'll be able to log in and start exploring trends right away.
            </p>
          </div>
        </div>

        <!-- Footer Links -->
        <div
          class="mt-8 space-y-2 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>
            Already verified?
            <NuxtLink
              to="/user-login"
              class="font-semibold text-brand transition hover:text-brand/80"
            >
              Log in
            </NuxtLink>
          </p>
          <p>
            New to {{ $config.public.siteName || 'MarketX' }}?
            <NuxtLink
              to="/user-register"
              class="font-semibold text-brand transition hover:text-brand/80"
            >
              Create an account
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { definePageMeta } from '#imports'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

useSeo().setPrivatePage('Resend Verification')

const route = useRoute()

const {
  resendVerificationEmail,
  isLoading: authLoading,
  error: authError,
} = useAuth()

type VerificationState = 'pending' | 'sent'

const email = ref('')
const verificationState = ref<VerificationState>('pending')

const errors = reactive({
  email: '',
})

const isLoading = computed(() => authLoading.value)
const error = computed(() => authError.value)

const validateEmail = () => {
  errors.email = ''

  if (!email.value.trim()) {
    errors.email = 'Email is required'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Please enter a valid email'
    return false
  }

  return true
}

const handleResend = async () => {
  if (!validateEmail()) return

  try {
    await resendVerificationEmail(email.value.trim())
    verificationState.value = 'sent'
  } catch (err) {
    console.error('Resend verification error:', err)
  }
}

const resetForm = () => {
  email.value = ''
  verificationState.value = 'pending'
  errors.email = ''
}

onMounted(() => {
  // Pre-fill from query param if coming from registration flow, etc.
  const queryEmail = route.query.email as string
  if (queryEmail) {
    email.value = queryEmail
  }
})
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
