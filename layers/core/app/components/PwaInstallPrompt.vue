<!--
  PwaInstallPrompt — the app's only "add to home screen" surface.

  Two platforms, two mechanics, one banner:

    Chromium (Android, desktop Chrome/Edge)
      `beforeinstallprompt` is captured by the @vite-pwa/nuxt plugin, which
      exposes it as `$pwa.showInstallPrompt` + `$pwa.install()`. Without a
      component like this the event is captured and never used, so the only
      install path is the address-bar icon most users never notice.

    iOS Safari
      Fires no install event at all — installing is a manual Share ▸ Add to
      Home Screen. So iOS gets instructions instead of a button. This is the
      whole reason the component exists: on iOS there is otherwise no install
      path whatsoever.

  Both paths share one dismissal flag (`marketx:hide-install`, the key given to
  `pwa.client.installPrompt` in nuxt.config) so saying "not now" once is not
  asked again from the other code path.

  Restraint: never on the first visit, and never within the first few seconds —
  a nudge to install lands badly before the user has seen anything worth
  installing.
-->
<template>
  <Transition name="install-rise">
    <aside
      v-if="visible"
      class="fixed inset-x-3 bottom-0 z-40 mb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] rounded-2xl border border-gray-100 bg-white p-4 shadow-lg md:inset-x-auto md:bottom-6 md:right-6 md:mb-0 md:w-[22rem] dark:border-neutral-800 dark:bg-neutral-900"
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div class="flex items-start gap-3">
        <img
          src="/icons/icon-192.png"
          alt=""
          width="44"
          height="44"
          class="h-11 w-11 shrink-0 rounded-xl"
        />

        <div class="min-w-0 flex-1">
          <h2 id="pwa-install-title" class="t-heading">
            Add MarketX to your home screen
          </h2>
          <p class="t-body mt-1">
            Opens instantly, keeps working on a weak connection, and takes no
            app-store download.
          </p>
        </div>

        <button
          class="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-gray-900 dark:text-neutral-500 dark:hover:text-neutral-100"
          aria-label="Dismiss"
          @click="dismiss"
        >
          <Icon name="solar:close-circle-linear" size="20" />
        </button>
      </div>

      <!-- iOS has no programmatic install — show where the button lives. -->
      <ol v-if="mode === 'ios'" class="mt-4 space-y-2">
        <li class="t-body flex items-center gap-2.5">
          <Icon
            name="solar:export-linear"
            size="18"
            class="shrink-0 text-brand"
          />
          <span
            >Tap <strong class="ink-strong font-semibold">Share</strong> in the
            Safari toolbar</span
          >
        </li>
        <li class="t-body flex items-center gap-2.5">
          <Icon
            name="solar:add-square-linear"
            size="18"
            class="shrink-0 text-gray-400 dark:text-neutral-500"
          />
          <span
            >Choose
            <strong class="ink-strong font-semibold"
              >Add to Home Screen</strong
            ></span
          >
        </li>
      </ol>

      <div class="mt-4 flex items-center gap-2">
        <BaseButton
          v-if="mode === 'prompt'"
          variant="primary"
          size="sm"
          :loading="installing"
          @click="install"
        >
          Install
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="dismiss">
          {{ mode === 'ios' ? 'Got it' : 'Not now' }}
        </BaseButton>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useNuxtApp } from '#app'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

/** Shared with `pwa.client.installPrompt` in nuxt.config. */
const HIDE_KEY = 'marketx:hide-install'
const VISITS_KEY = 'marketx:visits'
/** Installing is a second-visit ask — the first visit has to earn it. */
const MIN_VISITS = 2
const SHOW_DELAY_MS = 8000

const { $pwa } = useNuxtApp()

const iosEligible = ref(false)
const dwellElapsed = ref(false)
const dismissed = ref(false)
const installing = ref(false)

const mode = computed<'prompt' | 'ios' | null>(() => {
  if (dismissed.value || !dwellElapsed.value) return null
  if ($pwa?.showInstallPrompt) return 'prompt'
  if (iosEligible.value) return 'ios'
  return null
})

const visible = computed(() => mode.value !== null && !$pwa?.isPWAInstalled)

let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (localStorage.getItem(HIDE_KEY) === 'true') {
    dismissed.value = true
    return
  }

  const visits = Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1
  localStorage.setItem(VISITS_KEY, String(visits))
  if (visits < MIN_VISITS) return

  const ua = navigator.userAgent
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    // iPadOS 13+ reports as a Mac; the touch points give it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  // Only real Safari can add to the home screen. Chrome/Firefox/Edge on iOS
  // and the in-app webviews (Instagram, Facebook, TikTok — a big slice of our
  // inbound traffic) cannot, so instructing them would be a dead end.
  const isSafari =
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line|OKApp/.test(ua)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // Legacy iOS flag — still the only reliable signal in older Safari.
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  iosEligible.value = isIOS && isSafari && !isStandalone

  timer = setTimeout(() => (dwellElapsed.value = true), SHOW_DELAY_MS)
})

onUnmounted(() => clearTimeout(timer))

const install = async () => {
  installing.value = true
  try {
    await $pwa?.install()
  } finally {
    installing.value = false
  }
}

const dismiss = () => {
  dismissed.value = true
  // Chromium path: lets the plugin drop its deferred event and persist the flag.
  // iOS path: the plugin has no event to cancel, so write the flag directly.
  if ($pwa?.cancelInstall) $pwa.cancelInstall()
  localStorage.setItem(HIDE_KEY, 'true')
}
</script>

<style scoped>
.install-rise-enter-active,
.install-rise-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.install-rise-enter-from,
.install-rise-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
