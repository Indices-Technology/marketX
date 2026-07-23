<template>
  <div
    class="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 antialiased selection:bg-brand/20"
  >
    <!-- ── Nav ─────────────────────────────────────────────── -->
    <nav
      class="fixed z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl"
    >
      <div
        class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5"
      >
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand shadow-sm shadow-brand/25"
          >
            <span class="text-sm font-black italic text-white">MX</span>
          </div>
          <span
            class="font-display text-lg font-bold tracking-tight text-slate-900"
            >MarketX<span class="text-brand">.</span></span
          >
        </NuxtLink>

        <div class="hidden items-center gap-9 lg:flex">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >{{ link.label }}</a
          >
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/user-login"
            class="hidden text-[13px] font-semibold text-slate-600 transition-colors hover:text-brand sm:block"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/user-register"
            class="rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand"
          >
            Get started
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- ── Hero ──────────────────────────────────────────────── -->
    <section class="relative overflow-hidden px-5 pb-24 pt-36 sm:pt-40">
      <!-- soft ambient wash -->
      <div
        class="pointer-events-none absolute -right-40 -top-24 h-[32rem] w-[32rem] rounded-full bg-brand/5 blur-3xl"
      ></div>

      <div
        class="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2"
      >
        <!-- Left copy -->
        <div class="space-y-8">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600 shadow-sm"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
            The trust rail for African commerce — by Indices
          </div>

          <h1
            class="font-display text-5xl font-bold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.25rem]"
          >
            See it.
            <span class="text-brand">Trust it.</span>
            Buy it.
          </h1>

          <p class="max-w-md text-lg leading-relaxed text-slate-500">
            Your money is held safely until you confirm delivery — and every
            seller's reputation is earned from real, completed sales,
            <span class="font-semibold text-slate-900"
              >not followers you can buy.</span
            >
          </p>

          <div class="flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              to="/discover"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
            >
              Shop protected
              <Icon name="solar:arrow-right-linear" size="18" />
            </NuxtLink>
            <a
              href="#trust"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-700 transition-all hover:border-slate-300 hover:text-brand"
            >
              How trust works
            </a>
          </div>

          <!-- Trust pillars -->
          <div class="flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-100 pt-7">
            <div
              v-for="pillar in trustPillars"
              :key="pillar.word"
              class="flex items-center gap-2.5"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/8 text-brand"
              >
                <Icon :name="pillar.icon" size="18" />
              </span>
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ pillar.word }}
                </p>
                <p class="text-xs text-slate-400">{{ pillar.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: phone mockup showing a Trust Profile -->
        <div class="relative flex justify-center lg:justify-end">
          <div
            class="relative h-[560px] w-[288px] overflow-hidden rounded-[2.75rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20"
          >
            <div class="absolute inset-0 overflow-hidden bg-white">
              <!-- Notch -->
              <div class="flex h-7 items-center justify-center bg-white">
                <div class="h-5 w-24 rounded-b-2xl bg-slate-900"></div>
              </div>

              <!-- Trust profile header -->
              <div class="bg-slate-900 px-5 pb-5 pt-3 text-white">
                <div class="mb-3 flex items-center justify-between">
                  <span
                    class="rounded-md bg-white/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-white/60"
                    >Trust Profile</span
                  >
                  <span class="font-mono text-[9px] font-semibold text-brand-light"
                    >MX-PL-04KT</span
                  >
                </div>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-base font-black italic"
                  >
                    CP
                  </div>
                  <div>
                    <p class="font-display text-sm font-bold leading-tight">
                      Chinedu Phones
                    </p>
                    <p
                      class="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-emerald-400"
                    >
                      <Icon name="solar:verified-check-bold" size="11" />
                      Identity &amp; shop verified
                    </p>
                  </div>
                </div>
                <p class="mt-2.5 text-[9px] leading-relaxed text-white/50">
                  Member, Hamaz Phone Dealers Assoc. — chairman-attested since 2020
                </p>
              </div>

              <!-- Dimension bars -->
              <div class="space-y-3 px-5 py-4">
                <div
                  v-for="dim in trustCardDims"
                  :key="dim.label"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-[9px] font-semibold uppercase tracking-widest text-slate-400"
                      >{{ dim.label }}</span
                    >
                    <span class="text-[9px] font-semibold text-slate-700">{{
                      dim.fact
                    }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full"
                      :class="dim.tone"
                      :style="{ width: dim.pct }"
                    ></div>
                  </div>
                </div>

                <div
                  class="flex items-center justify-between pt-1 text-[9px] font-medium text-slate-400"
                >
                  <span class="uppercase tracking-widest">Financial</span>
                  <span>Not provided</span>
                </div>
              </div>

              <!-- Protected pay CTA -->
              <div class="px-5">
                <div
                  class="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[11px] font-semibold text-white shadow-md shadow-brand/25"
                >
                  <Icon name="solar:lock-keyhole-minimalistic-bold" size="13" />
                  Pay this seller protected
                </div>
                <p
                  class="mt-2 text-center text-[8px] leading-relaxed text-slate-400"
                >
                  We hold your money until you confirm the item arrived.
                </p>
              </div>
            </div>
          </div>

          <!-- Floating: escrow held -->
          <div
            class="animate-float absolute -left-6 top-6 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/5 sm:block"
          >
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/8 text-brand"
              >
                <Icon name="solar:lock-keyhole-minimalistic-linear" size="16" />
              </span>
              <div>
                <p class="text-[11px] font-semibold text-slate-900">
                  ₦48,000 held
                </p>
                <p class="text-[9px] text-slate-400">Released on delivery</p>
              </div>
            </div>
          </div>

          <!-- Floating: delivery confirmed -->
          <div
            class="animate-float-delayed absolute -right-6 bottom-24 hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-xl sm:block"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-emerald-400">
                <Icon name="solar:check-circle-bold" size="20" />
              </span>
              <div>
                <p class="text-[11px] font-semibold text-white">
                  Delivery confirmed
                </p>
                <p class="text-[9px] text-slate-400">
                  Seller paid · +1 protected sale
                </p>
              </div>
            </div>
          </div>

          <!-- Floating: attestation -->
          <div
            class="animate-float absolute -left-8 bottom-40 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/5 xl:block"
            style="animation-delay: 2.5s"
          >
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                <Icon name="solar:buildings-2-linear" size="16" />
              </span>
              <div>
                <p class="text-[11px] font-semibold text-slate-900">
                  Chairman attested
                </p>
                <p class="text-[9px] text-slate-400">Hamaz Dealers Assoc.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Partner marquee ────────────────────────────────────── -->
    <div class="border-y border-slate-200/70 bg-slate-50/60 py-8">
      <p
        class="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
      >
        Payments, logistics &amp; verification partners
      </p>
      <div class="overflow-hidden">
        <div class="marquee-track flex items-center whitespace-nowrap">
          <span
            v-for="brand in trustItems"
            :key="brand"
            class="shrink-0 px-8 text-sm font-bold uppercase tracking-widest text-slate-300"
            >{{ brand }}</span
          >
          <span
            v-for="brand in trustItems"
            :key="'r' + brand"
            class="shrink-0 px-8 text-sm font-bold uppercase tracking-widest text-slate-300"
            >{{ brand }}</span
          >
        </div>
      </div>
    </div>

    <!-- ── Reputation / Trust explainer ───────────────────────── -->
    <section id="trust" class="px-5 py-28">
      <div class="mx-auto max-w-7xl">
        <div class="mb-16 max-w-2xl space-y-4">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand"
          >
            Reputation you can't buy
          </p>
          <h2
            class="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.75rem] sm:leading-[1.1]"
          >
            A million followers can't outrank one verified sale.
          </h2>
          <p class="text-lg leading-relaxed text-slate-500">
            A seller's standing is built from evidence, not noise. Real,
            completed sales weigh the most. Followers and likes are shown — but
            capped, by design, so they can never dominate. Faking it costs real
            money, so almost nobody does.
          </p>
        </div>

        <div class="grid gap-5 lg:grid-cols-3">
          <div
            v-for="tier in trustTiers"
            :key="tier.title"
            class="rounded-2xl border border-slate-200/80 bg-white p-7 transition-shadow hover:shadow-lg hover:shadow-slate-900/5"
          >
            <div class="mb-5 flex items-center justify-between">
              <span
                class="flex h-11 w-11 items-center justify-center rounded-xl"
                :class="tier.chip"
              >
                <Icon :name="tier.icon" size="22" />
              </span>
              <span
                class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
                :class="tier.badge"
                >{{ tier.tier }}</span
              >
            </div>
            <h3
              class="mb-2 font-display text-xl font-bold tracking-tight text-slate-900"
            >
              {{ tier.title }}
            </h3>
            <p class="mb-5 text-sm leading-relaxed text-slate-500">
              {{ tier.desc }}
            </p>
            <ul class="space-y-2.5 border-t border-slate-100 pt-5">
              <li
                v-for="item in tier.items"
                :key="item"
                class="flex items-start gap-2.5 text-[13px] text-slate-600"
              >
                <Icon
                  name="solar:check-circle-linear"
                  size="16"
                  class="mt-0.5 shrink-0 text-brand"
                />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>

        <p
          class="mx-auto mt-10 max-w-3xl text-center text-sm text-slate-400"
        >
          Every number on a trust profile is computed from a signed,
          append-only record of what actually happened — auditable, and
          impossible to quietly edit away.
        </p>
      </div>
    </section>

    <!-- ── How protected payments work ────────────────────────── -->
    <section
      id="how"
      class="border-y border-slate-200/70 bg-slate-50/60 px-5 py-28"
    >
      <div class="mx-auto max-w-5xl">
        <div class="mb-16 space-y-4 text-center">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand"
          >
            Nobody gets burned
          </p>
          <h2
            class="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.5rem]"
          >
            How a protected payment works
          </h2>
        </div>

        <div class="relative grid gap-8 sm:grid-cols-3">
          <div
            class="absolute left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] top-8 z-0 hidden border-t border-dashed border-slate-300 sm:block"
          ></div>

          <div
            v-for="(step, i) in howSteps"
            :key="step.title"
            class="relative z-10 text-center"
          >
            <div
              class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-brand shadow-sm"
            >
              <Icon :name="step.icon" size="26" />
            </div>
            <p
              class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400"
            >
              Step 0{{ i + 1 }}
            </p>
            <h3 class="mb-2 font-display text-lg font-bold text-slate-900">
              {{ step.title }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-500">
              {{ step.desc }}
            </p>
          </div>
        </div>

        <div class="mt-14 text-center">
          <NuxtLink
            to="/discover"
            class="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
          >
            Find a seller to trust
            <Icon name="solar:arrow-right-linear" size="18" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Features ───────────────────────────────────────────── -->
    <section class="px-5 py-28">
      <div class="mx-auto max-w-7xl">
        <div class="mb-16 space-y-4 text-center">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand"
          >
            Built on the rail
          </p>
          <h2
            class="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.5rem]"
          >
            Everything hangs off trust
          </h2>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feat in features"
            :key="feat.title"
            class="group rounded-2xl border border-slate-200/80 bg-white p-7 transition-all hover:border-brand/25 hover:shadow-lg hover:shadow-slate-900/5"
          >
            <div
              class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/8 text-brand transition-colors group-hover:bg-brand group-hover:text-white"
            >
              <Icon :name="feat.icon" size="22" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-slate-900">
              {{ feat.title }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-500">
              {{ feat.desc }}
            </p>
          </div>

          <NuxtLink
            to="/sellers/create"
            class="group relative overflow-hidden rounded-2xl bg-slate-900 p-7 transition-all hover:shadow-xl"
          >
            <div
              class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/15 blur-2xl"
            ></div>
            <div
              class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white"
            >
              <Icon name="solar:shop-2-linear" size="22" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-white">
              Start building yours
            </h3>
            <p class="text-sm leading-relaxed text-slate-400">
              Open a free store, make your first protected sale, and start
              stacking a reputation buyers — and one day, lenders — can read.
            </p>
            <p
              class="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-brand-light"
            >
              Open your store
              <Icon name="solar:arrow-right-linear" size="15" />
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Sellers CTA ─────────────────────────────────────────── -->
    <section
      id="sellers"
      class="relative overflow-hidden bg-slate-900 px-5 py-28 text-white"
    >
      <div
        class="pointer-events-none absolute -right-40 -top-20 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-3xl"
      ></div>

      <div class="relative z-10 mx-auto max-w-5xl">
        <div class="grid items-center gap-16 lg:grid-cols-2">
          <div class="space-y-7">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-light"
            >
              For sellers &amp; traders
            </p>
            <h2
              class="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-[2.75rem]"
            >
              Your reputation is your
              <span class="text-brand-light">biggest asset.</span>
            </h2>
            <p class="text-lg leading-relaxed text-slate-400">
              Every clean, completed sale strengthens your Trust Profile — a
              verifiable track record you carry with a QR code on your card,
              your parcels, your bio. Build it high enough and it unlocks bigger
              orders, better terms, and eventually, credit.
            </p>
            <div class="flex flex-col gap-3 sm:flex-row">
              <NuxtLink
                to="/sellers/create"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-dark"
              >
                Open your store — it's free
              </NuxtLink>
              <NuxtLink
                to="/sellers"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:border-brand hover:text-brand-light"
              >
                See trusted sellers
              </NuxtLink>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2.5">
            <div
              v-for="feat in sellerFeatures"
              :key="feat"
              class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-brand/30"
            >
              <Icon
                name="solar:check-circle-linear"
                size="18"
                class="shrink-0 text-brand-light"
              />
              <span class="text-sm text-slate-300">{{ feat }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ───────────────────────────────────────────── -->
    <section class="px-5 py-28 text-center">
      <div class="mx-auto max-w-2xl space-y-7">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"
        >
          <Icon name="solar:lock-keyhole-minimalistic-linear" size="26" />
        </div>
        <h2
          class="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.5rem] sm:leading-[1.1]"
        >
          Commerce you don't have to worry about.
        </h2>
        <p class="text-lg leading-relaxed text-slate-500">
          Pay protected. Buy from people whose reputation is real. Sell and
          build a track record that's yours to keep.
        </p>
        <div
          class="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <NuxtLink
            to="/discover"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-9 py-4 text-[15px] font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark sm:w-auto"
          >
            Shop protected
            <Icon name="solar:arrow-right-linear" size="18" />
          </NuxtLink>
          <NuxtLink
            to="/user-register"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-8 py-4 text-[15px] font-semibold text-slate-700 transition-all hover:border-brand hover:text-brand sm:w-auto"
          >
            Create free account
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <footer class="border-t border-slate-200/70 bg-white px-5 py-14">
      <div class="mx-auto max-w-7xl">
        <div class="mb-12 grid gap-10 sm:grid-cols-3">
          <div class="space-y-4">
            <div class="flex items-center gap-2.5">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-black italic text-white shadow-sm shadow-brand/25"
              >
                MX
              </div>
              <span
                class="font-display text-base font-bold tracking-tight text-slate-900"
                >MarketX</span
              >
            </div>
            <p class="max-w-xs text-sm leading-relaxed text-slate-400">
              The trust rail for African commerce. Pay protected. Trade trusted.
            </p>
          </div>

          <div>
            <p
              class="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Shop
            </p>
            <div class="flex flex-col gap-2.5">
              <NuxtLink
                v-for="l in footerShop"
                :key="l.to"
                :to="l.to"
                class="text-sm text-slate-500 transition-colors hover:text-brand"
                >{{ l.label }}</NuxtLink
              >
            </div>
          </div>

          <div>
            <p
              class="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Company
            </p>
            <div class="flex flex-col gap-2.5">
              <NuxtLink
                v-for="l in footerCompany"
                :key="l.to"
                :to="l.to"
                class="text-sm text-slate-500 transition-colors hover:text-brand"
                >{{ l.label }}</NuxtLink
              >
            </div>
          </div>
        </div>

        <div
          class="flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 sm:flex-row"
        >
          <span class="text-xs text-slate-400"
            >MarketX by Indices Technology LTD</span
          >
          <a
            href="mailto:support@marketx.africa"
            class="text-xs font-medium text-slate-500 transition-colors hover:text-brand"
            >support@marketx.africa</a
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useSeo } from '~~/layers/core/app/composables/useSeo'
definePageMeta({ layout: false })

useSeo().setLandingPage()

const navLinks = [
  { href: '#trust', label: 'How trust works' },
  { href: '#how', label: 'Protected payments' },
  { href: '#sellers', label: 'For sellers' },
  { href: '/discover', label: 'Browse feed' },
]

const trustPillars = [
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    word: 'Protected',
    label: 'Money held till delivery',
  },
  {
    icon: 'solar:graph-up-linear',
    word: 'Earned',
    label: 'Reputation from real sales',
  },
  {
    icon: 'solar:verified-check-linear',
    word: 'Verified',
    label: 'Identity · CAC · community',
  },
]

// Phone-mockup trust-profile bars (illustrative)
const trustCardDims = [
  { label: 'Commerce', fact: '214 sales · 1.4% disputes', pct: '92%', tone: 'bg-emerald-500' },
  { label: 'Identity', fact: 'KYC + CAC', pct: '80%', tone: 'bg-brand' },
  { label: 'Community', fact: 'Chairman-attested', pct: '78%', tone: 'bg-amber-500' },
  { label: 'Social', fact: 'IG since 2019', pct: '55%', tone: 'bg-slate-300' },
]

const trustItems = [
  'DHL',
  '·',
  'UPS',
  '·',
  'Paystack',
  '·',
  'PayPal',
  '·',
  'CAC',
  '·',
  'Indices Logistics',
  '·',
  'Mono',
  '·',
]

const trustTiers = [
  {
    tier: 'Gold',
    icon: 'solar:cup-star-linear',
    title: 'Real money moved',
    desc: 'The signals that matter most — generated only when a real, fee-paid sale settles on the rail. You cannot fake these without paying for them.',
    items: [
      'Completed, protected sales',
      'Delivery confirmed by carrier scan',
      'Dispute & refund outcomes',
      'Verified identity (KYC + CAC)',
    ],
    chip: 'bg-amber-50 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    tier: 'Silver',
    icon: 'solar:shield-check-linear',
    title: 'Verified by institutions',
    desc: 'Standing a real-world body has checked and put its name to — the Nigerian advantage: your market association vouches, and can revoke.',
    items: [
      'Association / square membership',
      'Chairman & officer attestation',
      'Years operating, platform tenure',
      'Bank-linked settlement history',
    ],
    chip: 'bg-slate-100 text-slate-600',
    badge: 'bg-slate-100 text-slate-700',
  },
  {
    tier: 'Bronze',
    icon: 'solar:medal-ribbon-linear',
    title: 'Social presence — capped',
    desc: 'Followers, likes and account age are shown for continuity — but structurally capped so they can never outweigh real trade.',
    items: [
      'Instagram / TikTok account age',
      'Engagement & Google reviews',
      '“The same seller you follow”',
      'Hard-capped per dimension',
    ],
    chip: 'bg-orange-50 text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
]

const howSteps = [
  {
    icon: 'solar:magnifer-linear',
    title: 'Find a seller you can read',
    desc: 'Browse the feed or scan a seller’s Trust Card. Their profile shows verified sales, disputes and who vouches for them — before you spend a naira.',
  },
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    title: 'Pay protected',
    desc: 'Your money goes into escrow, not the seller’s pocket. It’s held safely while your order is prepared and shipped.',
  },
  {
    icon: 'solar:check-circle-linear',
    title: 'Confirm & release',
    desc: 'When the item arrives and you confirm, the seller gets paid — and the clean sale strengthens their reputation for the next buyer.',
  },
]

const features = [
  {
    icon: 'solar:lock-keyhole-minimalistic-linear',
    title: 'Protected payments',
    desc: 'Escrow on every order. Money is held until delivery is confirmed, so neither side has to trust a stranger blindly.',
  },
  {
    icon: 'solar:qr-code-linear',
    title: 'The Trust Card',
    desc: 'A QR that opens a seller’s live trust profile — on their card, plaque, IG bio or parcel. One scan, five-second read, no login.',
  },
  {
    icon: 'solar:shield-user-linear',
    title: 'Verified identity',
    desc: 'KYC and CAC checks confirm a real person and a registered business — we store the result, never your NIN.',
  },
  {
    icon: 'solar:users-group-two-rounded-linear',
    title: 'Community attestation',
    desc: 'Market squares and trade associations vouch for their members — revocable, so a chairman’s word actually carries weight.',
  },
  {
    icon: 'solar:bag-4-linear',
    title: 'Shoppable feed',
    desc: 'Discover African sellers in a live feed where every image has a price. Buy in seconds — no account needed to start.',
  },
]

const sellerFeatures = [
  'A Trust Profile that grows with every clean sale',
  'Your own QR Trust Card for cards, parcels & bio',
  'Escrow-backed orders buyers feel safe placing',
  'Identity & CAC verification badges',
  'Association attestation from your market square',
  'Real-time orders, payouts & fulfilment dashboard',
  'Live DHL / UPS shipping from your location',
  'Wallet with NGN & USD payouts',
]

const footerShop = [
  { to: '/discover', label: 'Discover feed' },
  { to: '/sellers', label: 'Trusted sellers' },
  { to: '/squares', label: 'Market squares' },
  { to: '/reels', label: 'Reels' },
]

const footerCompany = [
  { to: '/About', label: 'About' },
  { to: '/sellers/create', label: 'Sell on MarketX' },
  { to: '/Help', label: 'Help center' },
  { to: '/Privacy', label: 'Privacy' },
  { to: '/Terms', label: 'Terms' },
]
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-14px);
  }
}
@keyframes float-delayed {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-float {
  animation: float 5s ease-in-out infinite;
}
.animate-float-delayed {
  animation: float-delayed 5s ease-in-out infinite 2s;
}

@keyframes scroll-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.marquee-track {
  animation: scroll-left 24s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-float-delayed,
  .marquee-track {
    animation: none;
  }
}
</style>
