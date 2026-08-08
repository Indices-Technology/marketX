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
    :snap-hero="useHeroSibling"
    :use-custom-search="!useHeroSibling"
  >
    <ClientOnly>
      <template v-if="useHeroSibling">
        <HomeHero :dense="!isDesktop" />
        <SocialFeed
          v-if="profileStore.isLoggedIn"
          :trust-spotlight="showTrust"
        />
        <GuestFeedPreview v-else />
      </template>
      <MinimalHome v-else />
      <!-- Fallback during SSR/hydration so the page isn't blank on first paint.
           A lightweight placeholder, NOT a second live feed instance —
           mounting two real instances back-to-back raced clicks on the
           fallback's button against the swap to the post-hydration instance,
           silently dropping them (e.g. the search/verify sheet not opening). -->
      <template #fallback>
        <div
          class="fixed inset-0 z-0 flex items-center justify-center bg-black"
        >
          <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"
          />
        </div>
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

// SocialFeed's trust-spotlight interleave stays gated to dev / demo builds so
// seeded reputation numbers never reach real production visitors.
const showTrust = import.meta.dev || useRuntimeConfig().public.trustPreview

useSeo().setHomePage()
</script>
