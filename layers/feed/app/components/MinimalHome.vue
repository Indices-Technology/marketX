<!-- MinimalHome — the default home experience, guest and authenticated alike.
     One full-screen item at a time (post/product/reel), content-first: no
     lead-in utility cards. Search/verify lives in a persistent top overlay
     (always one tap, never a prerequisite); Squares gets an occasional
     spotlight slide woven into the scroll plus its own nav tab — not a gate
     everyone has to swipe through first.

     Promoted out of layers/demo after validating the direction there; see
     project memory "Feed/nav pivot decision" for the reasoning. -->
<!-- Rendered as content inside index.vue's single HomeLayout instance (same
     convention as SocialFeed.vue) — index.vue passes :immersive="true" to
     that HomeLayout, which only suppresses the (now redundant) Feed/Reels
     tab bar. The mobile header (Cart/Search/Sign-in) and bottom nav
     (Discover/Squares/Account) stay — losing one-tap access to those from
     the home screen would be a regression, not part of the redesign. This
     component does NOT own its own HomeLayout — nesting two would double up
     the chrome. -->
<template>
  <div>
    <!-- ─── TOP OVERLAY — personalized tabs ────────────────────────────────
         Sits below the real mobile header on mobile (which stays visible);
         near the top on desktop, where there's no header competing for the
         same space. Left/right insets mirror the feed container below so it
         stays inside the content column instead of sliding under the fixed
         desktop SideNav (which otherwise intercepts clicks on the left edge).
         Hidden while the hero slide is active: it's a dark-on-media overlay
         designed to float over feed content, but the hero is a light-
         background marketing card with its own headline in the same top
         region — the two collided (search pill drawn straight over the
         headline text). The hero isn't feed content to search/filter
         anyway, so hiding this here mirrors the bottom-nav hide below.
         No search icon here anymore — the real mobile header (HomeLayout)
         already has one, and having two stacked magnifying-glass buttons on
         one screen was confusing. HomeLayout's header search now opens this
         component's own Find/Verify modal directly via the shared
         useHomeSearch singleton instead of its usual generic overlay (see
         `:use-custom-search` on HomeLayout in index.vue) — one entry point,
         same destination. -->
    <div
      v-if="!isHeroSlide"
      class="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px)+10px)] z-20 flex items-center justify-center gap-2 px-3 md:left-20 md:top-4 lg:right-[420px] xl:left-72 min-[1500px]:right-[calc(50vw-330px)]"
    >
      <div
        class="scrollbar-hide flex gap-1 overflow-x-auto rounded-full bg-black/40 p-1 backdrop-blur-md"
      >
        <button
          v-for="t in visibleTabs"
          :key="t.id"
          class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="
            feedTab === t.id && !productsOnly
              ? 'bg-white text-black'
              : 'text-white/80 hover:text-white'
          "
          @click="setTab(t.id)"
        >
          {{ t.label }}
        </button>
        <!-- "Products" — a client-side view filter, not a real server tab
             (unlike the ones above): useHomeFeed already splits whichever
             tab's fetched data into posts vs products pools to interleave
             them, so this just shows the products pool on its own instead
             of re-fetching anything. Kept local to MinimalHome rather than
             folded into FEED_TABS/useFeedTab, since that singleton is
             shared with SocialFeed.vue, which must not change. -->
        <button
          class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="
            productsOnly
              ? 'bg-white text-black'
              : 'text-white/80 hover:text-white'
          "
          @click="productsOnly = !productsOnly"
        >
          Products
        </button>
      </div>
    </div>

    <!-- ─── FEED ──────────────────────────────────────────────────────── -->
    <div
      ref="containerRef"
      class="scrollbar-hide fixed inset-0 z-0 snap-y snap-mandatory overflow-y-auto bg-black md:left-20 lg:right-[420px] xl:left-72 min-[1500px]:right-[calc(50vw-330px)]"
    >
      <div
        v-if="pending && !items.length"
        class="flex h-[100dvh] w-full items-center justify-center"
      >
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"
        />
      </div>

      <div
        v-else-if="!items.length"
        class="flex h-[100dvh] w-full flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <Icon name="solar:gallery-linear" size="40" class="text-white/20" />
        <p class="text-sm text-white/60">Nothing here yet — check back soon.</p>
      </div>

      <template v-else>
        <div
          v-for="(slot, index) in items"
          :key="slot.kind === 'item' ? slot.item.id : slot.kind"
          class="feed-slide relative mx-auto flex w-full max-w-[560px] snap-start snap-always justify-center bg-black"
          :data-index="index"
        >
          <HomeHero v-if="slot.kind === 'hero'" dense />
          <SquareSpotlightSlide
            v-else-if="slot.kind === 'squares'"
            :squares="squareSpotlight"
          />
          <ReelItem
            v-else-if="reelIdSet.has(slot.item.id)"
            :reel="slot.item"
            :is-active="index === activeIndex"
            :index="index"
            @open-comments="openComments"
          />
          <FeedSlide
            v-else
            :item="slot.item"
            :is-active="index === activeIndex"
            @open-comments="openComments"
            @open-product-sheet="openProductSheet"
          />
        </div>
      </template>
    </div>

    <!-- ─── DESKTOP NAV — no swipe gesture on a mouse ─────────────────── -->
    <div
      v-if="items.length"
      class="fixed bottom-1/2 right-6 z-30 hidden translate-y-1/2 flex-col gap-2 md:flex lg:right-[440px]"
    >
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-30"
        :disabled="activeIndex === 0"
        aria-label="Previous"
        @click="goTo(activeIndex - 1)"
      >
        <Icon name="solar:alt-arrow-up-linear" size="20" />
      </button>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-30"
        :disabled="activeIndex >= items.length - 1"
        aria-label="Next"
        @click="goTo(activeIndex + 1)"
      >
        <Icon name="solar:alt-arrow-down-linear" size="20" />
      </button>
    </div>

    <!-- Search/verify sheet — the real dock, reachable in one tap.
         Top-anchored: a bottom sheet pushes the input itself down toward
         mid-screen, leaving little room below it for the results dropdown
         before hitting the viewport edge — the opposite of what a search
         input needs. Anchoring to the top keeps the input high, with the
         rest of the screen free for results to grow into. -->
    <BaseModal
      v-model="searchOpen"
      title="Find or verify a seller"
      no-padding
      anchor="top"
    >
      <div class="p-4">
        <TrustFindVerifyDock :show-seller-cta="false" :boxed-dropdown="false" />
      </div>
    </BaseModal>

    <PostDetailModal
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
    />
    <ProductDetailModal
      v-if="sheetProduct"
      :product="sheetProduct as any"
      @close="sheetProduct = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ReelItem from '~~/layers/feed/app/components/ReelItem.vue'
import FeedSlide from '~~/layers/feed/app/components/FeedSlide.vue'
import SquareSpotlightSlide from '~~/layers/feed/app/components/SquareSpotlightSlide.vue'
import HomeHero from '~~/layers/feed/app/components/HomeHero.vue'
import TrustFindVerifyDock from '~~/layers/feed/app/components/TrustFindVerifyDock.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import PostDetailModal from '~~/layers/social/app/components/modals/PostDetailModal.vue'
import { useHomeFeed } from '~~/layers/feed/app/composables/useHomeFeed'
import { useFeedTab } from '~~/layers/feed/app/composables/useFeedTab'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useNavVisibility } from '~~/layers/core/app/composables/useNavVisibility'
import { useHomeSearch } from '~~/layers/core/app/composables/useHomeSearch'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { IProduct } from '~~/layers/social/app/types/post.types'
import type { MarketSquare } from '~~/layers/square/app/components/SquareCard.vue'

defineOptions({ name: 'MinimalHome' })

const profileStore = useProfileStore()
const { pending, products, reelIdSet, load, interleave } = useHomeFeed()

// Following requires auth — hide it for guests rather than let it 401.
const { activeTab: feedTab, setTab, FEED_TABS } = useFeedTab()
const visibleTabs = computed(() =>
  profileStore.isLoggedIn
    ? FEED_TABS
    : FEED_TABS.filter((t) => t.id !== 'following'),
)

// Client-side filter over whichever tab's data is already loaded — see the
// template comment by the "Products" button for why this isn't a real
// FEED_TABS entry.
const productsOnly = ref(false)

type Slot =
  | { kind: 'item'; item: IFeedItem }
  | { kind: 'squares' }
  | { kind: 'hero' }
const items = ref<Slot[]>([])
const { mobileNavVisible, bottomNavVisible } = useNavVisibility()
const activeIndex = ref(0)
const isHeroSlide = computed(
  () => items.value[activeIndex.value]?.kind === 'hero',
)

// One Squares spotlight woven into the scroll — reachable without a swipe-
// through gate, but still visible early rather than nav-only.
const SQUARES_SPOTLIGHT_POSITION = 4
const squareSpotlight = ref<MarketSquare[]>([])
const loadSquareSpotlight = async () => {
  try {
    const res = (await useSquareApi().listSquares({ limit: 6 })) as {
      data?: MarketSquare[]
    }
    squareSpotlight.value = res.data ?? []
  } catch {
    squareSpotlight.value = []
  }
}

const containerRef = ref<HTMLElement | null>(null)

// Shared with HomeLayout's header search icon — see the template comment on
// the (now-removed) top-overlay search button for why this is a singleton
// rather than a local ref.
const { searchOpen } = useHomeSearch()

const selectedPost = ref<IFeedItem | null>(null)
const openComments = (item: IFeedItem) => {
  selectedPost.value = item
}

const sheetProduct = ref<Partial<IProduct> | null>(null)
const openProductSheet = (product: Partial<IProduct>) => {
  sheetProduct.value = product
}

const goTo = (index: number) => {
  if (!containerRef.value || index < 0 || index >= items.value.length) return
  const el = containerRef.value.querySelector<HTMLElement>(
    `[data-index="${index}"]`,
  )
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const onKeydown = (e: KeyboardEvent) => {
  if (selectedPost.value || sheetProduct.value || searchOpen.value) return
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault()
    goTo(activeIndex.value + 1)
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault()
    goTo(activeIndex.value - 1)
  }
}

let observer: IntersectionObserver | null = null
const setupObserver = () => {
  observer?.disconnect()
  if (!containerRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = entry.target.getAttribute('data-index')
          if (idx !== null) activeIndex.value = parseInt(idx, 10)
        }
      })
    },
    { root: containerRef.value, threshold: 0.6 },
  )
  containerRef.value
    .querySelectorAll('.feed-slide')
    .forEach((el) => observer?.observe(el))
}

// Hero is the first slide on the very first load only — switching feed tabs
// afterward rebuilds the item list but never re-inserts it.
const heroShown = ref(false)

const buildSlots = (): Slot[] => {
  // "Products" shows the already-fetched products pool on its own instead
  // of interleaving it with posts — no separate fetch, see the template
  // comment by the button.
  const feedItems = productsOnly.value
    ? [...products.value].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : interleave({
        postsPerProduct: 2,
        reelEvery: 4,
        withReels: true,
      })
  const slots: Slot[] = feedItems.map((item) => ({ kind: 'item', item }))
  if (
    squareSpotlight.value.length &&
    slots.length > SQUARES_SPOTLIGHT_POSITION
  ) {
    slots.splice(SQUARES_SPOTLIGHT_POSITION, 0, { kind: 'squares' })
  }
  if (!heroShown.value) {
    slots.unshift({ kind: 'hero' })
    heroShown.value = true
  }
  return slots
}

const applySlots = async () => {
  activeIndex.value = 0
  items.value = buildSlots()
  await nextTick()
  containerRef.value?.scrollTo({ top: 0 })
  setupObserver()
}

const loadTab = async () => {
  await load(feedTab.value)
  await applySlots()
}

onMounted(async () => {
  await loadSquareSpotlight()
  await loadTab()
  window.addEventListener('keydown', onKeydown)
})

watch(feedTab, loadTab)
// No fetch needed — Products just re-slices data the current tab already
// loaded.
watch(productsOnly, applySlots)

watch(items, async () => {
  await nextTick()
  setupObserver()
})

// "No navs" while the hero is the visible slide — same shared signal
// HomeLayout's own scroll-threshold logic uses for the desktop hero, so both
// surfaces agree on what "showing the hero" means for nav visibility.
watch(
  isHeroSlide,
  (onHero) => {
    mobileNavVisible.value = !onHero
    bottomNavVisible.value = !onHero
  },
  { immediate: true },
)

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', onKeydown)
  // Restore nav in case we're unmounting mid-hero (e.g. navigated away before
  // swiping past it) — these are shared singletons, so leaving them hidden
  // would incorrectly hide nav on whatever page renders next.
  mobileNavVisible.value = true
  bottomNavVisible.value = true
})
</script>

<style scoped>
.feed-slide {
  height: 100dvh;
  width: 100%;
}
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
