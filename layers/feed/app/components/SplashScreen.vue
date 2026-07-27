<template>
  <div
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950"
  >
    <div class="relative flex items-center justify-center">
      <!-- Breathing halo — kept from the original splash: a soft blurred glow
           that swells, plus a radar ping, framing the full "mx." mark. -->
      <div
        class="animate-mx-breathe absolute h-28 w-40 rounded-full bg-brand/20 blur-2xl"
      />
      <div class="absolute h-24 w-24 animate-ping rounded-full bg-brand/25" />

      <!-- Full MarketX "mx." mark — circle m + x + coral dot -->
      <BrandLogo variant="mark" class="relative z-10 h-14 w-24" />
    </div>

    <h1
      class="mt-6 text-lg font-black uppercase tracking-[0.25em] text-gray-900 dark:text-white"
    >
      {{ $config.public.siteName || 'MARKETX' }}
    </h1>

    <p
      class="absolute bottom-8 text-[11px] font-medium tracking-wide text-gray-400 dark:text-neutral-600"
    >
      Powered by
      <span class="font-semibold text-gray-500 dark:text-neutral-500"
        >Indices Technology</span
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
</script>

<style scoped>
/* Soft "breathing" — gently swells and fades. Paired with the Tailwind
   animate-ping radar pulse behind the mark. */
@keyframes mx-breathe {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.85;
  }
}
.animate-mx-breathe {
  animation: mx-breathe 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-mx-breathe,
  .animate-ping {
    animation: none;
  }
}
</style>
