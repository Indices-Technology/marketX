<!--
  AccountMenu — the single definition of the signed-in account popup.

  SideNav (desktop rail) and BottomNavMobile (mobile bar) both render this, so
  the same actions appear in the same order with the same labels on every
  surface. Add or rename an account action HERE, not in the nav components.

  The parent owns positioning (absolute placement) and open/close state.
-->
<template>
  <div
    class="w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Identity header — who you are signed in as -->
    <NuxtLink
      :to="`/profile/${username}`"
      class="flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
      @click="$emit('close')"
    >
      <Avatar :username="username" :avatar="avatar" size="md" />
      <div class="min-w-0">
        <p class="t-subheading truncate">{{ username }}</p>
        <p class="t-meta truncate">View your profile</p>
      </div>
    </NuxtLink>

    <template
      v-for="(item, i) in items"
      :key="item.divider ? `d${i}` : item.to"
    >
      <div
        v-if="item.divider"
        class="mx-4 my-1.5 h-px bg-gray-100 dark:bg-neutral-800"
      />
      <NuxtLink
        v-else
        :to="item.to!"
        class="menu-item"
        :class="item.tone === 'danger' ? 'menu-item-danger' : ''"
        @click="$emit('close')"
      >
        <Icon :name="item.icon" size="18" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </template>

    <div class="mx-4 my-1.5 h-px bg-gray-100 dark:bg-neutral-800" />

    <button class="menu-item menu-item-danger w-full" @click="$emit('logout')">
      <Icon name="solar:logout-3-linear" size="18" />
      <span>Log Out</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'

defineEmits<{ close: []; logout: [] }>()

const route = useRoute()
const profileStore = useProfileStore()
const sellerStore = useSellerStore()

const username = computed(() => profileStore.me?.username ?? 'User')
const avatar = computed(() => profileStore.me?.avatar ?? undefined)
const isSellerRoute = computed(() => route.path.startsWith('/seller'))
const isStaff = computed(
  () =>
    profileStore.me?.role === 'admin' || profileStore.me?.role === 'moderator',
)

interface MenuEntry {
  label?: string
  to?: string
  icon?: string
  tone?: 'danger'
  divider?: boolean
}

const items = computed<MenuEntry[]>(() => {
  // Money-and-orders group. Affiliate/Wallet live here rather than in the ☰ More
  // menu because this component is shared by the desktop rail AND the mobile bar
  // — putting them in More would duplicate them on desktop while leaving mobile
  // (which has no room for a ☰) with no route to them at all.
  const entries: MenuEntry[] = [
    { label: 'My Orders', to: '/buyer/orders', icon: 'solar:box-linear' },
    {
      label: 'Wallet',
      to: `/profile/${username.value}?tab=wallet`,
      icon: 'solar:wallet-linear',
    },
    { label: 'Affiliate', to: '/affiliate', icon: 'solar:money-bag-linear' },
  ]

  if (sellerStore.hasSellers) {
    // Label the destination, not the "mode". One name — "Seller Hub" — across
    // the desktop rail, this menu and the mobile dock, so the same tap target
    // isn't called three different things depending on where you found it.
    entries.push(
      isSellerRoute.value
        ? { label: 'Back to Shopping', to: '/', icon: 'solar:bag-4-linear' }
        : {
            label: 'Seller Hub',
            to:
              sellerStore.sellers.length === 1
                ? `/seller/${sellerStore.sellers[0].store_slug}/dashboard`
                : '/seller/dashboard',
            icon: 'solar:shop-2-linear',
          },
    )
  } else {
    entries.push({
      label: 'Start Selling',
      to: '/sellers/create',
      icon: 'solar:shop-2-linear',
    })
  }

  entries.push(
    { divider: true },
    { label: 'Settings', to: '/settings', icon: 'solar:settings-linear' },
  )

  if (isStaff.value) {
    entries.push({
      label: 'Admin Panel',
      to: '/admin',
      icon: 'solar:shield-star-linear',
      tone: 'danger',
    })
  }

  return entries
})
</script>

<style scoped>
.menu-item {
  @apply flex cursor-pointer items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800;
}

.menu-item-danger {
  @apply text-red-600 hover:bg-red-50/80 dark:text-red-400 dark:hover:bg-red-950/30;
}
</style>
