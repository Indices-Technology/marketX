<!-- pages/index.vue — auth-aware, viewport-aware entry point -->
<!-- Hero-then-content applies whenever real SocialFeed.vue (or its guest
     counterpart, GuestFeedPreview) is what's rendering: always on desktop,
     and on mobile only when the user's feedDisplayStyle=detailed opt-in is
     active. SocialFeed.vue itself is never modified/wrapped/gated — the hero
     sits above it as a plain sibling, snap-scrolled via HomeLayout. -->
<!-- The only case NOT using that sibling-hero mechanism: mobile +
     feedDisplayStyle=minimal (the default) → MinimalHome, which carries its
     own hero as the first slide of its internal snap-scroll instead. -->
<template>
  <HomeLayout
    :mode="useHeroSibling ? 'wide' : undefined"
    :hide-right-sidebar="false"
    :custom-padding="true"
    :immersive="!useHeroSibling"
    :snap-hero="showHero"
    :use-custom-search="!useHeroSibling"
  >
    <ClientOnly>
      <template v-if="useHeroSibling">
        <!-- Landing hero is a first-impression surface: it answers "what is
             MarketX?" for someone who hasn't signed up. A signed-in user has
             already answered that, so making them scroll past a marketing
             page to reach their own feed is friction, not onboarding. -->
        <HomeHero v-if="showHero" :dense="!isDesktop" />
        <SocialFeed
          v-if="profileStore.isLoggedIn"
          :trust-spotlight="showTrust"
        />
        <GuestFeedPreview v-else />
      </template>
      <MinimalHome v-else />
      <!-- Fallback during SSR/hydration so the page isn't blank on first paint.
           SplashScreen, not a bare spinner: the branded splash is what every
           other boot path already shows (SocialFeed renders it while its feed
           loads), so a black screen with a lone spinner here made a refresh
           flash unbranded chrome before the real splash appeared.
           Still a lightweight placeholder, NOT a second live feed instance —
           mounting two real instances back-to-back raced clicks on the
           fallback's button against the swap to the post-hydration instance,
           silently dropping them (e.g. the search/verify sheet not opening).
           SplashScreen is purely presentational (no buttons, no stores), so
           it cannot reintroduce that race. -->
      <template #fallback>
        <SplashScreen />
      </template>
    </ClientOnly>
  </HomeLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import SocialFeed from '~~/layers/feed/app/components/SocialFeed.vue'
import MinimalHome from '~~/layers/feed/app/components/MinimalHome.vue'
import HomeHero from '~~/layers/feed/app/components/HomeHero.vue'
import SplashScreen from '~~/layers/feed/app/components/SplashScreen.vue'
import GuestFeedPreview from '~~/layers/feed/app/components/GuestFeedPreview.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSettings } from '~~/layers/profile/app/composables/useSettings'
import { useViewport } from '~~/layers/core/app/composables/useViewport'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

defineOptions({ name: 'FeedIndexPage' })

const profileStore = useProfileStore()
const { settings } = useSettings()
const { isDesktop } = useViewport()

// "Detailed" is a mobile opt-in (default is minimal for everyone, guests
// included). Desktop ignores the setting entirely and always uses the hero +
// SocialFeed/GuestFeedPreview pattern — see project memory "Feed/nav pivot
// decision" for why minimal is the default and detailed survives as an
// escape hatch, not the other way round.
const showDetailed = computed(
  () =>
    profileStore.isLoggedIn && settings.value.feedDisplayStyle === 'detailed',
)
const useHeroSibling = computed(() => isDesktop.value || showDetailed.value)
// Hero is for guests only — see the template comment. This also switches off
// HomeLayout's snap-hero (scroll-snap + the scroll-threshold nav hiding),
// which exists purely to serve the hero and would otherwise leave the feed
// snapping against a section that no longer renders.
const showHero = computed(
  () => useHeroSibling.value && !profileStore.isLoggedIn,
)

// SocialFeed's trust-spotlight interleave stays gated to dev / demo builds so
// seeded reputation numbers never reach real production visitors.
const showTrust = import.meta.dev || useRuntimeConfig().public.trustPreview

useSeo().setHomePage()
</script>
