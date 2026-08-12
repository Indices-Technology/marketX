// Loads the Meta Pixel when NUXT_PUBLIC_META_PIXEL_ID is set, so ad campaigns
// (e.g. lead ads driving to the site) show landing-page visits in Ads Manager.
// A no-op with no env var, so this is safe in every environment including CI.

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

  nuxtApp.hook('app:mounted', () => {
    loadPixel()
    trackPageView()
  })
  useRouter().afterEach(() => trackPageView())
})
