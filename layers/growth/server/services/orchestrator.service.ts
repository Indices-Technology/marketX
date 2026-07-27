/**
 * Distribute orchestrator — the channel-agnostic brain for the `distribute` verb.
 *
 *   resolve caption per channel → mint an AssetDistribution (short code + tracked
 *   link) → hand the channel a DistributableAsset → collect results, one per channel,
 *   with graceful per-channel degradation (a failing channel drops to FAILED, never
 *   sinks the others).
 *
 * DIVISION OF LABOUR (docs/GROWTH_ENGINE.md §4): the orchestrator owns attribution
 * (minting the distribution + resolving the caption); the channel owns platform
 * mechanics. The channel never sees the DB — `mint` is injected, so this core is
 * pure and unit-testable without a database.
 *
 * `distribute` is a one-shot verb. Stateful verbs (campaigns, conversations) get
 * their own orchestrators later; they do not belong here.
 */

import type {
  ChannelId,
  DistributeResult,
  DistributableAsset,
  GrowthAsset,
} from '../utils/types'
import { getChannel } from '../channels/registry'

/** What minting a distribution yields — a persisted row + its tracked short link. */
export interface MintedDistribution {
  distributionId: string
  shortCode: string
  /** The per-distribution attributed URL the QR/link points at. */
  trackedUrl: string
}

/**
 * Persists an AssetDistribution row and returns its tracked link. Injected so the
 * orchestrator stays DB-free and testable. Production implementation writes to
 * `AssetDistribution` and builds `${base}/r/${shortCode}`.
 */
export type DistributionMinter = (args: {
  assetId: string
  channel: ChannelId
}) => Promise<MintedDistribution>

export interface DistributeInput {
  asset: GrowthAsset
  channelIds: ChannelId[]
  /** ISO 8601 — forwarded to API channels that schedule; ignored by organic. */
  scheduleAt?: string
}

export interface DistributeDeps {
  mint: DistributionMinter
}

/** Resolve the caption for a channel: channel-specific → default → empty. */
export function resolveCaption(asset: GrowthAsset, channel: ChannelId): string {
  const c = asset.content.captions
  return c[channel] ?? c.default ?? ''
}

/**
 * Distribute one Growth Asset to many channels. Returns one result per requested
 * channel, in order. Each channel is isolated — unknown/unsupported/throwing
 * channels yield a FAILED result rather than aborting the batch.
 */
export async function distribute(
  input: DistributeInput,
  deps: DistributeDeps,
): Promise<DistributeResult[]> {
  const settled = await Promise.allSettled(
    input.channelIds.map((id) => distributeOne(input, id, deps)),
  )

  return settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value
    const channel = input.channelIds[i]!
    const reason =
      s.reason instanceof Error ? s.reason.message : String(s.reason)
    return { channel, status: 'FAILED', error: reason }
  })
}

async function distributeOne(
  input: DistributeInput,
  channelId: ChannelId,
  deps: DistributeDeps,
): Promise<DistributeResult> {
  const channel = getChannel(channelId)
  if (!channel) {
    return { channel: channelId, status: 'FAILED', error: 'unknown channel' }
  }
  if (!channel.supports('distribute')) {
    return {
      channel: channelId,
      status: 'FAILED',
      error: `channel "${channelId}" does not support distribute`,
    }
  }

  const minted = await deps.mint({
    assetId: input.asset.id,
    channel: channelId,
  })

  const distributable: DistributableAsset = {
    assetId: input.asset.id,
    distributionId: minted.distributionId,
    imageUrl: input.asset.content.cardImageUrl,
    caption: resolveCaption(input.asset, channelId),
    trackedUrl: minted.trackedUrl,
  }

  return channel.execute({
    kind: 'distribute',
    payload: { asset: distributable, scheduleAt: input.scheduleAt },
  })
}
