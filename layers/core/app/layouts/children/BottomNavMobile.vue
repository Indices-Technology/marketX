<!--
  BottomNavMobile — mobile primary navigation.

  Destinations mirror the desktop rail (SideNav) so the app has ONE navigation
  model: Home · Near Me · Create · Squares · Account. Icons come from AppIcon
  (the semantic icon map) so a glyph change lands on both surfaces at once.
-->
<template>
  <nav
    v-bind="$attrs"
    class="bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/60 bg-white/90 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/90"
  >
    <div class="flex h-16 items-center justify-around px-2">
      <!-- Home -->
      <NuxtLink
        to="/"
        class="nav-item"
        :class="{ active: isHome }"
        aria-label="Home"
      >
        <AppIcon name="home" :active="isHome" size="26" />
      </NuxtLink>

      <!-- Near Me -->
      <NuxtLink
        to="/map"
        class="nav-item"
        :class="{ active: isNearby }"
        aria-label="Near Me"
      >
        <AppIcon name="nearby" :active="isNearby" size="26" />
      </NuxtLink>

      <!-- Create (centre CTA) — logged in: open create modal; guest: register -->
      <ClientOnly>
        <button
          v-if="profileStore.isLoggedIn"
          class="sell-btn"
          aria-label="Create a post or listing"
          @click="$emit('create')"
        >
          <AppIcon name="create" size="20" class="text-white" />
          <span class="text-[11px] font-bold leading-none text-white"
            >Create</span
          >
        </button>
        <NuxtLink
          v-else
          to="/user-register"
          class="sell-btn"
          aria-label="Start selling"
        >
          <AppIcon name="create" size="20" class="text-white" />
          <span class="text-[11px] font-bold leading-none text-white"
            >Create</span
          >
        </NuxtLink>
        <template #fallback>
          <div class="sell-btn pointer-events-none opacity-0" />
        </template>
      </ClientOnly>

      <!-- Squares (markets) -->
      <NuxtLink
        to="/squares"
        class="nav-item"
        :class="{ active: isSquares }"
        aria-label="Squares"
      >
        <AppIcon name="squares" :active="isSquares" size="26" />
      </NuxtLink>

      <!-- Account — avatar when signed in, sign-in icon when not.
           Same slot either way, so the bar keeps its shape for guests. -->
      <ClientOnly>
        <div v-if="profileStore.isLoggedIn" ref="menuRef" class="relative">
          <button
            class="nav-item"
            :aria-label="`${profileStore.me?.username ?? 'User'} account menu`"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="menuOpen = !menuOpen"
          >
            <Avatar
              :username="profileStore.me?.username ?? 'User'"
              :avatar="profileStore.me?.avatar ?? ''"
              size="sm"
              class="ring-2 transition-all"
              :class="isProfileActive ? 'ring-brand' : 'ring-transparent'"
            />
          </button>

          <Transition name="menu-pop">
            <AccountMenu
              v-if="menuOpen"
              class="absolute bottom-full right-0 z-50 mb-3"
              @close="menuOpen = false"
              @logout="handleLogout"
            />
          </Transition>
        </div>

        <NuxtLink v-else to="/user-login" class="nav-item" aria-label="Sign in">
          <AppIcon name="signin" size="26" />
        </NuxtLink>

        <template #fallback>
          <div class="nav-item" />
        </template>
      </ClientOnly>
    </div>
  </nav>

  <!-- Backdrop -->
  <Teleport to="body">
    <div v-if="menuOpen" class="fixed inset-0 z-20" @click="menuOpen = false" />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import AppIcon from '~~/layers/ui/app/components/AppIcon.vue'
import AccountMenu from './AccountMenu.vue'

defineEmits(['create'])
defineOptions({ inheritAttrs: false })

const route = useRoute()
const profileStore = useProfileStore()
const { logout } = useAuth()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const isHome = computed(() => route.path === '/')
const isNearby = computed(() => route.path.startsWith('/map'))
const isSquares = computed(() => route.path.startsWith('/squares'))
const isProfileActive = computed(
  () => route.path.startsWith('/profile') || route.path.startsWith('/seller'),
)

const handleLogout = async () => {
  menuOpen.value = false
  await logout()
}

const onClickOutside = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutside, true))
onUnmounted(() => document.removeEventListener('click', onClickOutside, true))
</script>

<style scoped>
.bottom-nav {
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transition: transform 0.25s ease;
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.nav-item {
  @apply relative flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-500 dark:hover:text-neutral-100;
}

.nav-item.active {
  @apply text-brand dark:text-brand;
}

/* Create button — the one brand-filled element in the bar */
.sell-btn {
  @apply flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-brand shadow-lg shadow-brand/30 transition-transform active:scale-95;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
