import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

export default defineNuxtRouteMiddleware((to) => {
  // SSR: pinia has no persisted state yet (auth lives in localStorage).
  // Skip the check — the server-side API endpoints enforce auth independently.
  // The guard re-runs on the client after hydration with the real store state.
  if (import.meta.server) return

  const profile = useProfileStore()
  if (!profile.isLoggedIn) {
    return navigateTo(`/user-login?redirect=${to.fullPath}`)
  }
  if (profile.me?.role !== 'admin' && profile.me?.role !== 'moderator') {
    return navigateTo('/')
  }
})
