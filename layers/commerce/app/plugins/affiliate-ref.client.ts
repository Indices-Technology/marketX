// Capture an affiliate ?ref=CODE on EVERY page, not just product/checkout pages.
// The affiliate dashboard's generic link is `${origin}/?ref=CODE`, which lands on
// the home page — without this, that link never attributed (the ref sat unused in
// the URL and was lost on the next navigation). captureAffiliateRef() is a no-op
// on the server and when there's no valid ?ref, so this is safe to run globally.
//
// We run it lazily (app:mounted + afterEach, guarded) so it never touches the Pinia
// store before Pinia is initialised, and never breaks navigation if it throws.
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'

export default defineNuxtPlugin((nuxtApp) => {
  const run = () => {
    try {
      useAffiliate().captureAffiliateRef()
    } catch {
      /* non-critical — attribution is best-effort */
    }
  }

  // Initial load (e.g. landing directly on /?ref=CODE), after the app is mounted …
  nuxtApp.hook('app:mounted', run)
  // … and every subsequent navigation that carries a ?ref.
  useRouter().afterEach(() => run())
})
