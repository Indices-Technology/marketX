/**
 * useConnections — seller's social connections (list, connect, disconnect).
 * Component → composable → BaseApiClient (data-layer rule). No direct $fetch.
 */

import {
  useConnectionsApi,
  type SocialConnection,
  type FacebookPageCandidate,
} from '~~/layers/growth/app/services/connections.api'

export function useConnections() {
  const api = useConnectionsApi()
  const connections = ref<SocialConnection[]>([])
  const loading = ref(false)
  const connecting = ref(false)
  const facebookPageCandidates = ref<FacebookPageCandidate[]>([])

  async function refresh() {
    loading.value = true
    try {
      const res = await api.list()
      connections.value = res.data
    } finally {
      loading.value = false
    }
  }

  /** Find the active connection for a platform, if any. */
  function forPlatform(platform: SocialConnection['platform']) {
    return connections.value.find(
      (c) => c.platform === platform && c.status === 'ACTIVE',
    )
  }

  /**
   * Kick off the TikTok connect flow: ask the server for the authorize URL
   * (sets the state cookie), then navigate the whole page to TikTok.
   */
  async function connectTikTok(redirectTo: string) {
    connecting.value = true
    try {
      const res = await api.startTikTok(redirectTo)
      window.location.href = res.data.authorizeUrl
    } catch {
      connecting.value = false
    }
  }

  /**
   * Kick off the Google Business Profile connect flow: ask the server for the
   * authorize URL (sets the state cookie), then navigate the whole page to Google.
   */
  async function connectGoogleBusiness(redirectTo: string) {
    connecting.value = true
    try {
      const res = await api.startGoogleBusiness(redirectTo)
      window.location.href = res.data.authorizeUrl
    } catch {
      connecting.value = false
    }
  }

  /**
   * Kick off the Facebook Page connect flow: ask the server for the authorize
   * URL (sets the state cookie), then navigate the whole page to Facebook.
   */
  async function connectFacebook(redirectTo: string) {
    connecting.value = true
    try {
      const res = await api.startFacebook(redirectTo)
      window.location.href = res.data.authorizeUrl
    } catch {
      connecting.value = false
    }
  }

  /** Load the Pages awaiting a pick after a multi-Page Facebook connect. */
  async function loadFacebookPageCandidates() {
    const res = await api.getFacebookPageCandidates()
    facebookPageCandidates.value = res.data
  }

  /** Finalize the picker for the chosen Page, then refresh connections. */
  async function selectFacebookPage(pageId: string) {
    await api.selectFacebookPage(pageId)
    facebookPageCandidates.value = []
    await refresh()
  }

  async function disconnect(id: string) {
    await api.disconnect(id)
    connections.value = connections.value.filter((c) => c.id !== id)
  }

  return {
    connections,
    loading,
    connecting,
    facebookPageCandidates,
    refresh,
    forPlatform,
    connectTikTok,
    connectGoogleBusiness,
    connectFacebook,
    loadFacebookPageCandidates,
    selectFacebookPage,
    disconnect,
  }
}
