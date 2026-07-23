<!-- ~~/layers/core/app/layouts/children/SideNav.vue -->
<template>
  <div class="flex h-full flex-col p-3" :class="{ expanded }">
    <!-- Logo — MX mark when collapsed, full wordmark when expanded -->
    <NuxtLink
      to="/"
      class="mb-6 flex h-9 shrink-0 items-center"
      :class="expanded ? 'justify-start px-1' : 'justify-center'"
      aria-label="MarketX"
    >
      <span v-if="expanded" class="brand-wordmark inline-flex">
        <span>Market</span><span class="brand-x">X</span>
      </span>
      <span
        v-else
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black italic text-white shadow-sm shadow-brand/25"
      >
        MX
      </span>
    </NuxtLink>

    <!-- Scrollable nav area — profile stays pinned below this -->
    <div class="nav-scroll min-h-0 flex-1 overflow-y-auto">
      <!-- Primary Navigation -->
      <p class="nav-group-label">Shop</p>
      <nav class="flex flex-col space-y-4">
        <NuxtLink to="/" class="nav-button group" :class="{ active: isHome }">
          <AppIcon name="home" :active="isHome" size="24" />
          <span class="nav-text">Home</span>
        </NuxtLink>

        <NuxtLink to="/discover" class="nav-button group" active-class="active">
          <AppIcon name="discover" :active="isDiscover" size="24" />
          <span class="nav-text">Discover</span>
        </NuxtLink>

        <NuxtLink to="/reels" class="nav-button group" active-class="active">
          <AppIcon name="reels" :active="isReels" size="24" />
          <span class="nav-text">Reels</span>
        </NuxtLink>

        <NuxtLink to="/map" class="nav-button group" active-class="active">
          <AppIcon name="nearby" :active="isNearby" size="24" />
          <span class="nav-text">Near Me</span>
        </NuxtLink>

        <NuxtLink to="/squares" class="nav-button group" active-class="active">
          <AppIcon name="squares" :active="isSquares" size="24" />
          <span class="nav-text">Squares</span>
        </NuxtLink>
      </nav>

      <!-- Sell — one ClientOnly wrapper for the whole auth-dependent group so
           the rail hydrates in a single step instead of popping in per item. -->
      <ClientOnly>
        <template v-if="profileStore.isLoggedIn">
          <p class="nav-group-label mt-4">Sell</p>

          <!-- Seller entry point: Start Selling (users without a store) -->
          <NuxtLink
            v-if="!sellerStore.hasSellers"
            to="/sellers/create"
            class="mt-2 flex items-center gap-4 rounded-xl border border-dashed border-brand/30 px-3 py-2.5 text-brand/80 transition-all hover:border-brand/60 hover:bg-brand/5 hover:text-brand"
          >
            <Icon name="solar:shop-2-linear" size="24" />
            <span class="nav-text font-semibold">Start Selling</span>
          </NuxtLink>

          <!-- Seller Hub (only for users who have stores) -->
          <div v-else class="relative mt-2">
            <!-- Single store → direct link -->
            <NuxtLink
              v-if="sellerStore.sellers.length === 1"
              :to="`/seller/${sellerStore.sellers[0].store_slug}/dashboard`"
              class="seller-hub-btn group"
              :class="{ active: isSellerRoute }"
            >
              <div
                class="relative flex h-6 w-6 shrink-0 items-center justify-center"
              >
                <img
                  v-if="sellerStore.sellers[0].store_logo"
                  :src="sellerStore.sellers[0].store_logo"
                  :alt="sellerStore.sellers[0].store_name || 'Store'"
                  class="h-6 w-6 rounded-md object-cover"
                />
                <Icon v-else name="solar:shop-2-linear" size="24" />
                <span
                  v-if="isSellerRoute"
                  class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900"
                />
              </div>
              <span class="nav-text">Seller Hub</span>
              <span
                v-if="isSellerRoute"
                class="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                :class="expanded ? 'inline' : 'hidden'"
                >Active</span
              >
            </NuxtLink>

            <!-- Multiple stores → picker trigger -->
            <button
              v-else
              class="seller-hub-btn group w-full"
              :class="{ active: isSellerRoute }"
              @click="storePickerOpen = !storePickerOpen"
            >
              <div
                class="relative flex h-6 w-6 shrink-0 items-center justify-center"
              >
                <Icon name="solar:shop-2-linear" size="24" />
                <span
                  v-if="isSellerRoute"
                  class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900"
                />
              </div>
              <span class="nav-text">Seller Hub</span>
              <span
                class="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-neutral-800 dark:text-neutral-400"
                :class="expanded ? 'inline' : 'hidden'"
              >
                {{ sellerStore.sellers.length }}
              </span>
            </button>

            <!-- Store picker panel (multi-store) -->
            <Transition name="menu-pop">
              <div
                v-if="storePickerOpen"
                class="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
              >
                <p
                  class="px-4 pb-2 pt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
                >
                  Switch Store
                </p>
                <NuxtLink
                  v-for="store in sellerStore.sellers"
                  :key="store.id"
                  :to="`/seller/${store.store_slug}/dashboard`"
                  class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                  @click="storePickerOpen = false"
                >
                  <div
                    class="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <img
                      v-if="store.store_logo"
                      :src="store.store_logo"
                      :alt="store.store_name || 'Store'"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center"
                    >
                      <Icon
                        name="solar:shop-2-bold"
                        size="18"
                        class="text-gray-400 dark:text-neutral-500"
                      />
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ store.store_name || 'Unnamed Store' }}
                    </p>
                    <p class="text-[11px] text-gray-400 dark:text-neutral-500">
                      @{{ store.store_slug }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="
                      store.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'
                    "
                    >{{ store.is_active ? 'Live' : 'Off' }}</span
                  >
                </NuxtLink>
                <div
                  class="border-t border-gray-200 p-2 dark:border-neutral-700"
                >
                  <NuxtLink
                    to="/sellers/create"
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
                    @click="storePickerOpen = false"
                  >
                    <Icon name="solar:add-circle-linear" size="16" />
                    <span>Add new store</span>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </ClientOnly>

      <!-- You -->
      <p class="nav-group-label mt-4">You</p>

      <!-- User actions — auth-dependent rows hydrate together -->
      <nav class="flex flex-col space-y-1">
        <ClientOnly>
          <!-- Create -->
          <button
            v-if="profileStore.isLoggedIn"
            class="sell-button group"
            @click="$emit('create')"
          >
            <AppIcon name="create" size="24" />
            <span class="nav-text">Create</span>
          </button>
          <NuxtLink v-else to="/user-register" class="sell-button group">
            <AppIcon name="create" size="24" />
            <span class="nav-text">Create</span>
          </NuxtLink>

          <!-- Notifications -->
          <button
            v-if="profileStore.isLoggedIn"
            class="nav-button group relative"
            @click="$emit('open-notifications')"
          >
            <div class="relative">
              <AppIcon name="notifications" size="24" />
              <span
                v-if="unreadCount > 0"
                class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white"
                >{{ unreadCount > 99 ? '99+' : unreadCount }}</span
              >
            </div>
            <span class="nav-text">Notifications</span>
          </button>

          <!-- Inbox / Messages -->
          <NuxtLink
            v-if="profileStore.isLoggedIn"
            to="/messages"
            class="nav-button group relative"
            active-class="active"
          >
            <div class="relative">
              <AppIcon name="inbox" :active="isInbox" size="24" />
              <span
                v-if="messageCount > 0"
                class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white"
                >{{ messageCount > 99 ? '99+' : messageCount }}</span
              >
            </div>
            <span class="nav-text">Inbox</span>
          </NuxtLink>

          <template #fallback>
            <!-- Reserve the Create row so the rail doesn't jump on hydration -->
            <div class="h-[44px]" />
          </template>
        </ClientOnly>

        <!-- Cart -->
        <button class="nav-button group relative" @click="$emit('open-cart')">
          <div class="relative">
            <AppIcon name="cart" size="24" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white"
              >{{ cartCount > 99 ? '99+' : cartCount }}</span
            >
          </div>
          <span class="nav-text">{{ $t('nav.cart') }}</span>
        </button>
      </nav>
    </div>
    <!-- end scrollable nav area -->

    <!-- Profile — always pinned to bottom, never scrolls away -->
    <div class="relative shrink-0 pb-2 pt-1">
      <ClientOnly>
        <button
          v-if="profileStore.isLoggedIn"
          class="nav-button group w-full justify-between"
          :class="{ 'bg-gray-100 dark:bg-neutral-800': menuOpen }"
          @click="menuOpen = !menuOpen"
        >
          <div class="flex items-center gap-3">
            <Avatar
              :username="profileStore.me?.username || 'User'"
              :avatar="profileStore.me?.avatar ?? undefined"
              size="md"
              class="ring-2 ring-gray-200 dark:ring-neutral-700"
            />
            <span
              v-show="expanded"
              class="max-w-[140px] truncate font-medium text-gray-900 dark:text-white"
            >
              {{ profileStore.me?.username || 'Profile' }}
            </span>
          </div>
          <Icon
            name="solar:alt-arrow-up-linear"
            size="20"
            class="text-gray-500 transition-transform"
            :class="{ 'rotate-180': menuOpen, hidden: !expanded }"
          />
        </button>

        <!-- Guest: sign-in is the primary action down here, so it carries
             brand emphasis rather than reading as another muted nav row. -->
        <NuxtLink
          v-else
          to="/user-login"
          class="nav-button group border border-brand/30 text-brand hover:border-brand/60 hover:bg-brand/5 hover:text-brand dark:text-brand dark:hover:bg-brand/10 dark:hover:text-brand"
        >
          <AppIcon name="signin" size="24" />
          <span class="nav-text font-semibold">{{ $t('nav.signIn') }}</span>
        </NuxtLink>

        <template #fallback>
          <div class="h-[52px]" />
        </template>
      </ClientOnly>

      <!-- Account popup — shared with the mobile bar (AccountMenu.vue) -->
      <Transition name="menu-pop">
        <AccountMenu
          v-if="menuOpen && profileStore.isLoggedIn"
          class="absolute bottom-full left-0 z-50 mb-3"
          @close="menuOpen = false"
          @logout="logout"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useChatStore } from '~~/layers/profile/app/stores/chat.store'
import { useChat } from '~~/layers/profile/app/composables/useChat'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import AppIcon from '~~/layers/ui/app/components/AppIcon.vue'
import AccountMenu from './AccountMenu.vue'

defineEmits(['create', 'open-notifications', 'open-cart'])

// Driven by the layout: true while the rail is hovered/focused → show labels.
defineProps<{ expanded?: boolean }>()

const route = useRoute()
const { logout } = useAuth()
const profileStore = useProfileStore()
const notificationStore = useNotificationStore()
const sellerStore = useSellerStore()
const chatStore = useChatStore()
const { cartCount } = useCart()

const isHome = computed(() => route.path === '/')
const isDiscover = computed(() => route.path === '/discover')
const isReels = computed(() => route.path.startsWith('/reels'))
const isNearby = computed(() => route.path.startsWith('/map'))
const isInbox = computed(() => route.path.startsWith('/messages'))
const isSquares = computed(() => route.path.startsWith('/squares'))
const isSellerRoute = computed(() => route.path.startsWith('/seller'))
const unreadCount = computed(() => notificationStore.unreadCount)
// Server-computed total across ALL conversations (not just the loaded page).
const messageCount = computed(() => chatStore.totalUnread)

const menuOpen = ref(false)
const storePickerOpen = ref(false)

const onClickOutside = (e: MouseEvent) => {
  const profileMenu = document.querySelector('.bottom-profile-menu')
  if (profileMenu && !profileMenu.contains(e.target as Node))
    menuOpen.value = false
  const pickerEl = document.querySelector('.store-picker-anchor')
  if (pickerEl && !pickerEl.contains(e.target as Node))
    storePickerOpen.value = false
}

const { fetchUnreadCount } = useChat()
onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
  if (profileStore.isLoggedIn) fetchUnreadCount()
})
onUnmounted(() => document.removeEventListener('click', onClickOutside, true))
</script>

<style scoped>
.nav-button {
  @apply flex items-center gap-4 rounded-xl px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white;
}

.nav-button.active {
  @apply bg-brand/10 font-semibold text-gray-900 dark:bg-brand/20 dark:text-white;
}

.sell-button {
  @apply flex items-center gap-4 rounded-xl px-3 py-2.5 font-semibold text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white;
}

.seller-hub-btn {
  @apply flex items-center gap-4 rounded-xl px-3 py-2.5 font-semibold text-gray-600 transition-all hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300;
}

.seller-hub-btn.active {
  @apply bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300;
}

/* On the collapsed icon rail the labels are visually hidden but kept in the
   accessibility tree (sr-only), so every nav link still has an accessible name
   for screen-reader and keyboard users. Expanding (hover/focus) reveals them. */
.nav-text {
  @apply text-[15px];
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.expanded .nav-text {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

.nav-group-label {
  @apply px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500;
  display: none;
}
.expanded .nav-group-label {
  display: block;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: all 0.18s ease;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

/* Hide scrollbar on the nav scroll area — users can still scroll if needed */
.nav-scroll::-webkit-scrollbar {
  display: none;
}
.nav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.brand-wordmark {
  align-items: baseline;
  font-family: Archivo, Manrope, system-ui, sans-serif;
  font-size: 1.24rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
  color: rgb(17 24 39);
}

:global(.dark) .brand-wordmark,
:global(.theme-dark-mode) .brand-wordmark {
  color: white;
}

.brand-x {
  margin-left: 1px;
  color: #f43f5e;
  font-style: italic;
  transform: translateY(-0.03em) skewX(-8deg);
}
</style>
