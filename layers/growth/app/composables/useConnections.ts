/**
 * useConnections — seller's social connections (list, connect, disconnect).
 * Component → composable → BaseApiClient (data-layer rule). No direct $fetch.
 */

import {
  useConnectionsApi,
  type SocialConnection,
} from '~~/layers/growth/app/services/connections.api'

export function useConnections() {
  const api = useConnectionsApi()
  const connections = ref<SocialConnection[]>([])
  const loading = ref(false)
  const connecting = ref(false)

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

  async function disconnect(id: string) {
    await api.disconnect(id)
    connections.value = connections.value.filter((c) => c.id !== id)
  }

  return {
    connections,
    loading,
    connecting,
    refresh,
    forPlatform,
    connectTikTok,
    disconnect,
  }
}
