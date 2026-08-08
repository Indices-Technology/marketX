<!-- One-time full-screen slide woven into MinimalHome's feed — gives Squares
     visible presence in the scroll without gating the whole feed behind it.
     Squares also has its own permanent nav tab (/squares) for anyone who
     wants to go straight there. -->
<template>
  <div
    class="flex h-[100dvh] w-full flex-col justify-center gap-5 bg-gradient-to-b from-neutral-900 to-black px-5 py-10"
  >
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-brand">
        Local markets, online
      </p>
      <h2 class="mt-1 text-2xl font-black text-white">Step into a Square</h2>
      <p class="mt-1 text-sm text-white/60">
        Communities of traders organised the way Nigeria's physical markets
        work.
      </p>
    </div>

    <div
      v-if="squares.length"
      class="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto px-5 pb-1"
    >
      <SquareCard
        v-for="sq in squares"
        :key="sq.id"
        :square="sq"
        variant="spotlight"
      />
    </div>
    <div
      v-else
      class="flex h-[224px] items-center justify-center rounded-2xl border border-dashed border-white/15"
    >
      <p class="text-sm text-white/40">
        Markets are being set up — check back soon.
      </p>
    </div>

    <NuxtLink
      to="/squares"
      class="mt-2 inline-flex w-max items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black shadow-xl transition-transform active:scale-95"
    >
      Explore all Squares
      <Icon name="solar:arrow-right-linear" size="15" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import type { MarketSquare } from '~~/layers/square/app/components/SquareCard.vue'

defineProps<{ squares: MarketSquare[] }>()
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
