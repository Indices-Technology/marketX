<!-- pages/index.vue — auth-aware entry point -->
<!-- Authenticated  → personalised social feed   (SocialFeed) -->
<!-- Unauthenticated → safe-commerce trust home  (TrustMarketHome) -->
<template>
  <HomeLayout :mode="profileStore.isLoggedIn ? 'feed' : 'market'">
    <ClientOnly>
      <Transition name="feed-swap" mode="out-in">
        <SocialFeed
          v-if="profileStore.isLoggedIn"
          key="social"
          :trust-spotlight="showTrust"
        />
        <TrustMarketHome
          v-else
          key="market"
          @sign-in="router.push('/user-login')"
        />
      </Transition>
      <!-- Fallback during SSR/hydration so the page isn't blank on first paint -->
      <template #fallback>
        <TrustMarketHome @sign-in="router.push('/user-login')" />
      </template>
    </ClientOnly>
  </HomeLayout>
</template>

<script setup lang="ts">
import { useRouter, useRuntimeConfig } from '#imports'

import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import SocialFeed from '~~/layers/feed/app/components/SocialFeed.vue'
import TrustMarketHome from '~~/layers/feed/app/components/TrustMarketHome.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

defineOptions({ name: 'FeedIndexPage' })

const router = useRouter()
const profileStore = useProfileStore()

// SocialFeed's trust-spotlight interleave stays gated to dev / demo builds so
// seeded reputation numbers never reach real production visitors. The logged-out
// home (TrustMarketHome) shows only real, self-hiding trust surfaces, so it
// needs no such gate.
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
