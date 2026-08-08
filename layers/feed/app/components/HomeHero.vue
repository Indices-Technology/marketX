<!-- HomeHero — Gmail-inspired Professional Redesign -->
<!-- Non-dense (desktop sibling-hero inside HomeLayout's .main-scroll): a
     plain spacer preserves the scroll-snap point and scroll distance in the
     flow, while the actual visual content is `position: fixed` — anchored to
     the true viewport, not to .main-scroll's width. This is deliberate:
     .main-scroll's width is shared with SocialFeed.vue/GuestFeedPreview.vue,
     which self-center via their own `mx-auto` (can't be edited). Any attempt
     to make the hero edge-to-edge by resizing .main-scroll itself shifts
     their centering mid-scroll — the feed visibly "danced" sideways, a real
     bug hit and reverted once already. Going out-of-flow sidesteps the
     conflict entirely: full-bleed hero, .main-scroll width never changes.
     Dense (mobile card inside MinimalHome's own fixed snap-scroll) is
     unaffected — MinimalHome already owns full-screen slide tracking via its
     own wrapper, so HomeHero just renders normally there. -->
<template>
  <div v-if="!dense" ref="spacerRef" class="h-[100dvh] w-full snap-start" />

  <!-- pointer-events-none (non-dense only): position:fixed elements don't
       chain wheel/scroll input to ancestors the way normal-flow elements do
       — with this fixed and covering the full viewport, it was silently
       swallowing every scroll gesture before it could reach .main-scroll,
       so scrolling past the hero never actually worked for a real user
       (only programmatic scrollTo, which bypasses hit-testing). Setting this
       to none makes the section transparent to hit-testing, so wheel/click
       input passes straight through to whatever's underneath. Re-enabled
       explicitly (pointer-events-auto) on the handful of pieces that need to
       stay clickable — see below. -->
  <section
    v-show="dense || inView"
    :data-hero-scroll="dense ? undefined : true"
    class="flex flex-col bg-white dark:bg-neutral-950"
    :class="
      dense
        ? 'relative min-h-[100dvh] w-full'
        : 'pointer-events-none fixed inset-0 z-40 overflow-y-auto'
    "
  >
    <!-- Top bar — logo + auth/seller actions. While the hero is showing,
         HomeLayout's own header/sidebar (which normally carry these) are
         deliberately hidden, so without this a guest landing here has no
         visible way to log in or start selling short of scrolling past the
         hero first. Desktop only (non-dense) — the mobile hero card is one
         swipe away from the real header/bottom nav, so it doesn't need its
         own copy of this. -->
    <div v-if="!dense" class="w-full px-6 py-3 sm:px-10">
      <div
        class="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between"
      >
        <NuxtLink to="/" class="flex items-center">
          <BrandLogo variant="wordmark" />
        </NuxtLink>
        <div v-if="!profileStore.isLoggedIn" class="flex items-center gap-3">
          <NuxtLink
            to="/user-login"
            class="text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-white"
          >
            Log in
          </NuxtLink>
          <NuxtLink
            to="/sellers/create"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-neutral-200"
          >
            Become a Seller
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main hero content. Dense (mobile slide) is text + search only, no
         card imagery — this used to be the desktop two-column layout simply
         shrunk to phone width, which both overflowed a single 100dvh slide
         (forcing scroll inside what's supposed to be one swipe-past card)
         and crammed three overlapping absolute-positioned cards into a
         ~340px column where they never fit cleanly. There's no room on a
         phone screen for card imagery to earn its keep next to the actual
         CTA, so dense drops the whole right column and centers the copy +
         dock instead. -->
    <div class="flex flex-1 items-center" :class="dense ? 'px-6 py-4' : ''">
      <div
        class="mx-auto grid w-full grid-cols-1 items-center lg:grid-cols-2"
        :class="
          dense
            ? 'max-w-sm'
            : 'max-w-7xl gap-10 px-6 py-6 lg:gap-14 lg:px-12 lg:py-8'
        "
      >
        <!-- LEFT COLUMN -->
        <div
          class="flex flex-col justify-center"
          :class="dense ? 'items-center text-center' : ''"
        >
          <h1
            class="font-semibold tracking-tight text-gray-900 dark:text-white"
            :class="
              dense
                ? 'text-[1.75rem] leading-[1.15]'
                : 'max-w-xl text-4xl sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]'
            "
          >
            Find trusted sellers. <br class="hidden sm:block" /> Buy with confidence.
          </h1>

          <!-- <p
            class="leading-relaxed text-gray-500 dark:text-neutral-400"
            :class="dense ? 'mt-2 text-sm' : 'mt-3 max-w-lg text-base'"
          >
            Search sellers, verify who you're buying from, and pay with escrow
            protection.
          </p> -->

          <!-- Search / CTA dock — kept right under the headline/subhead (not
               after the trust indicators) so its results dropdown, which
               opens below the input, has vertical room before it'd run off
               the bottom of the viewport. -->
          <div class="pointer-events-auto mt-5 w-full max-w-xl">
            <TrustFindVerifyDock :show-seller-cta="!dense" />
          </div>

          <!-- Trust indicators — minimal, horizontal -->
          <div
            class="flex flex-wrap items-center text-gray-500 dark:text-neutral-500"
            :class="
              dense
                ? 'mt-4 justify-center gap-x-4 gap-y-1.5 text-xs'
                : 'mt-5 gap-x-6 gap-y-3 text-sm'
            "
          >
            <div class="flex items-center gap-1.5">
              <Icon
                name="solar:shield-check-bold"
                class="text-emerald-600"
                :size="dense ? '14' : '16'"
              />
              <span>Verified Sellers</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon
                name="solar:wallet-money-bold"
                class="text-blue-600"
                :size="dense ? '14' : '16'"
              />
              <span>Escrow Protected</span>
            </div>
            <div v-if="!dense" class="flex items-center gap-2">
              <Icon name="solar:box-bold" class="text-orange-500" size="16" />
              <span>Nationwide Delivery</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN — Floating product showcase. Desktop only; dense
             has no room for this next to the actual copy/CTA (see comment
             above the content wrapper). -->
        <div
          v-if="!dense"
          class="relative flex items-center justify-center lg:justify-end"
        >
          <!-- Soft decorative gradient blob behind images -->
          <div
            class="absolute -right-10 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-transparent opacity-70 blur-3xl dark:from-blue-900/15 dark:via-purple-900/10 dark:to-transparent"
          />
          <div
            class="absolute -right-2 top-8 text-blue-500 lg:right-4 dark:text-blue-400"
          >
            <Icon name="solar:stars-bold" size="28" />
          </div>
          <div
            class="absolute bottom-12 left-0 text-purple-400 lg:-left-4 dark:text-purple-500"
          >
            <Icon name="solar:stars-bold" size="20" />
          </div>

          <!-- Real layered cards — three real pieces of the MarketX
               ecosystem, not a generic product collage: a Market Square
               (background, where sellers organize), MarketX's own Trust
               Card (the main focal card — verified seller identity, MX
               public ID, QR, trust facts), and a real product overlapping in
               front. Same "chassis" as a layered marketing-card composition
               (Whatnot/Selar-style) but built entirely from MarketX's actual
               components and live data — no stock imagery, no bespoke
               recreation of cards that already exist. Non-interactive: this
               whole section is pointer-events-none, so nothing here
               (add-to-cart, copy ID, follow, etc.) is clickable — decorative
               only, matching the old collage's role. -->
          <!-- Gated on featuredSeller specifically, not "any of the three":
               Square/Product are position:absolute against this container,
               anchored to the Trust Card's box height. If they resolve
               before it does (three independent fetches, different
               latencies), they'd render against a height-less container and
               float near the top with nothing to anchor to — a real glitch,
               not just a loading-state nicety. Square/Product still pop in
               independently once ready; only the Trust Card gates the
               container itself. -->
          <div v-if="featuredSeller" class="relative w-full max-w-md">
            <div class="relative w-full -rotate-2 transform">
              <!-- MarketXCard *is* MarketX's Trust Card (its own source
                   comments say as much — real trust facts turn it into one),
                   but a first-time visitor has no way to know that by
                   looking at it. A small explicit label makes the concept
                   legible instead of just implied by the seller ID + QR. -->
              <span
                class="absolute -top-3 left-5 z-10 inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow dark:bg-white dark:text-gray-900"
              >
                <Icon name="solar:shield-check-bold" size="11" />
                Trust Card
              </span>
              <MarketXCard
                :seller="featuredSeller"
                :product-count="featuredProductCount"
                :qr="featuredQr"
                :trust="featuredTrust"
                :share-url="featuredShareUrl"
                :display-url="featuredDisplayUrl"
              />
            </div>
            <!-- Overlapping in front of the trust card, mirroring the
                 product card on the opposite corner. Overlap kept modest
                 (not flush corners) so text on both cards stays readable. -->
            <div
              v-if="spotlightSquare"
              class="absolute -bottom-6 -left-5 -rotate-6 transform shadow-2xl"
            >
              <SquareCard :square="spotlightSquare" variant="spotlight" />
            </div>
            <div
              v-if="heroProducts[0]"
              class="absolute -bottom-6 -right-5 w-36 rotate-6 transform shadow-2xl sm:w-40"
            >
              <ProductCardMini :product="heroProducts[0]" />
            </div>
          </div>

          <!-- Skeleton loading state -->
          <div v-else class="relative w-full max-w-lg">
            <div
              class="aspect-[4/3] animate-pulse rounded-3xl bg-gray-100 dark:bg-neutral-800"
            />
            <div
              v-if="!dense"
              class="absolute -bottom-6 -left-6 w-2/5 animate-pulse rounded-2xl border-4 border-white bg-gray-200 dark:border-neutral-950 dark:bg-neutral-700"
            >
              <div class="aspect-square" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legal / footer row — the hero deliberately hides HomeLayout's own
         chrome, so this is the only place these links are reachable without
         scrolling past it first. Desktop only, same reasoning as the top
         bar above. -->
    <div
      v-if="!dense"
      class="w-full border-t border-gray-100 px-6 py-3 sm:px-10 dark:border-neutral-800"
    >
      <div
        class="pointer-events-auto mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-gray-400 dark:text-neutral-500"
      >
        <span>&copy; {{ new Date().getFullYear() }} MarketX</span>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/terms"
            class="hover:text-gray-600 dark:hover:text-neutral-300"
          >
            Terms
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="hover:text-gray-600 dark:hover:text-neutral-300"
          >
            Privacy
          </NuxtLink>
          <NuxtLink
            to="/help/getting-started"
            class="hover:text-gray-600 dark:hover:text-neutral-300"
          >
            Help
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
import TrustFindVerifyDock from '~~/layers/feed/app/components/TrustFindVerifyDock.vue'
import ProductCardMini from '~~/layers/commerce/app/components/ProductCardMini.vue'
import MarketXCard from '~~/layers/seller/app/components/MarketXCard.vue'
import { useFeedApi } from '~~/layers/feed/app/services/feed.api'
import { useSellerApi } from '~~/layers/seller/app/services/seller.services'
import { useStoreCard } from '~~/layers/seller/app/composables/useStoreCard'
import SquareCard from '~~/layers/square/app/components/SquareCard.vue'
import type { MarketSquare } from '~~/layers/square/app/components/SquareCard.vue'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'

const props = withDefaults(defineProps<{ dense?: boolean }>(), {
  dense: false,
})

const profileStore = useProfileStore()

const heroProducts = ref<IProduct[]>([])
const spotlightSquare = ref<MarketSquare | null>(null)

const {
  seller: featuredSeller,
  productCount: featuredProductCount,
  qr: featuredQr,
  trust: featuredTrust,
  shareUrl: featuredShareUrl,
  displayUrl: featuredDisplayUrl,
  load: loadFeaturedSeller,
} = useStoreCard()

// Non-dense only: tracks whether the spacer (the hero's real position in
// .main-scroll's scroll flow) is still on screen, so the fixed-position
// visual content knows when to show/hide. Starts true — matches the actual
// initial scroll position (top) on both server and client, so no hydration
// mismatch.
const spacerRef = ref<HTMLElement | null>(null)
const inView = ref(true)
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Attach the scroll-visibility observer immediately, synchronously — don't
  // let it wait on the card data fetches below. They now take a couple of
  // chained API calls (featured seller → full trust-card data), and nothing
  // about "is the hero still on screen" should depend on how long that takes.
  if (!props.dense && spacerRef.value) {
    const root = spacerRef.value.closest('.main-scroll') as HTMLElement | null
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) inView.value = entry.isIntersecting
      },
      { root, threshold: 0 },
    )
    observer.observe(spacerRef.value)
  }

  // Card-composition data — desktop only. Dense (mobile) doesn't render any
  // of this (see the right-column comment in the template), so skip the
  // fetches entirely rather than pull data nothing displays.
  if (props.dense) return

  // Real product + real featured seller — independent fetches, run in
  // parallel rather than chained. This is a landing page, so within "real
  // data only" we still pick the *best-looking* real candidate rather than
  // whatever happens to sort first — a product with no reviews or a square
  // with 0 traders reads as broken, not authentic.
  useFeedApi()
    .getFreshDrops({ limit: 12 })
    .then((res: { data?: IProduct[] }) => {
      const withMedia = (res.data ?? []).filter((p) => p.media?.length)
      // Landing-page-only heuristic: a first-time visitor seeing a raw
      // mineral/ore photo reads as "wait, does MarketX sell minerals?"
      // rather than the everyday categories (phones, fashion, sneakers)
      // that actually make up most of the marketplace. A light title check
      // — fresh-drops doesn't select a category field to filter on properly.
      const RAW_MATERIAL = /\b(ore|mineral|stone|rock|mining|crude)\b/i
      const relatable = withMedia.filter((p) => !RAW_MATERIAL.test(p.title))
      const pool = relatable.length ? relatable : withMedia
      // Prefer one with a real rating (social proof, a "good" listing) over
      // whichever happened to be newest.
      const rated = pool.filter((p) => p.averageRating != null)
      heroProducts.value = rated.length ? rated : pool
    })
    .catch(() => {
      heroProducts.value = []
    })

  useSellerApi()
    .getFeaturedSellers({ limit: 1 })
    .then((res: { data?: Array<{ store_slug: string }> }) => {
      const slug = res.data?.[0]?.store_slug
      return slug ? loadFeaturedSeller(slug) : undefined
    })
    .catch(() => {
      // featuredSeller stays null — the skeleton fallback covers this
    })

  useSquareApi()
    .listSquares({ limit: 8 })
    .then((res: { data?: MarketSquare[] }) => {
      const squares = res.data ?? []
      // listSquares has no sort param — pick the one with the strongest
      // real numbers instead of just the first result, so the card never
      // shows a hollow "0 traders · 0 goods".
      spotlightSquare.value =
        [...squares].sort(
          (a, b) =>
            (b.memberCount ?? 0) +
            (b.productCount ?? 0) -
            ((a.memberCount ?? 0) + (a.productCount ?? 0)),
        )[0] ?? null
    })
    .catch(() => {
      spotlightSquare.value = null
    })
})

onUnmounted(() => observer?.disconnect())
</script>
