// Loads the Meta Pixel when NUXT_PUBLIC_META_PIXEL_ID is set AND the visitor has
// allowed it, so ad campaigns (e.g. lead ads driving to the site) show
// landing-page visits in Ads Manager. A no-op with no env var, so this is safe
// in every environment including CI.
//
// The pixel is a third-party advertising tracker, so it must not run before the
// visitor says yes — silence is not consent. Nothing here loads until
// useCookieConsent reports 'accepted'; granting it later starts tracking without
// a reload, and declining reloads the page to drop what was already loaded.

import { watch } from 'vue'
import { useCookieConsent } from '~~/layers/core/app/composables/useCookieConsent'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue: unknown[]
      loaded: boolean
      version: string
      push: Window['fbq']
    }
    _fbq?: Window['fbq']
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const { public: config } = useRuntimeConfig()
  const pixelId = config.metaPixelId as string
  if (!pixelId) return

  const { trackingAllowed } = useCookieConsent()

  const loadPixel = () => {
    if (window.fbq) return

    const fbq: Window['fbq'] = function (...args: unknown[]) {
      fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
    } as Window['fbq']
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq
    window.fbq = fbq
    window._fbq = fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)

    window.fbq('init', pixelId)
  }

  const trackPageView = () => {
    try {
      window.fbq?.('track', 'PageView')
    } catch {
      /* non-critical — analytics is best-effort */
    }
  }

  // Only ever called behind a consent check.
  const start = () => {
    loadPixel()
    trackPageView()
  }

  nuxtApp.hook('app:mounted', () => {
    if (trackingAllowed.value) start()
  })

  // Consent given after the page loaded — start then, rather than making them
  // navigate before the choice takes effect.
  watch(trackingAllowed, (allowed) => {
    if (allowed) start()
  })

  useRouter().afterEach(() => {
    if (trackingAllowed.value) trackPageView()
  })
})
