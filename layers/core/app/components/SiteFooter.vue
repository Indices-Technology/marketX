<!--
  SiteFooter — the standing footer for the public/marketing surfaces (about,
  contact, partners, help, legal). Deliberately NOT rendered inside HomeLayout:
  the feed is an infinite scroll, so a footer there is unreachable, which is why
  RightSideNavLinks carries those links in the sidebar instead.

  This is the only place the operating company is stated in the chrome, so the
  legal identity block is not decoration — it's the thing that makes the site
  attributable.
-->
<template>
  <footer
    class="border-t border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-950"
  >
    <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <!-- Brand + company -->
        <div>
          <p class="t-heading mb-2">{{ siteName }}</p>
          <p class="t-body ink-soft mb-4 max-w-xs">
            The trust rail for Nigerian commerce. Escrow-backed orders, verified
            sellers, and a reputation that follows you.
          </p>
          <p class="t-meta">
            A product of
            <a
              :href="companyUrl"
              target="_blank"
              rel="noopener"
              class="font-semibold text-gray-600 underline-offset-2 hover:text-brand hover:underline dark:text-neutral-400"
              >{{ companyName }}</a
            >
          </p>
        </div>

        <div v-for="col in columns" :key="col.title">
          <p class="t-label mb-3 uppercase tracking-wider">{{ col.title }}</p>
          <ul class="space-y-2">
            <li v-for="link in col.links" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="t-body ink-soft transition-colors hover:text-brand"
                >{{ link.label }}</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div>

      <!-- ─── Legal identity ─────────────────────────────────────────────── -->
      <div class="mt-10 border-t border-gray-100 pt-6 dark:border-neutral-800">
        <p class="t-meta mb-1">
          {{ siteName }} is operated by {{ companyName
          }}<template v-if="companyRc">, RC {{ companyRc }}</template
          >, a private company limited by shares registered in Nigeria.
        </p>
        <p v-if="companyAddress" class="t-meta mb-4">
          Registered office: {{ companyAddress }}
        </p>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="t-meta">
            © {{ new Date().getFullYear() }} {{ companyName }}. All rights
            reserved.
          </p>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <NuxtLink
              v-for="link in legalLinks"
              :key="link.to"
              :to="link.to"
              class="t-meta transition-colors hover:text-brand"
              >{{ link.label }}</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

const siteName = (config.public.siteName as string) || 'MarketX'
const companyName =
  (config.public.companyName as string) || 'Indices Technology LTD'
const companyUrl =
  (config.public.companyUrl as string) || 'https://indicestech.com'
const companyRc = config.public.companyRc as string
const companyAddress = config.public.companyAddress as string

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'Discover', to: '/discover' },
      { label: 'Reels', to: '/reels' },
      { label: 'Sellers', to: '/sellers' },
      { label: 'Squares', to: '/square' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Open a store', to: '/sellers/create' },
      { label: 'Seller guide', to: '/help/sellers' },
      { label: 'Partnerships', to: '/partners' },
      { label: 'API waitlist', to: '/partners#api' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Help centre', to: '/help' },
      { label: 'Support', to: '/support' },
    ],
  },
]

const legalLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Cookies', to: '/policy/cookies' },
  { label: 'Data deletion', to: '/data-deletion' },
]
</script>
