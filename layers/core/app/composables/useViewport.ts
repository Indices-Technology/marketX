import { ref, onMounted, onUnmounted } from 'vue'

// Matches the 768px breakpoint already used everywhere else in this codebase
// (Tailwind's `md:`, HeaderNavMobile's `.mobile-header { @media (min-width:768px) }`).
const DESKTOP_QUERY = '(min-width: 768px)'

// Module-level singleton — one shared listener regardless of how many
// components call this, same pattern as useFeedTab/useNavVisibility.
const isDesktop = ref(false) // mobile-first default until the client mounts
let initialized = false
let mql: MediaQueryList | null = null

const onChange = (e: MediaQueryListEvent) => {
  isDesktop.value = e.matches
}

export const useViewport = () => {
  if (import.meta.client && !initialized) {
    initialized = true
    mql = window.matchMedia(DESKTOP_QUERY)
    isDesktop.value = mql.matches
    mql.addEventListener('change', onChange)
  }

  onMounted(() => {
    if (mql) isDesktop.value = mql.matches
  })

  onUnmounted(() => {
    // Intentionally not removing the listener — this is a shared singleton
    // used across the app's lifetime, not scoped to one component instance.
  })

  return { isDesktop }
}
