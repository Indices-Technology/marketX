/**
 * Embed channel — the asset is iframed on a third-party site (a seller's own
 * blog, storefront, or marketplace listing), not shared through an app.
 *
 * Like Organic Share, this is free and un-gated: no OAuth, no Meta App Review,
 * because we never touch a third-party account — the seller just pastes an
 * <iframe> snippet. `distribute` mints the per-embed tracked link and returns it
 * as a share payload; the CLIENT builds the iframe src from it. Status is READY,
 * not PUBLISHED, since nothing is actually posted anywhere by us.
 */

import type {
  IChannelProvider,
  ChannelAction,
  ChannelActionKind,
  ActionResultMap,
  DistributeResult,
} from '../../utils/types'

export const embedChannel: IChannelProvider = {
  id: 'embed',
  name: 'Embed',
  capabilities: {
    distribute: true,
    import: false, // nothing to pull — there's no remote post to import from
    clickableLink: true, // the embed's CTA carries the tracked link
    requiresAuth: false, // un-gated — no third-party account involved
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
        `embed does not support "${action.kind}" (distribute only)`,
      )
    }

    const { asset } = action.payload
    const result: DistributeResult = {
      channel: 'embed',
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
