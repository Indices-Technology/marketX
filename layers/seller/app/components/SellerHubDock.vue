<!--
  SellerHubDock — the mobile home-screen entry point into a seller's dashboard.

  Desktop sellers get a first-class "Seller Hub" item in the rail (SideNav.vue).
  Mobile had no equivalent: the only route in was AccountMenu's "Switch to Seller
  Mode" — two taps, behind an avatar that reads as "profile", under a label you
  can't see until the menu is already open. A seller signing in on a phone had to
  go hunting for their own store. This is the missing counterpart.

  Deliberately a fixed dock rather than a card inlined at the top of the feed:
  the default mobile home (MinimalHome) is a full-viewport snap-scroll, so an
  inline card would either break the snap or scroll away on the first swipe —
  and a seller entry point that disappears after one swipe is the problem we're
  fixing, not the fix. Same slot and mechanism as HomeLayout's existing "Start
  Selling" banner, which serves the inverse audience; the two are mutually
  exclusive by construction (hasSellers).

  Destination mirrors SideNav/AccountMenu exactly: one store goes straight to its
  dashboard, several land on the chooser.
-->
<template>
  <Transition name="seller-dock">
    <div
      v-if="visible"
      class="fixed bottom-16 left-0 right-0 z-20 px-3 pb-2 md:hidden"
    >
      <div
        class="flex items-center gap-2.5 rounded-2xl border border-gray-200/60 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-md dark:border-neutral-700/60 dark:bg-neutral-900/95"
      >
        <NuxtLink
          :to="destination"
          class="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <div class="relative shrink-0">
            <img
              v-if="primaryStore?.store_logo"
              :src="primaryStore.store_logo"
              :alt="primaryStore.store_name || 'Store'"
              class="h-9 w-9 rounded-xl object-cover"
            />
            <div
              v-else
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10"
            >
              <Icon name="solar:shop-2-linear" size="18" class="text-brand" />
            </div>
            <span
              v-if="pendingOrders > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900"
              >{{ pendingOrders > 9 ? '9+' : pendingOrders }}</span
            >
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="truncate text-[12px] font-bold leading-tight text-gray-900 dark:text-neutral-100"
            >
              {{ title }}
            </p>
            <p class="truncate text-[10px] text-gray-500 dark:text-neutral-400">
              {{ subtitle }}
            </p>
          </div>

          <span
            class="shrink-0 whitespace-nowrap rounded-xl bg-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-sm"
          >
            Dashboard →
          </span>
        </NuxtLink>

        <button
          class="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          aria-label="Hide seller dashboard shortcut"
          @click="dismissed = true"
        >
          <Icon name="solar:close-circle-linear" size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'

// The floating AI chat button occupies the same corner and has to lift clear
// when this dock is up (same contract HomeLayout's "Start Selling" banner uses
// via :banner-visible). Emitted rather than derived by the parent because the
// dismiss state lives here.
const emit = defineEmits<{ visibility: [boolean] }>()

const profileStore = useProfileStore()
const sellerStore = useSellerStore()
const orderApi = useOrderApi()

// Session-scoped, not persisted: a seller who hides it today should still find
// their store waiting tomorrow. Persisting the dismissal would quietly recreate
// the "where is my dashboard?" problem this component exists to solve.
const dismissed = ref(false)

const visible = computed(
  () => !dismissed.value && profileStore.isLoggedIn && sellerStore.hasSellers,
)

watch(visible, (v) => emit('visibility', v), { immediate: true })

const primaryStore = computed(() =>
  sellerStore.sellers.length === 1 ? sellerStore.sellers[0] : null,
)

const destination = computed(() =>
  primaryStore.value
    ? `/seller/${primaryStore.value.store_slug}/dashboard`
    : '/seller/dashboard',
)

const pendingOrders = ref(0)

const title = computed(() =>
  primaryStore.value
    ? primaryStore.value.store_name || 'Your store'
    : `Your ${sellerStore.sellers.length} stores`,
)

const subtitle = computed(() => {
  if (pendingOrders.value > 0) {
    return `${pendingOrders.value} order${pendingOrders.value === 1 ? '' : 's'} awaiting you`
  }
  return primaryStore.value
    ? 'Manage orders and products'
    : 'Pick a store to manage'
})

// Only meaningful for a single store — the multi-store dock links to the chooser
// rather than any one store, so a combined count would badge a destination that
// doesn't show it.
const loadPendingOrders = async () => {
  const slug = primaryStore.value?.store_slug
  if (!slug) {
    pendingOrders.value = 0
    return
  }
  try {
    const res = await orderApi.getSellerPendingCount(slug)
    pendingOrders.value = res?.data?.count ?? 0
  } catch {
    // A missing badge is strictly better than a broken dock.
    pendingOrders.value = 0
  }
}

onMounted(loadPendingOrders)

// The seller store hydrates asynchronously after login (auth-init plugin), so
// on a fresh sign-in the slug usually isn't there yet when this first mounts.
watch(() => primaryStore.value?.store_slug, loadPendingOrders)
</script>

<style scoped>
.seller-dock-enter-active,
.seller-dock-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.seller-dock-enter-from,
.seller-dock-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
