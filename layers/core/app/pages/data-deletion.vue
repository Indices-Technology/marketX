<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-3xl px-4 py-12 pb-24 sm:px-6 lg:px-8">
      <div class="mb-8 border-b border-gray-200 pb-6 dark:border-neutral-800">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-neutral-100">
          Data Deletion
        </h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-neutral-400">
          Status of your request to delete data obtained via Facebook Login
        </p>
      </div>

      <div
        class="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300"
      >
        <!-- Request received (arrived here from Facebook's callback) -->
        <div
          v-if="code"
          class="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 class="mb-2 text-lg font-bold text-gray-900 dark:text-neutral-100">
            Request received
          </h2>
          <p class="mb-3">
            We've received your request to delete the data
            <strong>{{ config.public.siteName || 'MarketX' }}</strong> obtained
            through Facebook. It has been logged and will be processed by our team.
          </p>
          <p class="text-gray-600 dark:text-neutral-400">
            Your confirmation code:
            <span
              class="rounded bg-gray-200 px-2 py-0.5 font-mono text-gray-900 dark:bg-neutral-800 dark:text-neutral-100"
              >{{ code }}</span
            >
          </p>
          <p class="mt-3 text-gray-600 dark:text-neutral-400">
            Keep this code for your records. If you'd like an update on the status
            of your request, email us the code at
            <a
              :href="`mailto:${supportEmail}?subject=${encodeURIComponent(
                'Data deletion request ' + code,
              )}`"
              class="font-medium text-brand hover:underline"
              >{{ supportEmail }}</a
            >.
          </p>
        </div>

        <!-- Landed here without a code — explain how to request deletion -->
        <div v-else>
          <p class="mb-4">
            This page confirms the status of requests to delete the personal data
            <strong>{{ config.public.siteName || 'MarketX' }}</strong> obtained
            through Facebook Login (your name, email, and profile picture).
          </p>
          <h2
            class="mb-3 text-xl font-bold text-gray-900 dark:text-neutral-100"
          >
            How to request deletion
          </h2>
          <p class="mb-3">
            You can remove <strong>{{ config.public.siteName || 'MarketX' }}</strong>
            from your Facebook account at any time under
            <em>Facebook → Settings &amp; privacy → Settings → Apps and Websites</em>,
            which sends us a deletion request automatically.
          </p>
          <p>
            You can also request deletion directly by emailing
            <a
              :href="`mailto:${supportEmail}?subject=${encodeURIComponent(
                'Data deletion request',
              )}`"
              class="font-medium text-brand hover:underline"
              >{{ supportEmail }}</a
            >
            with the subject "Data deletion request". We'll confirm once your data
            has been deleted.
          </p>
        </div>
      </div>
    </div>

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'

const config = useRuntimeConfig()
const route = useRoute()

const code = computed(() =>
  typeof route.query.code === 'string' ? route.query.code : '',
)
const supportEmail = computed(
  () => config.public.supportEmail || 'privacy@marketx.africa',
)

useSeoMeta({
  title: `Data Deletion · ${config.public.siteName || 'MarketX'}`,
  description: `Request or check the status of deleting your data from ${config.public.siteName || 'MarketX'}.`,
})
</script>
