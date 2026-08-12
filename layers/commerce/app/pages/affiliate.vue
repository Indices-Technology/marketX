<!--
  /affiliate — the affiliate dashboard as a first-class route.

  Previously this surface existed ONLY as a tab inside /profile/[username],
  which meant nothing could link straight to it — not a notification, not the
  enrollment email, not the nav. The tab still works and renders the same
  AffiliateTab component; this route is the canonical, linkable home for it.
-->
<template>
  <HomeLayout :narrow-feed="false" :hide-right-sidebar="false">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-2 flex items-center gap-3 px-6">
        <NuxtLink
          to="/"
          class="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
          aria-label="Back to home"
        >
          <Icon name="solar:arrow-left-linear" size="22" />
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
          Affiliate
        </h1>
      </div>

      <AffiliateTab />
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import AffiliateTab from '~~/layers/profile/app/components/profile/tabs/AffiliateTab.vue'

definePageMeta({ middleware: 'auth' })
</script>
