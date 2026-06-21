<template>
  <header
    class="mobile-header border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/80"
  >
    <div class="flex h-14 items-center gap-2 px-4">
      <!-- Logo -->
      <NuxtLink to="/" class="flex shrink-0 items-center">
        <span class="brand-wordmark" aria-label="MarketX">
          <span>Market</span><span class="brand-x">X</span>
        </span>
      </NuxtLink>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-1">
        <button
          aria-label="Search"
          class="header-button"
          @click="$emit('open-search')"
        >
          <Icon name="mdi:magnify" size="24" />
        </button>
        <button
          aria-label="Cart"
          class="header-button"
          @click="$emit('open-cart')"
        >
          <div class="relative">
            <Icon name="mdi:shopping-outline" size="24" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-0.5 text-[9px] font-bold text-white"
              >{{ cartCount > 9 ? '9+' : cartCount }}</span
            >
          </div>
        </button>

        <ClientOnly>
          <button
            v-if="profileStore.isLoggedIn"
            aria-label="Notifications"
            class="header-button relative"
            @click="$emit('open-notifications')"
          >
            <Icon name="mdi:bell-outline" size="24" />
            <span
              v-if="unreadCount > 0"
              class="absolute right-0 top-0 block h-2 w-2 rounded-full bg-brand"
            ></span>
          </button>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'

defineEmits(['open-notifications', 'open-cart', 'open-search'])

const profileStore = useProfileStore()
const notificationStore = useNotificationStore()

const { cartCount } = useCart()

const unreadCount = computed(() => notificationStore.unreadCount)
</script>

<style scoped>
.mobile-header {
  padding-top: env(safe-area-inset-top, 0px);
}

/* Hide on desktop */
@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }
}

.header-button {
  @apply rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100;
}

.brand-wordmark {
  display: inline-flex;
  align-items: baseline;
  font-family: Sora, Manrope, system-ui, sans-serif;
  font-size: 1.12rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
  color: rgb(17 24 39);
}

:global(.dark) .brand-wordmark,
:global(.theme-dark-mode) .brand-wordmark {
  color: rgb(245 245 245);
}

.brand-x {
  margin-left: 1px;
  color: #f43f5e;
  font-style: italic;
  transform: translateY(-0.03em) skewX(-8deg);
}
</style>
