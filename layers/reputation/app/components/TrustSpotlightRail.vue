<!--
  TrustSpotlightRail — top-seller trust cards interleaved into the home feed
  (framework §5.4). Interleaves the same way FeedProductShelf does. Sellers earn
  a slot through verified commerce, never followers; the rail self-hides when it
  has nothing to show, so it never leaves a dead header.
-->
<template>
  <section v-if="loading || sellers.length">
    <div class="mb-3 flex items-end justify-between px-1">
      <div>
        <p class="mb-1 text-xs font-bold uppercase tracking-widest text-brand">
          Reputation you can't buy
        </p>
        <h2
          class="font-display text-lg font-bold leading-tight text-gray-900 dark:text-white"
        >
          Trusted this week
        </h2>
        <p class="mt-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
          Ranked by verified sales — not follower counts
        </p>
      </div>
      <NuxtLink
        to="/discover?tab=sellers"
        class="mb-0.5 shrink-0 text-xs font-semibold text-gray-400 hover:text-brand dark:text-neutral-500"
      >
        See all →
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div
      v-if="loading && !sellers.length"
      class="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
      style="contain: strict; height: 244px"
    >
      <BaseSkeleton
        v-for="i in 4"
        :key="i"
        shape="block"
        width="272px"
        height="236px"
        rounded="rounded-2xl"
        class="shrink-0"
      />
    </div>

    <!-- Rail -->
    <div v-else class="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-1">
      <TrustCard v-for="seller in sellers" :key="seller.id" :seller="seller" />

      <!-- tail: the seller's own prompt -->
      <NuxtLink
        to="/sellers/create"
        class="flex w-[150px] shrink-0 snap-start flex-col justify-center gap-2 rounded-2xl border border-dashed border-gray-200 p-4 text-left transition hover:border-brand/40 dark:border-neutral-700"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-brand dark:bg-neutral-800"
        >
          <Icon name="solar:add-circle-linear" size="18" />
        </span>
        <div>
          <p class="text-[13px] font-bold text-gray-900 dark:text-neutral-100">
            Build your Trust Card
          </p>
          <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
            Every clean sale moves you up this rail.
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import TrustCard from '~~/layers/reputation/app/components/TrustCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import { useTrustSpotlight } from '~~/layers/reputation/app/composables/useTrustSpotlight'

const { sellers, loading, load } = useTrustSpotlight()

onMounted(load)
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
