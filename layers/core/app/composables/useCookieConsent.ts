/**
 * Cookie consent — the choice about NON-essential cookies only.
 *
 * Sign-in, OAuth handoff and CSRF cookies are strictly necessary: the site
 * cannot work without them, no consent is required for them, and this composable
 * has no say over them. What it governs is tracking that exists to serve us
 * rather than the visitor — today that means the Meta Pixel.
 *
 * The choice is kept in localStorage rather than a cookie on purpose: writing a
 * cookie to record "no cookies please" is a poor answer, and localStorage is not
 * sent to the server, so it can't leak into request headers.
 *
 * Nothing non-essential may load until `status` is 'accepted'. Silence is not
 * consent, so 'unset' behaves exactly like 'rejected' for loading decisions.
 */
import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export type ConsentStatus = 'unset' | 'accepted' | 'rejected'

const STORAGE_KEY = 'marketx:cookie-consent'

// Module-level so every caller — the banner, the pixel plugin, the settings
// page — reads and reacts to one value.
const status = ref<ConsentStatus>('unset')
let hydrated = false

// Deliberately a capability check rather than `import.meta.client`: what this
// needs is somewhere to store the answer, which is exactly what's absent during
// SSR — and what the test environment has even though the Nuxt client flag is
// undefined there. Don't swap it back.
const canStore = () => typeof localStorage !== 'undefined'

const readStored = (): ConsentStatus => {
  if (!canStore()) return 'unset'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'accepted' || raw === 'rejected' ? raw : 'unset'
  } catch {
    // Private mode or storage disabled — treat as no answer given, which means
    // nothing non-essential loads. Failing closed is the safe direction.
    return 'unset'
  }
}

const persist = (value: ConsentStatus) => {
  status.value = value
  if (!canStore()) return
  try {
    if (value === 'unset') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* choice still applies for this page view */
  }
}

export const useCookieConsent = () => {
  const config = useRuntimeConfig()

  if (canStore() && !hydrated) {
    status.value = readStored()
    hydrated = true
  }

  /**
   * Is there anything to ask about? With no tracker configured we set no
   * non-essential cookies at all, and a banner asking permission for nothing
   * would be theatre — worse, it trains people to dismiss the real one.
   */
  const hasOptionalTrackers = computed(() => Boolean(config.public.metaPixelId))

  const needsChoice = computed(
    () => hasOptionalTrackers.value && status.value === 'unset',
  )

  /** The only state that permits loading a tracker. */
  const trackingAllowed = computed(
    () => hasOptionalTrackers.value && status.value === 'accepted',
  )

  const accept = () => persist('accepted')

  /**
   * Rejecting cannot un-run a tracker that already loaded, so the page reloads
   * to drop it. Only ever called from a click, and only when tracking was on.
   */
  const reject = () => {
    const wasAllowed = trackingAllowed.value
    persist('rejected')
    if (wasAllowed && typeof window !== 'undefined') window.location.reload()
  }

  /** Lets someone change their mind — the banner comes back. */
  const reset = () => persist('unset')

  return {
    status: computed(() => status.value),
    hasOptionalTrackers,
    needsChoice,
    trackingAllowed,
    accept,
    reject,
    reset,
  }
}
