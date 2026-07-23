<!-- pages/index.vue — auth-aware entry point -->
<!-- Authenticated  → personalised social feed  (SocialFeed) -->
<!-- Unauthenticated → commerce-first market home (MarketHome) -->
<template>
  <!-- Trust homepage is full-width so the hero breathes; when the trust surface
       is gated off (prod, no real data yet) it falls back to the original home. -->
  <HomeLayout :mode="profileStore.isLoggedIn ? 'feed' : 'market'">
    <ClientOnly>
      <Transition name="feed-swap" mode="out-in">
        <SocialFeed
          v-if="profileStore.isLoggedIn"
          key="social"
          :trust-spotlight="showTrust"
        />
        <MarketHome
          v-else
          key="market"
          :trust-spotlight="showTrust"
          @sign-in="router.push('/user-login')"
        />
      </Transition>
      <!-- Fallback shown during SSR/hydration — render MarketHome so page isn't blank on first paint -->
      <template #fallback>
        <MarketHome
          :trust-spotlight="showTrust"
          @sign-in="router.push('/user-login')"
        />
      </template>
    </ClientOnly>
  </HomeLayout>
</template>

<script setup lang="ts">
import { useRouter, useRuntimeConfig } from '#imports'

import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import SocialFeed from '~~/layers/feed/app/components/SocialFeed.vue'
import MarketHome from '~~/layers/feed/app/components/MarketHome.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

defineOptions({ name: 'FeedIndexPage' })

const router = useRouter()
const profileStore = useProfileStore()

// Trust surface shows only where its (currently placeholder) data is acceptable:
// always in dev, and in prod only when explicitly enabled for a demo build.
// Keeps seeded reputation numbers away from real production visitors.
const showTrust = import.meta.dev || useRuntimeConfig().public.trustPreview

useSeo().setHomePage()
</script>

<style>
.feed-swap-enter-active,
.feed-swap-leave-active {
  transition: opacity 0.2s ease;
}
.feed-swap-enter-from,
.feed-swap-leave-to {
  opacity: 0;
}
</style>
