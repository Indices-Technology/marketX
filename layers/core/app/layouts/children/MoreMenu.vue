<!--
  MoreMenu — the ☰ popup on the desktop rail.

  Holds app-level secondary destinations, NOT account identity (that's
  AccountMenu, hung off the avatar). The split matters for two reasons:

   1. Membership here is FIXED, never overflow-driven. A bucket that holds
      "whatever didn't fit this viewport" would move an item between the rail
      and this menu depending on window height, which destroys muscle memory
      and makes support copy unwritable. Decide by importance, not by pixels.
   2. This menu exists for GUESTS too. AccountMenu doesn't render for a
      logged-out visitor (they get a Sign in link instead), so anything
      guest-relevant — Near Me, Help — would vanish for exactly the people who
      need it most if it lived there.

  The parent owns positioning (absolute placement) and open/close state.
-->
<template>
  <div
    class="w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="menu-item"
      @click="$emit('close')"
    >
      <Icon :name="item.icon" size="18" />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <div class="mx-4 my-1.5 h-px bg-gray-100 dark:bg-neutral-800" />

    <!-- Theme — a toggle, not a destination, so it stays put and does not close
         the menu (letting you see the change land before dismissing it). -->
    <button class="menu-item w-full justify-between" @click="toggleTheme">
      <span class="flex items-center gap-3">
        <Icon
          :name="isDark ? 'solar:moon-linear' : 'solar:sun-linear'"
          size="18"
        />
        <span>{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
      </span>
      <span
        class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        :class="isDark ? 'bg-brand' : 'bg-gray-200 dark:bg-neutral-700'"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          :class="isDark ? 'left-[18px]' : 'left-0.5'"
        />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineEmits<{ close: [] }>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

// Fixed membership. Both entries are guest-safe destinations — the account-scoped
// surfaces (Wallet, Affiliate, Orders) live in AccountMenu, which is where a
// signed-in user already looks for their own money.
const items = [
  { label: 'Near Me', to: '/map', icon: 'solar:map-point-linear' },
  { label: 'Help', to: '/help', icon: 'solar:question-circle-linear' },
]
</script>

<style scoped>
.menu-item {
  @apply flex cursor-pointer items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800;
}
</style>
