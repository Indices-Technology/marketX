<!--
  /trust/how-it-works — the buyer/seller-facing explainer for store trust ratings.
  User-facing render of docs/TRUST_RATINGS.md. Tier/band thresholds mirror the
  live engine (layers/reputation/server/reputation.registry.ts, v1.0.0); keep
  them in sync when ENGINE_VERSION changes.
-->
<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-12">
      <!-- ─── Hero ──────────────────────────────────────────────────────── -->
      <header class="mb-12">
        <div
          class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"
        >
          <Icon name="solar:shield-check-bold" size="30" />
        </div>
        <p
          class="mb-2 text-xs font-bold uppercase tracking-widest text-brand"
        >
          Trust Ratings
        </p>
        <h1
          class="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
        >
          How store trust ratings work
        </h1>
        <p
          class="mt-4 max-w-xl text-base leading-relaxed text-gray-500 dark:text-neutral-400"
        >
          A store's rating is built from real money that moved on the MarketX
          escrow rail — completed orders, confirmed deliveries and resolved
          disputes. Nothing here is seeded, bought, or self-reported.
        </p>
      </header>

      <!-- ─── Earned-not-bought callout ─────────────────────────────────── -->
      <div
        class="mb-12 flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint/5 p-5 dark:border-mint/20 dark:bg-mint/10"
      >
        <Icon
          name="solar:lock-keyhole-minimalistic-bold"
          size="22"
          class="mt-0.5 shrink-0 text-mint-dark dark:text-mint"
        />
        <p class="text-sm leading-relaxed text-gray-700 dark:text-neutral-200">
          <span class="font-semibold text-gray-900 dark:text-white"
            >Earned, not bought.</span
          >
          If a store hasn't done enough protected business yet, we show
          <span class="font-semibold">“not enough data yet”</span> rather than
          guess. A rating only ever climbs on the strength of real, settled
          transactions.
        </p>
      </div>

      <!-- ─── Two things you'll see ─────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading eyebrow="At a glance" title="Two things you'll see" />
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <div
            class="rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon
                name="solar:medal-ribbons-star-bold"
                size="18"
                class="text-amber-500"
              />
              <h3
                class="font-display text-base font-bold text-gray-900 dark:text-white"
              >
                The Store Tier
              </h3>
            </div>
            <p class="text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
              One overall rank — <b class="font-semibold">Tier 1</b>,
              <b class="font-semibold">Tier 2</b> or
              <b class="font-semibold">Tier 3</b>. The headline.
            </p>
          </div>
          <div
            class="rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon
                name="solar:chart-2-bold"
                size="18"
                class="text-brand"
              />
              <h3
                class="font-display text-base font-bold text-gray-900 dark:text-white"
              >
                The dimension bars
              </h3>
            </div>
            <p class="text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
              A <b class="font-semibold">High / Medium / Low</b> reading per
              category (Commerce, Identity…). The detail.
            </p>
          </div>
        </div>
      </section>

      <!-- ─── Store Tier ────────────────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading
          eyebrow="The headline rank"
          title="Store Tiers"
          subtitle="Higher is better — Tier 1 is the top. Shown as a small chip on the store's trust profile."
        />
        <div class="mt-6 space-y-3">
          <div
            v-for="t in tiers"
            :key="t.key"
            class="flex items-start gap-4 rounded-2xl border bg-white p-5 dark:bg-neutral-900"
            :class="
              t.key === 'TIER_1'
                ? 'border-amber-200 dark:border-amber-500/30'
                : 'border-gray-100 dark:border-neutral-800'
            "
          >
            <span
              class="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider"
              :class="t.chip"
            >
              {{ t.label }}
            </span>
            <div class="min-w-0">
              <p
                class="font-display text-sm font-bold text-gray-900 dark:text-white"
              >
                {{ t.meaning }}
              </p>
              <p
                class="mt-1 text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
              >
                {{ t.req }}
              </p>
            </div>
          </div>

          <!-- unrated -->
          <div
            class="flex items-start gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-800/40"
          >
            <span
              class="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
            >
              No tier yet
            </span>
            <div class="min-w-0">
              <p
                class="font-display text-sm font-bold text-gray-900 dark:text-white"
              >
                Not enough data yet
              </p>
              <p
                class="mt-1 text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
              >
                Fewer than 3 protected sales — the store is too new to rate
                honestly. This means <i>“not proven yet,”</i> never “bad.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Dimension bands ───────────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading
          eyebrow="The detail"
          title="Dimension bands"
          subtitle="Each category shows a band. The bar reflects how strong and well-evidenced it is."
        />

        <!-- band legend -->
        <div class="mt-6 space-y-3">
          <div
            v-for="b in bands"
            :key="b.label"
            class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div
              class="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800"
            >
              <div
                v-if="b.width"
                class="h-full rounded-full"
                :class="b.bar"
                :style="{ width: b.width }"
              />
            </div>
            <div class="min-w-0">
              <span
                class="font-display text-sm font-bold text-gray-900 dark:text-white"
                >{{ b.label }}</span
              >
              <span class="ml-2 text-sm text-gray-500 dark:text-neutral-400">{{
                b.meaning
              }}</span>
            </div>
          </div>
        </div>

        <!-- Commerce -->
        <div class="mt-8">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="solar:bag-check-bold" size="18" class="text-brand" />
            <h3
              class="font-display text-base font-bold text-gray-900 dark:text-white"
            >
              Commerce — the spine of the rating
            </h3>
          </div>
          <p
            class="mb-4 text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
          >
            The category that matters most: built purely from money that moved.
          </p>
          <ThresholdRow
            v-for="r in commerceBands"
            :key="r.band"
            :band="r.band"
            :req="r.req"
          />
        </div>

        <!-- Identity -->
        <div class="mt-8">
          <div class="mb-3 flex items-center gap-2">
            <Icon
              name="solar:verified-check-bold"
              size="18"
              class="text-blue-500"
            />
            <h3
              class="font-display text-base font-bold text-gray-900 dark:text-white"
            >
              Identity — a real, registered business
            </h3>
          </div>
          <ThresholdRow
            v-for="r in identityBands"
            :key="r.band"
            :band="r.band"
            :req="r.req"
          />
        </div>

        <p
          class="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500 dark:bg-neutral-800/50 dark:text-neutral-400"
        >
          More categories — <b class="font-semibold">Business History,
          Community</b> (association / chairman attestation),
          <b class="font-semibold">Financial</b> and
          <b class="font-semibold">Social</b> presence — are part of the
          framework and roll out in later phases. Commerce and Identity are what
          the rating computes today.
        </p>
      </section>

      <!-- ─── What the numbers mean ─────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading
          eyebrow="Definitions"
          title="What the numbers mean"
          subtitle="Every figure is defined precisely and computed from real records."
        />
        <dl class="mt-6 space-y-4">
          <div
            v-for="d in defs"
            :key="d.term"
            class="border-b border-gray-100 pb-4 last:border-0 dark:border-neutral-800"
          >
            <dt
              class="font-display text-sm font-bold text-gray-900 dark:text-white"
            >
              {{ d.term }}
            </dt>
            <dd
              class="mt-1 text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
            >
              {{ d.def }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- ─── Why it's hard to fake ─────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading
          eyebrow="Why you can trust it"
          title="Hard to fake, by design"
          subtitle="The most prominent signals are the ones you can least game."
        />
        <ul class="mt-6 space-y-3">
          <li
            v-for="p in proofs"
            :key="p.title"
            class="flex items-start gap-3"
          >
            <Icon
              name="solar:check-circle-bold"
              size="18"
              class="mt-0.5 shrink-0 text-mint-dark dark:text-mint"
            />
            <p class="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
              <span class="font-semibold text-gray-900 dark:text-white"
                >{{ p.title }}</span
              >
              — {{ p.body }}
            </p>
          </li>
        </ul>
      </section>

      <!-- ─── For sellers ───────────────────────────────────────────────── -->
      <section class="mb-14">
        <SectionHeading
          eyebrow="For sellers"
          title="How to climb"
          subtitle="The rating rewards clean, recent, protected business."
        />
        <ol class="mt-6 space-y-4">
          <li
            v-for="(s, i) in sellerSteps"
            :key="s.title"
            class="flex items-start gap-3.5"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-sm font-bold text-brand"
              >{{ i + 1 }}</span
            >
            <div class="min-w-0 pt-0.5">
              <p
                class="font-display text-sm font-bold text-gray-900 dark:text-white"
              >
                {{ s.title }}
              </p>
              <p
                class="mt-0.5 text-sm leading-relaxed text-gray-500 dark:text-neutral-400"
              >
                {{ s.body }}
              </p>
            </div>
          </li>
        </ol>
      </section>

      <!-- ─── Public ID footnote ────────────────────────────────────────── -->
      <div
        class="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Icon
          name="solar:qr-code-bold"
          size="22"
          class="mt-0.5 shrink-0 text-gray-400 dark:text-neutral-500"
        />
        <p class="text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
          Every store has a public ID like
          <span
            class="font-mono text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-neutral-200"
            >MX-PL-04KT</span
          >, printed on its Trust Card, QR, plaque and parcels — so you can look
          up the exact same store anywhere you see it.
        </p>
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { h } from 'vue'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'

useHead({
  title: 'How store trust ratings work · MarketX',
  meta: [
    {
      name: 'description',
      content:
        'How MarketX store trust ratings work — Store Tiers, dimension bands, and what each number means. Earned from real escrow sales, not bought.',
    },
  ],
})

// ── Small presentational helpers (kept local to this page) ───────────────────
const SectionHeading = (props: {
  eyebrow: string
  title: string
  subtitle?: string
}) =>
  h('div', [
    h(
      'p',
      { class: 'mb-1 text-xs font-bold uppercase tracking-widest text-brand' },
      props.eyebrow,
    ),
    h(
      'h2',
      {
        class:
          'font-display text-xl font-bold text-gray-900 dark:text-white',
      },
      props.title,
    ),
    props.subtitle
      ? h(
          'p',
          {
            class:
              'mt-1.5 text-sm leading-relaxed text-gray-400 dark:text-neutral-500',
          },
          props.subtitle,
        )
      : null,
  ])
SectionHeading.props = ['eyebrow', 'title', 'subtitle']

// bar tone per band — mirrors TrustProfile.barTone()
const BAND_BAR: Record<string, string> = {
  High: 'bg-mint dark:bg-mint-light',
  Medium: 'bg-amber-400',
  Low: 'bg-gray-300 dark:bg-neutral-600',
}
const BAND_WIDTH: Record<string, string> = {
  High: '100%',
  Medium: '66%',
  Low: '38%',
}

const ThresholdRow = (props: { band: string; req: string }) =>
  h(
    'div',
    {
      class:
        'flex items-center gap-4 border-b border-gray-100 py-2.5 last:border-0 dark:border-neutral-800',
    },
    [
      h(
        'div',
        {
          class:
            'h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800',
        },
        BAND_WIDTH[props.band]
          ? h('div', {
              class: `h-full rounded-full ${BAND_BAR[props.band] || ''}`,
              style: { width: BAND_WIDTH[props.band] },
            })
          : null,
      ),
      h(
        'span',
        {
          class:
            'w-24 shrink-0 font-display text-sm font-bold text-gray-900 dark:text-white',
        },
        props.band,
      ),
      h(
        'span',
        { class: 'text-sm leading-snug text-gray-500 dark:text-neutral-400' },
        props.req,
      ),
    ],
  )
ThresholdRow.props = ['band', 'req']

// tier-chip classes mirror TrustProfile.vue / TrustCard.vue exactly
const tiers = [
  {
    key: 'TIER_1',
    label: 'Tier 1',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    meaning: 'Proven, high-volume, very clean record',
    req: '100+ protected sales and a dispute rate under 2%.',
  },
  {
    key: 'TIER_2',
    label: 'Tier 2',
    chip: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300',
    meaning: 'Established, reliable track record',
    req: '30+ protected sales and a dispute rate under 4%.',
  },
  {
    key: 'TIER_3',
    label: 'Tier 3',
    chip: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    meaning: 'Real track record, still building',
    req: 'Past the 3-sale minimum, but not yet Tier 2.',
  },
]

const bands = [
  { label: 'High', bar: 'bg-mint dark:bg-mint-light', width: '100%', meaning: 'Strong, well-evidenced.' },
  { label: 'Medium', bar: 'bg-amber-400', width: '66%', meaning: 'Solid, still building.' },
  { label: 'Low', bar: 'bg-gray-300 dark:bg-neutral-600', width: '38%', meaning: 'Early / limited evidence.' },
  { label: 'Not enough data yet', bar: '', width: '', meaning: 'Below the minimum — shown instead of a fake-precise score.' },
  { label: 'Not provided', bar: '', width: '', meaning: "The seller hasn't shared this. Neutral — never a penalty." },
]

const commerceBands = [
  { band: 'High', req: '50+ protected sales and a dispute rate under 2%.' },
  { band: 'Medium', req: '10+ protected sales and a dispute rate under 4%.' },
  { band: 'Low', req: 'Crossed the 3-sale minimum but below Medium.' },
  { band: 'Not enough data', req: 'Fewer than 3 protected sales.' },
]

const identityBands = [
  { band: 'High', req: 'Owner identity verified and CAC (business registration) verified.' },
  { band: 'Medium', req: 'One of the two verified.' },
  { band: 'Low', req: 'Neither verified yet.' },
]

const defs = [
  {
    term: 'Protected sales',
    def: 'Orders paid on the escrow rail and completed. Cash or off-platform deals do not count.',
  },
  {
    term: 'Delivered',
    def: 'Of those, the ones carrier-scan-confirmed as delivered — not just marked shipped.',
  },
  {
    term: 'Dispute rate',
    def: 'Disputes resolved against the seller (buyer refunded) ÷ protected sales, as a %. A dispute the seller wins does not count against them.',
  },
  {
    term: 'Repeat buyers',
    def: 'Share of sales from customers who came back.',
  },
  {
    term: 'Tenure',
    def: 'Whole years since the store was created (“New store” under a year).',
  },
  {
    term: 'Rating & reviews',
    def: 'Average of verified product reviews — each gated on a completed order, one per buyer–seller pair.',
  },
]

const proofs = [
  {
    title: 'Volume costs money to fake',
    body: 'sales only count when they are fee-paid, settled escrow transactions.',
  },
  {
    title: 'Followers and hype do not move it',
    body: 'social presence is capped by design — 100k followers never outrank 500 clean orders.',
  },
  {
    title: 'Bad evidence does not disappear',
    body: 'the record is append-only — there is no “recompute until it looks good.”',
  },
  {
    title: 'Reputation must be maintained',
    body: 'recent activity counts for more, so a store cannot coast forever on an old burst of sales.',
  },
  {
    title: 'Vouching stays honest',
    body: 'attestations are revocable — a chairman who vouches carries the revocation trail.',
  },
]

const sellerSteps = [
  {
    title: 'Do protected business',
    body: 'Every completed escrow order is your strongest evidence. Get past 3 sales to be rated, 10 for Medium commerce, 30 for Tier 2, 50/100 for High/Tier 1.',
  },
  {
    title: 'Keep your dispute rate down',
    body: 'Under 4% for Tier 2, under 2% for Tier 1. Ship what you describe, on time, and resolve issues before they become buyer-refund disputes.',
  },
  {
    title: 'Verify identity and register your business',
    body: 'Owner verification plus CAC registration push Identity to High.',
  },
  {
    title: 'Stay active and get deliveries confirmed',
    body: 'Recent sales weigh more, and carrier-confirmed deliveries count for more than self-marked ones.',
  },
]
</script>
