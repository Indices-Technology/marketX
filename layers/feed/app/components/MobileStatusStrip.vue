<!--
  MobileStatusStrip — the signed-in user's own state, at the top of mobile home.

  This is the status-card answer to "we want a mobile dashboard": a launcher is
  what you build when you don't know what the user needs, a status card is what
  you build when you do. Every tile carries live state and one action, and a
  tile with nothing to say does not render at all — so the strip shrinks to
  nothing for a user with a quiet account instead of parking a permanent menu
  between them and the feed.

  COST: one COUNT query per session. Everything else is already in a store by
  the time home paints:
    - sellerStore.sellers   auth-init.ts hydrateSellerStore()
    - cartCount             useCart(), shared with the header
    - pendingOrders         useSellerPendingOrders(), held for the session so
                            returning to home does not refetch it
    - activeOrders          the one fetch — a single COUNT, held for the session
                            by useBuyerActiveOrders

  NOT shown, on purpose:
    - Messages. A persistent chat button already sits on every mobile screen;
      a tile for it is a second door into the same room.
    - Notification counts. "4 updates" that open onto nothing pending is worse
      than no tile at all — it teaches the user the panel lies. Order state is
      the only "update" here, and it comes from the orders themselves.
-->
<template>
  <ClientOnly>
    <div v-if="visible" class="mb-3 px-3">
      <!-- Horizontal snap-scroll: the "swipeable card" without turning home
           into a screen you have to get past. -->
      <div
        class="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      >
        <NuxtLink
          v-for="tile in tiles"
          :key="tile.key"
          :to="tile.to"
          class="flex min-w-[8.5rem] shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
          @click="tile.onClick?.($event)"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            :class="tile.tone"
          >
            <Icon :name="tile.icon" size="17" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[13px] font-bold leading-tight text-gray-900 dark:text-neutral-100"
            >
              {{ tile.value }}
            </p>
            <p class="truncate text-[10px] text-gray-500 dark:text-neutral-400">
              {{ tile.label }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { useSellerPendingOrders } from '~~/layers/seller/app/composables/useSellerPendingOrders'
import { useBuyerActiveOrders } from '~~/layers/commerce/app/composables/useBuyerActiveOrders'

const profileStore = useProfileStore()
const sellerStore = useSellerStore()
const { cartCount } = useCart()
const { pendingOrders } = useSellerPendingOrders()
const { activeOrders, loadActiveOrders } = useBuyerActiveOrders()

onMounted(() => {
  if (profileStore.isLoggedIn) loadActiveOrders()
})

const primaryStore = computed(() => sellerStore.sellers[0] ?? null)

interface Tile {
  key: string
  value: string
  label: string
  icon: string
  tone: string
  to: string
}

/**
 * Ordered by what costs the user most to miss. A seller who has not shipped is
 * losing money and reputation; an unread message may be a sale in progress; a
 * left-behind cart is the softest of the three.
 */
const tiles = computed<Tile[]>(() => {
  if (!profileStore.isLoggedIn) return []
  const out: Tile[] = []

  if (pendingOrders.value > 0 && primaryStore.value?.store_slug) {
    out.push({
      key: 'ship',
      value: String(pendingOrders.value),
      label: pendingOrders.value === 1 ? 'order to ship' : 'orders to ship',
      icon: 'solar:box-linear',
      tone: 'bg-brand/10 text-brand',
      to: `/seller/${primaryStore.value.store_slug}/orders`,
    })
  }

  // Real order state, not a notification tally: this tile only appears when
  // the buyer genuinely has something in flight, and tapping it lands on those
  // exact orders.
  if (activeOrders.value > 0) {
    out.push({
      key: 'orders',
      value: String(activeOrders.value),
      label:
        activeOrders.value === 1 ? 'order on the way' : 'orders on the way',
      icon: 'solar:delivery-linear',
      tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      to: '/buyer/orders',
    })
  }

  if (cartCount.value > 0) {
    out.push({
      key: 'cart',
      value: String(cartCount.value),
      label: cartCount.value === 1 ? 'item in cart' : 'items in cart',
      icon: 'solar:cart-large-2-linear',
      tone: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300',
      to: '/checkout',
    })
  }

  // Seller Hub last: it is a destination, not a piece of news. Lives here now
  // instead of the floating SellerHubDock, which overlapped page content and
  // came back after being dismissed whenever a layout swap remounted it.
  if (sellerStore.hasSellers) {
    const many = sellerStore.sellers.length > 1
    out.push({
      key: 'hub',
      value: many ? `${sellerStore.sellers.length} stores` : 'Seller Hub',
      label: many ? 'pick one to manage' : 'manage your store',
      icon: 'solar:shop-2-linear',
      tone: 'bg-brand/10 text-brand',
      to:
        many || !primaryStore.value?.store_slug
          ? '/seller/dashboard'
          : `/seller/${primaryStore.value.store_slug}/dashboard`,
    })
  }

  return out
})

const visible = computed(() => tiles.value.length > 0)
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
