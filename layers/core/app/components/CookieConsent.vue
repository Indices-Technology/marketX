<!--
  CookieConsent — asked only when there is genuinely something to ask about.

  Sign-in cookies are strictly necessary and are not up for a vote, so this never
  mentions them as if they were optional. It appears only when a tracker is
  actually configured (see useCookieConsent), and until it is answered nothing
  non-essential loads.

  Accept and Decline are the same size, weight and prominence: an interface where
  declining is harder than accepting isn't collecting consent, it's collecting
  fatigue.
-->
<template>
  <Transition name="consent">
    <div
      v-if="needsChoice"
      class="fixed inset-x-0 bottom-0 px-3 pb-3 sm:px-4 sm:pb-4"
      :style="{ zIndex: Z.toast }"
      role="dialog"
      aria-modal="false"
      :aria-label="'Cookie choices'"
    >
      <div
        class="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:gap-4 sm:p-5 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
      >
        <div class="min-w-0 flex-1">
          <p
            class="text-[14px] font-bold text-gray-900 sm:text-[15px] dark:text-white"
          >
            Can we measure our ads?
          </p>
          <p
            class="mt-1 text-[13px] leading-relaxed text-gray-600 dark:text-neutral-400"
          >
            We'd like to use Meta's tracker to see which ads bring people to
            MarketX. Nothing about your shopping is shared, and saying no
            changes nothing about how the site works. Signing in and checking
            out always use their own cookies — those aren't optional.
            <NuxtLink
              to="/privacy"
              class="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              How we handle your data
            </NuxtLink>
          </p>
        </div>

        <div class="flex shrink-0 gap-2">
          <BaseButton
            variant="secondary"
            size="md"
            class="flex-1 sm:flex-none"
            @click="onDecline"
          >
            No thanks
          </BaseButton>
          <BaseButton
            variant="primary"
            size="md"
            class="flex-1 sm:flex-none"
            @click="onAccept"
          >
            Allow
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { Z } from '~~/layers/ui/app/utils/zIndex'
import { useCookieConsent } from '~~/layers/core/app/composables/useCookieConsent'

const { needsChoice, accept, reject } = useCookieConsent()

const onAccept = () => accept()
const onDecline = () => reject()
</script>

<style scoped>
.consent-enter-active,
.consent-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.consent-enter-from,
.consent-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .consent-enter-active,
  .consent-leave-active {
    transition: none;
  }
}
</style>
