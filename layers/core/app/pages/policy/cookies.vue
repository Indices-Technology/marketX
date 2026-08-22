<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <header class="mb-10">
        <p class="t-eyebrow mb-2">Legal</p>
        <h1 class="t-display mb-3">Cookie Policy</h1>
        <p class="t-meta">Last updated {{ lastUpdated }}</p>
      </header>

      <div class="space-y-10">
        <section>
          <h2 class="t-title mb-3">What cookies we use</h2>
          <p class="t-body mb-4">
            A cookie is a small file your browser stores when you visit
            {{ siteName }}. We also use local storage, which works the same way
            for our purposes. This page covers both.
          </p>
          <p class="t-body">
            We group them into three kinds. Only the first is on by default, and
            only the first is required for the site to work.
          </p>
        </section>

        <section
          v-for="group in groups"
          :key="group.title"
          class="rounded-2xl border border-gray-100 p-5 sm:p-6 dark:border-neutral-800"
        >
          <div class="mb-3 flex flex-wrap items-center gap-3">
            <h2 class="t-heading">{{ group.title }}</h2>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
              :class="
                group.required
                  ? 'bg-gray-200 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
                  : 'bg-brand/10 text-brand'
              "
              >{{ group.required ? 'Always on' : 'Your choice' }}</span
            >
          </div>
          <p class="t-body ink-soft mb-4">{{ group.summary }}</p>
          <ul class="space-y-2">
            <li
              v-for="item in group.items"
              :key="item.name"
              class="flex flex-col gap-0.5 border-t border-gray-100 pt-2 first:border-0 first:pt-0 dark:border-neutral-800"
            >
              <p class="t-subheading">{{ item.name }}</p>
              <p class="t-body ink-soft">{{ item.purpose }}</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="t-title mb-3">Controlling cookies</h2>
          <p class="t-body mb-4">
            The banner you saw on your first visit sets your choice for the
            optional groups. You can change it at any time from your browser
            settings, where you can also delete cookies already stored.
          </p>
          <p class="t-body">
            Blocking essential cookies will sign you out and break checkout —
            the cart and the escrow flow both depend on knowing who you are
            between page loads.
          </p>
        </section>

        <section>
          <h2 class="t-title mb-3">Questions</h2>
          <p class="t-body">
            Write to
            <a
              :href="mailto(privacyEmail)"
              class="font-semibold text-brand hover:underline"
              >{{ privacyEmail }}</a
            >, or read the full
            <NuxtLink
              to="/privacy"
              class="font-semibold text-brand hover:underline"
              >Privacy Policy</NuxtLink
            >. {{ siteName }} is operated by {{ companyName
            }}<template v-if="companyRc">, RC {{ companyRc }}</template
            >.
          </p>
        </section>
      </div>
    </div>

    <SiteFooter />

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'
import SiteFooter from '~~/layers/core/app/components/SiteFooter.vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

useSeo().setCookiePolicyPage()

const config = useRuntimeConfig()
const siteName = (config.public.siteName as string) || 'MarketX'
const privacyEmail = config.public.privacyEmail as string
const companyName = config.public.companyName as string
const companyRc = config.public.companyRc as string

const mailto = (address: string) => 'mailto:' + address

// Hardcoded, not new Date() — a policy's "last updated" must change when the
// policy changes, never on every page render.
const lastUpdated = '22 August 2026'

const groups = [
  {
    title: 'Essential',
    required: true,
    summary:
      'Needed for the site to function. Without these you cannot sign in, hold a cart, or complete a checkout.',
    items: [
      {
        name: 'Session and refresh tokens',
        purpose:
          'Keeps you signed in between page loads and refreshes your session securely.',
      },
      {
        name: 'CSRF token',
        purpose:
          'Proves a request came from you and not another site acting in your name.',
      },
      {
        name: 'Cart',
        purpose:
          'Remembers what you added before you signed in, so it survives to checkout.',
      },
      {
        name: 'Cookie choice',
        purpose:
          'Records the answer you gave the consent banner, so we stop asking.',
      },
    ],
  },
  {
    title: 'Preferences',
    required: false,
    summary:
      'Remember how you like the app set up. Turning these off costs you convenience, nothing more.',
    items: [
      {
        name: 'Theme',
        purpose: 'Keeps light or dark mode as you set it.',
      },
      {
        name: 'Locale and currency',
        purpose: 'Shows prices and dates in the format you picked.',
      },
      {
        name: 'Recently viewed',
        purpose: 'Powers the "continue where you left off" rails.',
      },
    ],
  },
  {
    title: 'Analytics and marketing',
    required: false,
    summary:
      'Tell us which pages and campaigns actually work. Off unless you accept them, and off entirely when no campaign is running.',
    items: [
      {
        name: 'Product analytics',
        purpose:
          'Aggregate counts of page and product views. Used to decide what to build, not to profile you.',
      },
      {
        name: 'Attribution links',
        purpose:
          'Credits the seller or sharer whose link brought you to a product.',
      },
      {
        name: 'Meta Pixel',
        purpose:
          'Measures ad campaigns. Loads only when a campaign is live — it is unset by default.',
      },
    ],
  },
]
</script>
