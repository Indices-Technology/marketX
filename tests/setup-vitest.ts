import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  nextTick,
  toRef,
  toRefs,
  readonly,
} from 'vue'
import { defineStore } from 'pinia'

// ── Vue reactivity globals ─────────────────────────────────────────────────────
// Components that rely on Nuxt auto-imports for Vue APIs (no explicit import)
// need these available as globals in the Vitest environment.
vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('useAsyncStatus', () => {
  const isLoading = ref(false)
  const hasFetchedOnce = ref(false)
  return {
    isLoading,
    hasFetchedOnce,
    isInitialLoad: computed(() => isLoading.value || !hasFetchedOnce.value),
    begin: () => { isLoading.value = true },
    end: () => { isLoading.value = false; hasFetchedOnce.value = true },
    reset: () => { isLoading.value = false; hasFetchedOnce.value = false },
  }
})

vi.stubGlobal('ref', ref)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)
vi.stubGlobal('onBeforeMount', onBeforeMount)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('toRef', toRef)
vi.stubGlobal('toRefs', toRefs)
vi.stubGlobal('readonly', readonly)

// ── Global component stubs ─────────────────────────────────────────────────────
config.global.stubs = {
  Icon: { template: '<span />' },
  NuxtLink: { template: '<a><slot /></a>' },
  NuxtImg: { template: '<img />' },
  NuxtPicture: { template: '<picture />' },
  ModalsLikesModal: true,
}

// ── Nuxt auto-import composable stubs ─────────────────────────────────────────
// Components that rely on Nuxt auto-imports (no explicit import statement) need
// these globals in the test environment.
vi.stubGlobal('useCart', () => ({
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  items: ref([]),
  cartCount: ref(0),
  cartTotal: ref(0),
  isLoading: ref(false),
  hasFetchedOnce: ref(false),
  fetchCart: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn(),
}))

// $fetch — silence network calls in unit tests by default
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ data: null, meta: null }))

vi.stubGlobal('useProduct', () => ({
  likeProduct: vi.fn(),
  unlikeProduct: vi.fn(),
}))

vi.stubGlobal('useCurrency', () => ({
  formatPrice: (val: number) => `₦${val}`,
}))

// ── Browser API stubs ─────────────────────────────────────────────────────────
// jsdom does not implement IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// jsdom's HTMLMediaElement play/pause are not implemented
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  value: vi.fn().mockResolvedValue(undefined),
  writable: true,
})
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  value: vi.fn(),
  writable: true,
})
