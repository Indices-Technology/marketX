<template>
  <div
    id="app-root"
    class="min-h-screen bg-white text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtNotifications
      position="top right"
      :speed="400"
      :duration="4000"
      :max="4"
    />
    <ClientOnly>
      <UploadProgressBar />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import UploadProgressBar from '~~/layers/core/app/components/UploadProgressBar.vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useSettings } from '~~/layers/profile/app/composables/useSettings'
import { watch } from 'vue'
import { useColorMode } from '#imports'

const colorMode = useColorMode()
colorMode.preference = colorMode.preference || 'light'

const { defaults } = useSeo()
defaults()

// Re-apply text size + motion preference on app load
if (import.meta.client) {
  const { settings } = useSettings()
  watch(
    () => settings.value.textSize,
    (size) => {
      document.documentElement.classList.remove(
        'text-size-small',
        'text-size-large',
      )
      if (size !== 'medium')
        document.documentElement.classList.add(`text-size-${size}`)
    },
    { immediate: true },
  )
  watch(
    () => settings.value.reduceMotion,
    (reduce) => {
      document.documentElement.classList.toggle('reduce-motion', reduce)
    },
    { immediate: true },
  )
}
</script>

<style>
/* Notification theme styles */
:root {
  --vn-bg-color: #262626;
  --vn-border-color: #404040;
  --vn-text-color: #f5f5f5;
  --vn-success-color: #22c55e;
  --vn-error-color: #ef4444;
  --vn-warn-color: #f97316;
  --vn-info-color: #3b82f6;
}
html:not(.dark) {
  --vn-bg-color: #ffffff;
  --vn-border-color: #e5e7eb;
  --vn-text-color: #171717;
}

/* Notification container positioning */
.vue-notification-group {
  /* Mobile: below the fixed header */
  top: calc(3.5rem + env(safe-area-inset-top, 0px) + 8px) !important;
  z-index: 9999 !important;
}

/* Desktop: standard top margin */
@media (min-width: 768px) {
  .vue-notification-group {
    top: 12px !important;
  }
}

/* Notification card styling */
.vue-notification-wrapper {
  margin: 0 8px 6px !important;
}

.vue-notification {
  border-radius: 10px !important;
  font-size: 13px !important;
  padding: 10px 14px !important;
  border-left-width: 4px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Text size scaling */
html.text-size-small {
  font-size: 14px;
}
html.text-size-large {
  font-size: 18px;
}

/* Reduced motion — two independent triggers, same effect:
   1. html.reduce-motion  → the in-app "Reduce Motion" setting (profile settings)
   2. prefers-reduced-motion → the OS-level accessibility preference (always honored)
   Suppresses decorative animation only (pulsing dots, skeleton shimmer, bounces).
   Spinners on in-flight actions are kept — they communicate progress, not decoration. */
html.reduce-motion .animate-pulse,
html.reduce-motion .animate-bounce,
html.reduce-motion .animate-ping {
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-bounce,
  .animate-ping {
    animation: none;
  }
}

/* Subtle grain texture on dark surfaces */
html.dark #app-root::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
</style>
