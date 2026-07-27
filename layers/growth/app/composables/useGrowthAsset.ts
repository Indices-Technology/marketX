/**
 * useGrowthAsset — turn a product into a shareable/postable Growth Asset.
 *
 * Flow: create the asset (server mints the CARD tracked link) → generate the QR
 * from that tracked link → the caller renders ProductShareCard with the QR →
 * capture + upload the card image → attach it to the asset → post to a channel.
 *
 * Data-layer rule: goes through the API client (BaseApiClient), never raw $fetch.
 */

import QRCode from 'qrcode'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { useCardCapture } from '~~/layers/seller/app/composables/useCardCapture'
import {
  useGrowthAssetApi,
  type GrowthAssetDTO,
  type TikTokCreatorInfoDTO,
} from '~~/layers/growth/app/services/growthAsset.api'

export function useGrowthAsset() {
  const api = useGrowthAssetApi()
  const { uploadMedia } = useMediaUpload()
  const { cardToPng, dataUrlToFile } = useCardCapture()

  const asset = ref<GrowthAssetDTO | null>(null)
  const qr = ref('')
  const preparing = ref(false)
  const uploading = ref(false)
  const posting = ref(false)
  const creatorInfo = ref<TikTokCreatorInfoDTO | null>(null)

  /** The trackable link the QR encodes and captions carry. */
  const trackedUrl = computed(() => asset.value?.trackedUrl ?? '')
  /** Whether the card image has already been captured+uploaded. */
  const hasCard = computed(() => !!asset.value?.cardImageUrl)

  /** Create-or-get the asset for a product and render its QR. */
  async function prepare(productId: number) {
    preparing.value = true
    try {
      const res = await api.fromProduct(productId)
      asset.value = res.data
      qr.value = await QRCode.toDataURL(res.data.trackedUrl, {
        width: 320,
        margin: 1,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      })
    } finally {
      preparing.value = false
    }
  }

  /** Capture the rendered card element, upload it, and attach it to the asset. */
  async function captureAndAttach(el: HTMLElement | null | undefined) {
    if (!el || !asset.value) return
    uploading.value = true
    try {
      const dataUrl = await cardToPng(el)
      const file = dataUrlToFile(dataUrl, `growth-${asset.value.id}.png`)
      const uploaded = await uploadMedia(file)
      await api.attachCard(asset.value.id, uploaded.url, uploaded.public_id)
      asset.value = { ...asset.value, cardImageUrl: uploaded.url }
    } finally {
      uploading.value = false
    }
  }

  async function loadTikTokCreatorInfo() {
    const res = await api.tiktokCreatorInfo()
    creatorInfo.value = res.data
    return res.data
  }

  /**
   * Post the card to TikTok. Captures+uploads first if the card isn't hosted yet
   * (TikTok pulls it from our verified URL, so it must exist server-side).
   */
  async function postToTikTok(
    el: HTMLElement | null | undefined,
    opts: { privacyLevel?: string; caption?: string } = {},
  ) {
    if (!asset.value) return null
    posting.value = true
    try {
      if (!hasCard.value) await captureAndAttach(el)
      const res = await api.postToTikTok(asset.value.id, opts)
      return res.data
    } finally {
      posting.value = false
    }
  }

  return {
    asset,
    qr,
    trackedUrl,
    hasCard,
    preparing,
    uploading,
    posting,
    creatorInfo,
    prepare,
    captureAndAttach,
    loadTikTokCreatorInfo,
    postToTikTok,
  }
}
