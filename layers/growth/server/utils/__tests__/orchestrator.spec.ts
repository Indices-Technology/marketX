import { describe, it, expect } from 'vitest'
import { distribute, resolveCaption } from '../../services/orchestrator.service'
import type { GrowthAsset, DistributionMinter, ChannelId } from '../types'

// Fake minter — no DB. Builds a deterministic tracked link per channel.
const mint: DistributionMinter = async ({ assetId, channel }) => ({
  distributionId: `dist-${assetId}-${channel}`,
  shortCode: `sc-${channel}`,
  trackedUrl: `https://mx.test/r/sc-${channel}`,
})

const asset: GrowthAsset = {
  id: 'asset-1',
  intent: 'SELL',
  content: {
    cardImageUrl: 'https://res.cloudinary.com/x/card.jpg',
    cardPublicId: 'x/card',
    captions: {
      default: 'Default caption',
      'meta-fb': 'Facebook caption with a link',
    },
  },
  commerce: {
    sellerPublicId: 'MX-LAG-J8KP',
    canonicalUrl: 'https://marketx.africa/p/1',
  },
}

describe('growth distribute orchestrator', () => {
  it('organic-share → READY with a share payload carrying the tracked link', async () => {
    const [res] = await distribute(
      { asset, channelIds: ['organic-share'] },
      { mint },
    )
    expect(res!.channel).toBe('organic-share')
    expect(res!.status).toBe('READY')
    expect(res!.sharePayload).toEqual({
      imageUrl: 'https://res.cloudinary.com/x/card.jpg',
      caption: 'Default caption', // falls back to default (no organic-share caption set)
      trackedUrl: 'https://mx.test/r/sc-organic-share',
    })
  })

  it('resolves the channel-specific caption over the default', () => {
    expect(resolveCaption(asset, 'meta-fb')).toBe('Facebook caption with a link')
    expect(resolveCaption(asset, 'organic-share')).toBe('Default caption')
  })

  it('capability gate: an unknown channel yields FAILED, never throws', async () => {
    const [res] = await distribute(
      { asset, channelIds: ['whatsapp' as ChannelId] }, // not registered yet
      { mint },
    )
    expect(res!.status).toBe('FAILED')
    expect(res!.error).toBe('unknown channel')
  })

  it('graceful degradation: one bad channel does not sink the good one', async () => {
    const results = await distribute(
      { asset, channelIds: ['whatsapp' as ChannelId, 'organic-share'] },
      { mint },
    )
    expect(results).toHaveLength(2)
    expect(results[0]!.status).toBe('FAILED') // whatsapp (unregistered)
    expect(results[1]!.status).toBe('READY') // organic-share still succeeds
  })

  it('a throwing minter is isolated to its channel as FAILED', async () => {
    const boom: DistributionMinter = async () => {
      throw new Error('db down')
    }
    const [res] = await distribute(
      { asset, channelIds: ['organic-share'] },
      { mint: boom },
    )
    expect(res!.status).toBe('FAILED')
    expect(res!.error).toBe('db down')
  })
})
