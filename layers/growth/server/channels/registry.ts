/**
 * Channel registry — the single place growth channels are registered.
 *
 * Add a channel: implement IChannelProvider under channels/<id>/ and add it to
 * CHANNELS below. The orchestrator discovers everything from here. Gated channels
 * (meta-fb, meta-ig, whatsapp, email) register here as they land — nothing else
 * in the engine changes. See docs/GROWTH_ENGINE.md §4.
 */

import type {
  IChannelProvider,
  ChannelId,
  ChannelActionKind,
} from '../utils/types'
import { organicShareChannel } from './organic-share'

// meta-fb, meta-ig, whatsapp, email register here as they land (behind App Review).
const CHANNELS: IChannelProvider[] = [organicShareChannel]

export function getChannels(): IChannelProvider[] {
  return CHANNELS
}

export function getChannel(id: ChannelId): IChannelProvider | undefined {
  return CHANNELS.find((c) => c.id === id)
}

/**
 * Channels that support a given verb (capability discovery). `only` restricts to
 * specific channel ids — e.g. the composer offers organic-share before the Meta
 * channels are live.
 */
export function channelsSupporting(
  kind: ChannelActionKind,
  only?: ChannelId[],
): IChannelProvider[] {
  return CHANNELS.filter((c) => {
    if (only && !only.includes(c.id)) return false
    return c.supports(kind)
  })
}
