<!-- layers/auth/pages/forgot-password.vue -->
<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- Full-screen Background -->
    <div class="absolute inset-0 z-0">
      <img
        src="https://voguesg.s3.ap-southeast-1.amazonaws.com/wp-content/uploads/2023/11/01191916/Nigeria-story-image-7.jpg"
        alt="Vibrant Nigerian fashion group in colorful Ankara and modern outfits"
        class="h-full w-full object-cover object-center brightness-[0.78] contrast-[1.08] saturate-[1.15]"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/45 to-black/30"
      />
    </div>

    <!-- Main Content – centered glassmorphism card -->
    <div
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 md:py-12 lg:px-8"
    >
      <div
        class="fade-in bg-white/88 dark:bg-neutral-900/82 w-full max-w-md rounded-2xl p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:max-w-lg md:p-10 lg:max-w-md dark:shadow-black/40"
      >
        <!-- Header & Motivational Copy -->
        <div class="mb-7 text-center">
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
          >
            Forgot Password?
          </h1>
          <p
            class="mt-2.5 text-base leading-relaxed text-gray-700 dark:text-gray-300"
          >
            No worries — enter your email and we'll send a reset link so you can
            get back to discovering styles & shopping your vibe
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="error && !submitted"
          class="mb-6 rounded-xl border border-red-200/80 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/25 dark:text-red-300"
        >
          {{ error }}
        </div>

        <!-- Form or Success State -->
        <div v-if="!submitted" class="space-y-6">
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Email Input -->
            <BaseInput
              v-model="form.email"
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
              {{ isLoading ? 'Sending reset link...' : 'Send Reset Link' }}
            </BaseButton>
          </form>

          <!-- Info Box -->
          <div
            class="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 text-xs text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-300"
          >
            <div class="flex gap-3">
              <Icon
                name="solar:info-circle-bold"
                class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
              />
              <p>
                Reset link expires in 24 hours. Check spam/junk if you don't see
                it soon.
              </p>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="space-y-6">
          <div
            class="rounded-xl border border-green-200/80 bg-green-50/70 p-5 text-sm dark:border-green-800/40 dark:bg-green-950/25"
          >
            <div class="flex gap-3">
              <Icon
                name="solar:check-circle-bold"
                class="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400"
              />
              <div>
                <h3 class="font-semibold text-green-900 dark:text-green-300">
                  Check your inbox
                </h3>
                <p class="mt-1.5 text-gray-800 dark:text-gray-300">
                  We've sent a password reset link to
                  <strong>{{ form.email }}</strong
                  >.
                  <br class="sm:hidden" />
                  Check your inbox (and spam folder) — it should arrive shortly.
                </p>
              </div>
            </div>
          </div>

          <!-- Resend Button -->
          <BaseButton
            type="button"
            variant="secondary"
            size="lg"
            class="w-full"
            :loading="isLoading"
            :disabled="isLoading"
            @click="handleSendAgain"
          >
            {{ isLoading ? 'Sending again...' : 'Send Link Again' }}
          </BaseButton>
        </div>

        <!-- Footer Links -->
        <div
          class="mt-8 space-y-2 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>
            Remember your password?
            <NuxtLink
              to="/user-login"
              class="font-semibold text-brand transition hover:text-brand/80"
            >
              Sign in
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
import { reactive, ref, computed } from 'vue'
import { definePageMeta } from '#imports'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useAuth } from '../composables/useAuth'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

useSeo().setPrivatePage('Forgot Password')

const {
  requestPasswordReset: authRequestReset,
  isLoading: authLoading,
  error: authError,
} = useAuth()

const submitted = ref(false)

const form = reactive({
  email: '',
})

const errors = reactive({
  email: '',
})

const isLoading = computed(() => authLoading.value)
const error = computed(() => authError.value)

const validateForm = () => {
  errors.email = ''

  if (!form.email.trim()) {
    errors.email = 'Email is required'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    await authRequestReset(form.email.trim())
    submitted.value = true
  } catch (err) {
    console.error('Password reset request failed:', err)
  }
}

const handleSendAgain = () => {
  submitted.value = false
  form.email = '' // Optional: clear for fresh input, or keep it
  // You could also add a cooldown / rate-limit message if needed
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
