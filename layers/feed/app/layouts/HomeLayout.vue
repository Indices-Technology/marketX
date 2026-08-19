<!-- layouts/default.vue (or your home layout file) -->
<template>
  <!-- ─── MOBILE HEADER — hidden on reels (full-screen), auto-hides on scroll elsewhere.
       Stays visible on the immersive home too — losing one-tap Cart/Search
       access from the home screen is a real usability regression, not
       something the immersive redesign intended. -->
  <div
    v-if="route.name !== 'reels'"
    class="fixed left-0 right-0 top-0 z-30 transition-transform duration-300 ease-in-out md:hidden"
    :class="mobileNavVisible ? 'translate-y-0' : '-translate-y-full'"
  >
    <HeaderNavMobile
      @open-notifications="showNotificationOverlay = true"
      @open-cart="showCart = true"
      @open-search="onOpenSearch"
    />
  </div>

  <!-- ─── FEED / REELS TAB — shown to everyone on /, since both destinations
       are public. Keeping it auth-independent means the header block (and the
       content padding below it) is identical signed in or out. -->
  <div
    v-if="showFeedReelsTabs"
    class="fixed left-0 right-0 z-[29] flex h-10 items-center justify-center border-b border-gray-200/60 bg-white/90 backdrop-blur-md md:hidden dark:border-neutral-800/60 dark:bg-neutral-900/90"
    :style="{
      top: mobileNavVisible
        ? 'calc(3.5rem + env(safe-area-inset-top, 0px))'
        : 'env(safe-area-inset-top, 0px)',
      transition: 'top 300ms ease-in-out',
    }"
  >
    <div
      class="flex overflow-hidden rounded-full border border-gray-200 dark:border-neutral-700"
    >
      <NuxtLink
        to="/"
        class="px-6 py-1 text-sm font-semibold transition-colors"
        :class="
          route.name === 'index'
            ? 'bg-brand/10 text-brand'
            : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
        "
      >
        Feed
      </NuxtLink>
      <NuxtLink
        to="/reels"
        class="px-6 py-1 text-sm font-semibold transition-colors"
        :class="
          route.name === 'reels'
            ? 'bg-brand/10 text-brand'
            : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
        "
      >
        Reels
      </NuxtLink>
      <ClientOnly>
        <NuxtLink
          v-if="sellerStore.hasSellers"
          :to="
            sellerStore.sellers.length === 1
              ? `/seller/${sellerStore.sellers[0].store_slug}/dashboard`
              : '/seller/dashboard'
          "
          class="border-l border-gray-200 px-6 py-1 text-sm font-semibold transition-colors dark:border-neutral-700"
          :class="
            isSellerRoute
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          "
        >
          Sell
        </NuxtLink>
      </ClientOnly>
    </div>
  </div>

  <div
    class="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100"
  >
    <!-- ─── DESKTOP LEFT SIDEBAR ──────────────────────────────────────────────
         Collapsed to an 80px icon rail by default; expands to 220px on hover as
         an overlay (content margin stays 80px, so the hero keeps its width).
         Slides off-screen while the desktop hero fills the viewport — "no
         navs" is a property of the hero, matching the mobile header/bottom
         nav treatment. -->
    <aside
      class="scrollbar-hide fixed left-0 top-0 z-30 hidden h-full bg-white transition-transform duration-300 ease-in-out md:block dark:bg-neutral-900"
      :class="[
        desktopHeroInView ? '-translate-x-full' : 'translate-x-0',
        sidebarExpanded
          ? 'w-[220px] shadow-2xl shadow-black/10 dark:shadow-black/40'
          : 'w-20',
      ]"
      @mouseenter="sidebarExpanded = true"
      @mouseleave="sidebarExpanded = false"
      @focusin="sidebarExpanded = true"
      @focusout="sidebarExpanded = false"
    >
      <SideNav
        :expanded="sidebarExpanded"
        @create="showCreateModal = true"
        @open-notifications="showNotificationOverlay = true"
        @open-cart="showCart = true"
      />
    </aside>

    <!-- ─── MAIN CONTENT AREA ────────────────────────────────────────────────── -->
    <main class="md:ml-20">
      <div class="mx-auto flex max-w-[1500px]">
        <!-- Main feed / page content -->
        <div
          ref="mainScrollRef"
          class="main-scroll scrollbar-hide h-[100dvh] min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-2 transition-all duration-200 sm:px-4"
          :class="[
            mainContentClasses,
            // 'proximity', not 'mandatory' — the hero is the ONLY snap point
            // here (unlike MinimalHome's own snap-scroll, which has one per
            // slide). With 'mandatory' the browser has nowhere else to land
            // and snaps straight back to the hero from anywhere, making it
            // impossible to scroll past. 'proximity' only pulls you back if
            // you let go near it — scrolling further away is unaffected.
            snapHero ? 'snap-y snap-proximity' : '',
            hasScrolled
              ? 'shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.07)]'
              : '',
          ]"
          @scroll.passive="onMainScroll"
        >
          <div class="w-full pb-20 md:pb-0" :class="contentWidthClass">
            <slot />
          </div>
        </div>

        <!-- ─── RIGHT SIDEBAR (Desktop) ──────────────────────────────────────── -->
        <!-- translate-only, NOT a width collapse: this aside is a normal flex
             sibling of .main-scroll, and SocialFeed.vue self-centers inside
             main-scroll via its own `mx-auto max-w-[600px]` (can't be
             modified). If this aside's reserved width toggled with scroll
             position, main-scroll's available width would change right as
             SocialFeed scrolls into view, and its centering would visibly
             recompute mid-scroll — the feed "dancing" sideways. Keeping the
             width constant (paint-hidden only) trades a slightly less
             full-bleed hero for a feed that never shifts. -->
        <aside
          v-if="showRightSidebar"
          class="scrollbar-hide hidden h-[100dvh] shrink-0 overflow-y-auto p-4 transition-transform duration-300 ease-in-out lg:block"
          :class="[
            desktopHeroInView ? 'translate-x-full' : 'translate-x-0',
            narrowSidebar ? 'w-64' : 'w-96',
          ]"
        >
          <slot name="right-sidebar">
            <RightSideNav @open-ai="showAI = true" />
          </slot>
        </aside>
      </div>
    </main>

    <!-- ─── MOBILE BOTTOM NAVIGATION ─────────────────────────────────────────── -->
    <BottomNavMobile
      class="fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out"
      :class="bottomNavVisible ? 'translate-y-0' : 'translate-y-full'"
      @create="showCreateModal = true"
    />

    <!-- ─── FLOATING ACTION BUTTONS & BANNERS ────────────────────────────────── -->
    <MobileAIChatButton
      :is-open="showAI"
      :side-left="immersive"
      :nav-visible="bottomNavVisible"
      :banner-visible="
        !dismissSellerBanner &&
        profileStore.isLoggedIn &&
        !sellerStore.hasSellers &&
        bottomNavVisible
      "
      @open="showAI = true"
      @close="showAI = false"
    />

    <!-- SellerHubDock removed. As a floating dock it sat on top of page content
         (store names, hero copy) and its dismiss was session state on the
         component — so every layout swap that remounted it brought the banner
         back after the seller had closed it.
         The same shortcut is now a tile in MobileStatusStrip on home, and
         AccountMenu in the bottom nav already carries "Seller Hub" on every
         other page, so no route to the dashboard was lost.
         Non-sellers still get the "Start Selling" pitch below. -->

    <ClientOnly>
      <Transition name="seller-banner">
        <div
          v-if="
            !dismissSellerBanner &&
            profileStore.isLoggedIn &&
            !sellerStore.hasSellers &&
            bottomNavVisible
          "
          class="fixed bottom-16 left-0 right-0 z-20 px-3 pb-2 md:hidden"
        >
          <div
            class="flex items-center gap-2.5 rounded-2xl bg-brand px-3 py-2.5 shadow-xl shadow-brand/30"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20"
            >
              <Icon name="solar:shop-2-linear" size="16" class="text-white" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[12px] font-bold leading-tight text-white">
                Start selling on {{ $config.public.siteName || 'MarketX' }}
              </p>
              <p class="text-[10px] text-white/70">
                Turn your passion into profit
              </p>
            </div>
            <NuxtLink
              to="/sellers/create"
              class="shrink-0 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-brand shadow-sm transition-colors hover:bg-gray-50"
            >
              Start →
            </NuxtLink>
            <button
              class="shrink-0 p-1 text-white/60 hover:text-white"
              aria-label="Dismiss"
              @click="dismissSellerBanner = true"
            >
              <Icon name="solar:close-circle-linear" size="16" />
            </button>
          </div>
        </div>
      </Transition>
    </ClientOnly>

    <!-- ─── MODALS & OVERLAYS ────────────────────────────────────────────────── -->
    <CreateModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @open-post-modal="openPostUploader"
      @open-story-modal="openStoryUploader"
      @open-product-modal="openQuickProductUploader"
    />

    <PostUploadModal
      :is-open="showPostModal"
      @close="showPostModal = false"
      @posted="handlePost"
    />
    <StoryUploadModal
      :is-open="showStoryModal"
      @close="showStoryModal = false"
      @posted="handlePost"
    />
    <QuickProductModal
      :is-open="showQuickProductModal"
      @close="showQuickProductModal = false"
      @posted="handlePost"
    />

    <SearchOverlay
      :is-open="showSearchOverlay"
      @close="showSearchOverlay = false"
    />
    <NotificationOverlay
      :is-open="showNotificationOverlay"
      @close="showNotificationOverlay = false"
    />
    <CartSidebar :is-open="showCart" @close="showCart = false" />

    <ShareModal
      :is-open="shareState.isOpen"
      :url="shareState.url"
      :title="shareState.title"
      @close="closeShare"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  toRefs,
  defineAsyncComponent,
} from 'vue'
import { refreshNuxtData } from '#imports'
import { useRoute } from 'vue-router'

// ─── Always-visible layout components (eager) ───────────────────────────────
import BottomNavMobile from '~~/layers/core/app/layouts/children/BottomNavMobile.vue'
import SideNav from '~~/layers/core/app/layouts/children/SideNav.vue'
import HeaderNavMobile from '~~/layers/core/app/layouts/children/HeaderNavMobile.vue'
import RightSideNav from '~~/layers/core/app/layouts/children/RightSideNav.vue'

// ─── Modals & overlays (lazy — only loaded when opened) ─────────────────────
const CreateModal = defineAsyncComponent(
  () => import('~~/layers/core/app/components/modals/CreateModal.vue'),
)
const PostUploadModal = defineAsyncComponent(
  () => import('~~/layers/social/app/components/modals/PostUploadModal.vue'),
)
const StoryUploadModal = defineAsyncComponent(
  () => import('../components/modals/StoryUploadModal.vue'),
)
const QuickProductModal = defineAsyncComponent(
  () =>
    import('~~/layers/commerce/app/components/modals/QuickProductModal.vue'),
)
const SearchOverlay = defineAsyncComponent(
  () => import('~~/layers/core/app/components/search/SearchOverLay.vue'),
)
const NotificationOverlay = defineAsyncComponent(
  () => import('~~/layers/profile/app/components/NotificationOverlay.vue'),
)
const CartSidebar = defineAsyncComponent(
  () => import('~~/layers/commerce/app/components/CartSidebar.vue'),
)
const ShareModal = defineAsyncComponent(
  () => import('~~/layers/social/app/components/modals/ShareModal.vue'),
)
const MobileAIChatButton = defineAsyncComponent(
  () => import('~~/layers/ai/app/components/MobileAIChat.vue'),
)

import { useLayoutData } from '~~/layers/core/app/composables/useLayoutData'
import { useNavVisibility } from '~~/layers/core/app/composables/useNavVisibility'
import { useHomeSearch } from '~~/layers/core/app/composables/useHomeSearch'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useShareModal } from '~~/layers/social/app/composables/useShareModal'
import { useDassaPanel } from '~~/layers/ai/app/composables/useDassaPanel'
import { useCartDrawer } from '~~/layers/commerce/app/composables/useCartDrawer'

// ─── Stores & Composables ───────────────────────────────────────────────────
const route = useRoute()
const { shareState, closeShare } = useShareModal()
const profileStore = useProfileStore()
const sellerStore = useSellerStore()
const { refresh } = useLayoutData()

// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  narrowFeed?: boolean
  mode?: 'feed' | 'market' | 'wide'
  hideRightSidebar?: boolean
  customPadding?: boolean
  narrowSidebar?: boolean
  // MinimalHome's full-screen feed lives at '/'. It only needs the
  // Feed/Reels tab bar suppressed (redundant now that Reels are woven into
  // the unified feed) — header/bottom-nav stay, unlike route: 'reels', since
  // Cart/Search/Discover/Squares should stay one tap away from home.
  immersive?: boolean
  // Desktop hero landing: makes .main-scroll a scroll-snap container so the
  // first full-viewport child (HomeHero, which declares snap-start) acts as
  // a distinct "cover" page before the real feed content scrolls into view.
  snapHero?: boolean
  // MinimalHome (mobile, default) owns a richer Find/Verify modal and used to
  // render its own duplicate search icon to open it — two magnifying-glass
  // buttons stacked on one screen. When true, the header's search icon opens
  // that modal instead (via the useHomeSearch singleton) rather than this
  // layout's own generic SearchOverlay, so there's exactly one entry point.
  useCustomSearch?: boolean
}>()
const { immersive } = toRefs(props)

const isSellerRoute = computed(() => route.path.startsWith('/seller'))

// Left rail: collapsed to icons, expands to labels while hovered.
const sidebarExpanded = ref(false)

// ─── Layout Detection ───────────────────────────────────────────────────────
const layoutMode = computed(() => {
  if (props.mode) return props.mode
  if (props.narrowFeed !== undefined) return props.narrowFeed ? 'feed' : 'wide'
  return ['index', 'reels', 'profile-username', 'post-id'].includes(
    route.name as string,
  )
    ? 'feed'
    : 'wide'
})

const contentWidthClass = computed(() => {
  if (layoutMode.value === 'feed') return 'mx-auto max-w-[640px]'
  if (layoutMode.value === 'market') return 'mx-auto max-w-[980px]'
  return ''
})

// Also suppressed when snapHero is active: that tab bar slides up to fill the
// header's spot rather than fully hiding (fine for the normal scroll-hide
// behavior elsewhere), which would overlap the hero instead of disappearing
// behind it during its "no navs" phase.
const showFeedReelsTabs = computed(
  () => route.name === 'index' && !immersive.value && !props.snapHero,
)

const showRightSidebar = computed(() => {
  if (props.hideRightSidebar) return false
  return true
})

const mainContentClasses = computed(() => {
  if (props.customPadding) return 'py-0'
  // Extra top padding when the Feed/Reels tab bar is visible
  // (header 3.5rem + tab bar 2.5rem = 6rem → pt-24).
  if (showFeedReelsTabs.value) return 'pb-6 pt-24 md:pt-6 lg:px-4'
  return 'pb-6 pt-16 md:pt-6 lg:px-4'
})

// ─── Scroll / Nav-hide Behavior ─────────────────────────────────────────────
const mainScrollRef = ref<HTMLElement | null>(null)
const hasScrolled = ref(false)
const { mobileNavVisible, bottomNavVisible: _bottomNavVisible } =
  useNavVisibility()

// Desktop sidebars aren't covered by mobileNavVisible (that's mobile-only,
// md:hidden chrome) — snapHero drives this separately so both sidebars slide
// away while the hero fills the viewport, same "no navs" intent.
const desktopHeroInView = ref(false)

// Always hide bottom nav on reels (full-screen TikTok-style scroll). The
// immersive home keeps it — Squares/Discover/Account are reached through it,
// and MinimalHome's own internal scroll doesn't fire the scroll listeners
// below, so it just stays put rather than auto-hiding.
const bottomNavVisible = computed(
  () => route.name !== 'reels' && _bottomNavVisible.value,
)

const shouldAutoHideNav = computed(
  () => layoutMode.value === 'feed' || route.name === 'reels',
)

let pauseTimer: ReturnType<typeof setTimeout> | null = null
const AUTO_REVEAL_AFTER_PAUSE = 1500 // ms of stillness → bring navs back

const revealNav = () => {
  mobileNavVisible.value = true
  _bottomNavVisible.value = true
}
const hideNav = () => {
  mobileNavVisible.value = false
  _bottomNavVisible.value = false
}
const scheduleReveal = () => {
  if (pauseTimer) clearTimeout(pauseTimer)
  pauseTimer = setTimeout(revealNav, AUTO_REVEAL_AFTER_PAUSE)
}

// ── Desktop: inner-div scroll ────────────────────────────────────────────────
let lastDivScrollY = 0
const onMainScroll = () => {
  const el = mainScrollRef.value
  if (!el) return
  const y = el.scrollTop
  hasScrolled.value = y > 20

  // While the hero (h-[100dvh], the container's own clientHeight) still fills
  // the viewport, nav stays hidden regardless of scroll direction/delta —
  // "no navs" is a property of the hero, not of scroll momentum. Once past
  // it, hand off to the normal delta-based auto-hide below unchanged.
  if (props.snapHero && y < el.clientHeight) {
    lastDivScrollY = y
    hideNav()
    desktopHeroInView.value = true
    return
  }
  desktopHeroInView.value = false

  const delta = y - lastDivScrollY
  lastDivScrollY = y
  if (!shouldAutoHideNav.value) {
    revealNav()
    return
  }
  if (Math.abs(delta) < 4) return
  delta > 0 && y > 60 ? hideNav() : revealNav()
  scheduleReveal()
}

// ── Desktop fallback: window scroll ─────────────────────────────────────────
let lastWinScrollY = 0
const onWindowScroll = () => {
  const y = window.scrollY
  hasScrolled.value = y > 20
  const delta = y - lastWinScrollY
  lastWinScrollY = y
  if (!shouldAutoHideNav.value) {
    revealNav()
    return
  }
  if (Math.abs(delta) < 4) return
  delta > 0 && y > 60 ? hideNav() : revealNav()
  scheduleReveal()
}

// ── Mobile: touch direction detection (most reliable on all mobile browsers) ─
let touchStartY = 0
const onTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY
  if (pauseTimer) clearTimeout(pauseTimer)
}
const onTouchMove = (e: TouchEvent) => {
  const diff = touchStartY - e.touches[0].clientY // positive = scrolling down
  if (!shouldAutoHideNav.value) {
    revealNav()
    return
  }
  if (Math.abs(diff) < 15) return // ignore tiny movements
  diff > 0 ? hideNav() : revealNav()
}
const onTouchEnd = () => {
  scheduleReveal()
}

// ─── Modal Controls ─────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const showPostModal = ref(false)
const showStoryModal = ref(false)
const showQuickProductModal = ref(false)
const showSearchOverlay = ref(false)
const onOpenSearch = () => {
  if (props.useCustomSearch) {
    useHomeSearch().searchOpen.value = true
    return
  }
  showSearchOverlay.value = true
}
const showNotificationOverlay = ref(false)
const { isOpen: showAI } = useDassaPanel()
// Shared so pages (e.g. product page "View cart") can open the drawer too.
const { isOpen: showCart } = useCartDrawer()
const dismissSellerBanner = ref(false)

const openPostUploader = () => {
  showCreateModal.value = false
  showPostModal.value = true
}
const openStoryUploader = () => {
  showCreateModal.value = false
  showStoryModal.value = true
}
const openQuickProductUploader = () => {
  showCreateModal.value = false
  showQuickProductModal.value = true
}

const handlePost = async () => {
  showPostModal.value = false
  showStoryModal.value = false
  showQuickProductModal.value = false

  // 'layout-data' is the only key that exists — 'homepage-main' and
  // 'profile-data' had no useAsyncData behind them, so those two calls were
  // silent no-ops rather than the refresh they read as.
  await refreshNuxtData('layout-data')
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Catch up on whatever was skipped while the tab was in the background.
let lastRefreshedAt = Date.now()
const onVisibilityChange = () => {
  if (document.visibilityState !== 'visible') return
  if (Date.now() - lastRefreshedAt < 300000) return
  lastRefreshedAt = Date.now()
  refresh()
}

onMounted(() => {
  // Persist banner dismiss
  dismissSellerBanner.value =
    localStorage.getItem('dismissedSellerBanner') === 'true'

  // onMainScroll only fires once the user actually scrolls — without this,
  // nav/sidebars would show over the hero on first paint until that first
  // scroll event.
  if (props.snapHero) {
    hideNav()
    desktopHeroInView.value = true
  }

  // Window scroll — catches document-level scroll (desktop fallback)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  // Touch events — most reliable scroll detection on mobile browsers
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd, { passive: true })

  // Periodic refresh of the layout rails (featured sellers + categories).
  // Skipped while the tab is hidden: a backgrounded tab left open overnight was
  // still calling the API every 5 minutes, which is billed DB work for a screen
  // nobody is looking at — and enough to keep the database from ever idling.
  // A tab coming back to the foreground refreshes immediately, so returning
  // users still see current data.
  refreshInterval = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    lastRefreshedAt = Date.now()
    refresh()
  }, 300000)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  if (refreshInterval) clearInterval(refreshInterval)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (pauseTimer) clearTimeout(pauseTimer)
})

watch(dismissSellerBanner, (val) => {
  if (val) localStorage.setItem('dismissedSellerBanner', 'true')
  else localStorage.removeItem('dismissedSellerBanner')
})
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Seller banner transition */
.seller-banner-enter-active,
.seller-banner-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.seller-banner-enter-from,
.seller-banner-leave-to {
  transform: translateY(120%);
  opacity: 0;
}

/* Safe area insets for mobile bottom only — top padding handled by Tailwind pt-16/pt-28 */
@media (max-width: 767px) {
  .main-scroll {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
