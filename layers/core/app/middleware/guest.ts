// layers/core/middleware/guest.ts

import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

/**
 * Guest Middleware
 * Redirects logged-in users away from auth pages
 *
 * Usage:
 * definePageMeta({
 *   middleware: 'guest'
 * })
 */

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const profileStore = useProfileStore()

  // Post-phone-verify seller handoff: phone-login.vue logs the user in THEN
  // sends them here with ?step=2 to finish store setup — they're intentionally
  // already authenticated at this point, so don't bounce them back to home.
  if (to.path === '/user-register' && to.query.step === '2') return

  // If already logged in, redirect away from auth pages
  if (profileStore.isLoggedIn) {
    return navigateTo('/')
  }
})
