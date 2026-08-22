<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <!-- ─── HERO ───────────────────────────────────────────────────────── -->
      <header class="mb-16 max-w-3xl">
        <p class="t-eyebrow mb-3">About {{ siteName }}</p>
        <h1 class="t-display mb-5 text-4xl sm:text-5xl">
          Online trade in Nigeria has a trust problem, not a traffic problem.
        </h1>
        <p class="t-body ink-soft text-base leading-relaxed sm:text-lg">
          There is no shortage of people selling, or people who want to buy. The
          thing that stops a transaction is simpler and older than any of it:
          the buyer does not want to send money first, and the seller does not
          want to ship first.
        </p>
      </header>

      <!-- ─── THE MECHANISM ──────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-3">What we actually do</h2>
        <p class="t-body ink-soft mb-8 max-w-2xl">
          {{ siteName }} stands between the two sides and holds the money until
          the goods arrive. That is the whole product. Everything else on the
          platform exists to make that moment happen more often.
        </p>

        <ol class="space-y-6">
          <li v-for="(step, i) in steps" :key="step.title" class="flex gap-4">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
              >{{ i + 1 }}</span
            >
            <div class="pt-0.5">
              <h3 class="t-heading mb-1.5">{{ step.title }}</h3>
              <p class="t-body ink-soft max-w-2xl">{{ step.body }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- ─── REPUTATION ─────────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-3">Every completed order leaves a record</h2>
        <div class="grid gap-6 md:grid-cols-2">
          <p class="t-body ink-soft">
            A seller who has delivered two hundred orders and settled every
            dispute has earned something, and until now it lived nowhere. It
            could not be shown to a new buyer, carried to another platform, or
            taken to a lender.
          </p>
          <p class="t-body ink-soft">
            We keep that record. Verification status, completed deliveries,
            disputes and how they ended — computed from real orders, never
            seeded. It is what lets a buyer who has never heard of a seller
            decide to send them money anyway.
          </p>
        </div>
      </section>

      <!-- ─── SOCIAL ─────────────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-3">Why it looks like a feed</h2>
        <p class="t-body ink-soft max-w-2xl">
          Because that is where Nigerian commerce already happens. Sellers post,
          buyers reply, deals get done in DMs — and then the money part is
          improvised, which is where it goes wrong. We kept the part that works
          and replaced the part that does not. Posts, reels and stores sit on
          top of a settlement rail instead of a bank transfer and a prayer.
        </p>
      </section>

      <!-- ─── HONEST STATUS ──────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-1">Where we are</h2>
        <p class="t-body ink-soft mb-6 max-w-2xl">
          We would rather be accurate about this than impressive.
        </p>
        <ul class="divide-y divide-gray-100 dark:divide-neutral-800">
          <li
            v-for="row in status"
            :key="row.label"
            class="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
          >
            <span
              class="w-20 shrink-0 text-xs font-bold uppercase tracking-wider"
              :class="
                row.live
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : 'text-gray-400 dark:text-neutral-500'
              "
              >{{ row.live ? 'Live' : 'Building' }}</span
            >
            <span class="t-subheading">{{ row.label }}</span>
            <span class="t-body ink-soft w-full sm:w-auto sm:flex-1">{{
              row.detail
            }}</span>
          </li>
        </ul>
      </section>

      <!-- ─── COMPANY ────────────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-3">Who builds this</h2>
        <p class="t-body ink-soft mb-6 max-w-2xl">
          {{ siteName }} is a product of
          <a
            :href="companyUrl"
            target="_blank"
            rel="noopener"
            class="font-semibold text-brand hover:underline"
            >{{ companyName }}</a
          >, a software company registered in Nigeria<template v-if="companyRc">
            (RC {{ companyRc }})</template
          >. We are the counterparty on every escrow order, which means the
          registered entity behind this site is not a footnote — it is who you
          are trusting.
        </p>
        <NuxtLink
          to="/contact"
          class="t-body inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
        >
          Company details and how to reach us
          <Icon name="solar:arrow-right-linear" size="16" />
        </NuxtLink>
      </section>

      <!-- ─── CTA ────────────────────────────────────────────────────────── -->
      <section
        class="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <h2 class="t-title mb-2">Start on either side</h2>
        <p class="t-body ink-soft mb-6 max-w-xl">
          Buy something and see how the escrow window works, or open a store and
          start building a record.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <BaseButton variant="primary" size="lg" @click="goSell">
            Open your store
          </BaseButton>
          <BaseButton variant="secondary" size="lg" @click="goShop">
            Start shopping
          </BaseButton>
        </div>
      </section>
    </div>

    <SiteFooter />

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { navigateTo, useRuntimeConfig } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'
import SiteFooter from '~~/layers/core/app/components/SiteFooter.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

useSeo().setAboutPage()

const config = useRuntimeConfig()
const siteName = (config.public.siteName as string) || 'MarketX'
const companyName = config.public.companyName as string
const companyUrl = config.public.companyUrl as string
const companyRc = config.public.companyRc as string

const steps = [
  {
    title: 'The buyer pays us, not the seller',
    body: 'Money enters escrow at checkout. The seller can see it is there and start preparing, but cannot touch it.',
  },
  {
    title: 'The seller ships against a real commitment',
    body: 'They are not shipping on faith. The funds are committed, which is what makes it reasonable to send the goods first.',
  },
  {
    title: 'Delivery releases the money',
    body: 'The buyer confirms receipt and the seller is paid. If nobody responds, funds release automatically 7 days after dispatch.',
  },
  {
    title: 'A dispute stops the clock',
    body: 'Raised inside the window, the money is still ours to hold. An agent reviews the evidence from both sides and decides where it goes.',
  },
]

// Deliberately includes what is NOT live. A public page that claims shipped
// features the platform does not have is the fastest way to lose the trust the
// whole product is built on.
const status = [
  {
    live: true,
    label: 'Escrow settlement',
    detail: 'Every order. Auto-release, disputes and reversals all running.',
  },
  {
    live: true,
    label: 'Seller verification',
    detail: 'Identity and CAC checks, with a public verified status.',
  },
  {
    live: true,
    label: 'Reputation record',
    detail: 'Computed from real orders, reviews and dispute outcomes.',
  },
  {
    live: true,
    label: 'Squares',
    detail: 'Markets and trade associations onboard members as a group.',
  },
  {
    live: false,
    label: 'Carrier integration',
    detail:
      'Sellers arrange their own delivery today. Carrier booking inside checkout is in progress.',
  },
  {
    live: false,
    label: 'Public API',
    detail: 'Waitlist open on the partners page. Not generally available yet.',
  },
]

const goSell = () => navigateTo('/sellers/create')
const goShop = () => navigateTo('/discover')
</script>
