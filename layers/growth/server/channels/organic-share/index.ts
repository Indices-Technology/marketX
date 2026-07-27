/**
 * Organic Share channel — the seller distributes the asset themselves.
 *
 * The free, un-gated first channel (see docs/GROWTH_ENGINE.md §6). No OAuth, no Meta
 * App Review, works for every seller today — because we never touch the seller's
 * account. `distribute` prepares a share payload (card image + resolved caption +
 * the per-distribution tracked link); the CLIENT completes the share via the OS
 * share-sheet, a download, or copy-caption. Status is therefore READY, not PUBLISHED.
 *
 * Tomorrow "Organic Share" may gain AirDrop / Nearby Share on the client without any
 * change here — the business capability is unchanged.
 */

import type {
  IChannelProvider,
  ChannelAction,
  ChannelActionKind,
  ActionResultMap,
  DistributeResult,
} from '../../utils/types'

export const organicShareChannel: IChannelProvider = {
  id: 'organic-share',
  name: 'Organic Share',
  capabilities: {
    distribute: true,
    import: false, // nothing to pull — the seller posts it by hand
    clickableLink: true, // the client's target app decides; the tracked link travels in the caption
    requiresAuth: false, // the un-gated property that makes the free wedge possible
  },

  supports(kind: ChannelActionKind): boolean {
    return kind === 'distribute'
  },

  async execute<K extends ChannelActionKind>(
    action: Extract<ChannelAction, { kind: K }>,
  ): Promise<ActionResultMap[K]> {
    if (action.kind !== 'distribute') {
      // Capability gate should prevent this; fail loud if a caller bypasses it.
      throw new Error(
        `organic-share does not support "${action.kind}" (distribute only)`,
      )
    }

    const { asset } = action.payload
    const result: DistributeResult = {
      channel: 'organic-share',
      status: 'READY',
      sharePayload: {
        imageUrl: asset.imageUrl,
        caption: asset.caption,
        trackedUrl: asset.trackedUrl,
      },
    }
    // Cast is sound: kind === 'distribute' ⇒ K extends 'distribute' ⇒ result matches.
    return result as ActionResultMap[K]
  },
}
