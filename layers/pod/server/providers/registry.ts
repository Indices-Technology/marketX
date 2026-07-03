/**
 * POD provider registry. GIG is the live courier-COD target; BYOP is registered
 * but gated (enabled: false) until its proof/dispute flow is ready.
 */

import type { IPodProvider, PodProviderId, PodRouteContext } from '../utils/types'
import { gigPodProvider } from './gig.pod'
import { byopPodProvider } from './byop.pod'

const ALL: IPodProvider[] = [gigPodProvider, byopPodProvider]

export function enabledPodProviders(): IPodProvider[] {
  return ALL.filter((p) => p.enabled)
}

export function getPodProviderById(id: PodProviderId): IPodProvider | undefined {
  return ALL.find((p) => p.id === id)
}

/** First enabled provider that can serve this POD context, or null. */
export function resolvePodProvider(ctx: PodRouteContext): IPodProvider | null {
  return enabledPodProviders().find((p) => p.canHandle(ctx)) ?? null
}
