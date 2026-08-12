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
  /** Separate from `posting` (TikTok) so the two channels' buttons/loading states don't couple. */
  const facebookPosting = ref(false)
  const creatorInfo = ref<TikTokCreatorInfoDTO | null>(null)
  /** Live status of the most recent TikTok post, polled after posting. */
  const tiktokPostStatus = ref<string | null>(null)
  const tiktokFailReason = ref<string | null>(null)

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
    opts: {
      privacyLevel: string
      caption?: string
      title?: string
      allowComment?: boolean
      isPromotional?: boolean
      brandOrganic?: boolean
      brandContent?: boolean
    },
  ) {
    if (!asset.value) return null
    posting.value = true
    tiktokPostStatus.value = null
    tiktokFailReason.value = null
    try {
      if (!hasCard.value) await captureAndAttach(el)
      const res = await api.postToTikTok(asset.value.id, opts)
      pollTikTokStatus(asset.value.id, res.data.publishId)
      return res.data
    } finally {
      posting.value = false
    }
  }

  /**
   * Upload the card to the seller's TikTok inbox as a draft (MEDIA_UPLOAD) —
   * no audit gate, no forced privacy. The seller finishes posting themselves
   * in the TikTok app, where they can also attach a Link Sticker.
   */
  async function postToTikTokDraft(
    el: HTMLElement | null | undefined,
    opts: { caption?: string; title?: string } = {},
  ) {
    if (!asset.value) return null
    posting.value = true
    tiktokPostStatus.value = null
    tiktokFailReason.value = null
    try {
      if (!hasCard.value) await captureAndAttach(el)
      const res = await api.postToTikTokDraft(asset.value.id, opts)
      pollTikTokStatus(asset.value.id, res.data.publishId)
      return res.data
    } finally {
      posting.value = false
    }
  }

  /**
   * TikTok processes a Direct Post asynchronously — poll so the seller sees it
   * actually complete rather than trusting a fire-and-forget "sent" toast.
   * Stops on a terminal status or after ~30s.
   */
  async function pollTikTokStatus(
    assetId: string,
    publishId: string,
    attempt = 0,
  ) {
    tiktokPostStatus.value = 'PROCESSING_DOWNLOAD'
    try {
      const res = await api.tiktokPostStatus(assetId, publishId)
      const { status, failReason } = res.data
      tiktokPostStatus.value = status
      tiktokFailReason.value = failReason ?? null
      const terminal = status === 'PUBLISH_COMPLETE' || status === 'FAILED'
      if (!terminal && attempt < 10) {
        setTimeout(
          () => pollTikTokStatus(assetId, publishId, attempt + 1),
          3000,
        )
      }
    } catch {
      // Non-fatal — the post likely still went through; just stop polling.
    }
  }

  /**
   * Post the card to the seller's connected Facebook Page. Captures+uploads
   * first if the card isn't hosted yet (Facebook fetches it from our public
   * /growth/cards/:id URL). Synchronous — the Graph API returns the post id
   * immediately, no polling like TikTok's async processing.
   */
  async function postToFacebook(
    el: HTMLElement | null | undefined,
    opts: { caption?: string } = {},
  ) {
    if (!asset.value) return null
    facebookPosting.value = true
    try {
      if (!hasCard.value) await captureAndAttach(el)
      const res = await api.postToFacebook(asset.value.id, opts)
      return res.data
    } finally {
      facebookPosting.value = false
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
    facebookPosting,
    creatorInfo,
    tiktokPostStatus,
    tiktokFailReason,
    prepare,
    captureAndAttach,
    loadTikTokCreatorInfo,
    postToTikTok,
    postToTikTokDraft,
    postToFacebook,
  }
}
