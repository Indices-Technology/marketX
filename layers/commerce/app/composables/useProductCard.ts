import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import { notify } from '@kyvg/vue3-notification'
import { useRuntimeConfig } from '#imports'
import { useAffiliate } from './useAffiliate'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useGrowthAssetApi } from '~~/layers/growth/app/services/growthAsset.api'
import { formatProductPrice } from '~~/shared/utils/currency'

/**
 * Everything a shareable **product card** needs: a context-aware share link, a
 * live QR of it, and copy/share/download helpers. Mirrors useStoreCard.
 *
 * Two card flavors, picked by `channel`:
 *   - `ORGANIC_SHARE` (default) — any signed-in viewer's own personal short link
 *     (`ProductShareCardModal`, the public "Share as card" button). Guests get
 *     the plain product URL — there's no stable identity to mint one against.
 *   - `AFFILIATE` — an enrolled affiliate's own short link (`AffiliateProductCardModal`).
 *     The `?ref={code}` that attributes the sale is resolved server-side when the
 *     link is followed (`/r/{code}`), never baked into the URL the card shows.
 *
 * Each (product, channel, viewer) triple gets its own tracked `/r/{code}` link
 * (see `growthAssetService.forSharer`) so clicks/scans roll up per sharer instead
 * of everyone's shares colliding into one bucket. Minting failure (offline, edge
 * case) degrades to the plain link — sharing still works, just untracked.
 */
export function useProductCard(
  options: { channel?: 'ORGANIC_SHARE' | 'AFFILIATE' } = {},
) {
  const channel = options.channel ?? 'ORGANIC_SHARE'
  const config = useRuntimeConfig()
  const { isEnrolled, fetchAffiliateStatus } = useAffiliate()
  const profileStore = useProfileStore()
  const growthAssetApi = useGrowthAssetApi()

  const product = ref<any>(null)
  const qr = ref('')
  const copied = ref<string | null>(null)
  const trackedUrl = ref('')
  const minting = ref(false)

  const slug = computed(() => product.value?.slug ?? '')
  const domain = computed(() => config.public.brandDomain as string)
  const baseUrl = computed(() =>
    slug.value
      ? `${(config.public.baseURL as string).replace(/\/+$/, '')}/product/${slug.value}`
      : '',
  )

  const isAffiliatable = computed(() => (product.value?.affiliateCommission ?? 0) > 0)

  /** Whether this card is a live AFFILIATE card for an eligible viewer. */
  const affiliateActive = computed(
    () => channel === 'AFFILIATE' && isAffiliatable.value && isEnrolled.value,
  )

  /** Whether we should mint (and use) a personal tracked link at all. */
  const mintEligible = computed(() => {
    if (!profileStore.isLoggedIn || !slug.value) return false
    return channel === 'AFFILIATE' ? affiliateActive.value : true
  })

  /** The link the QR encodes and the share/copy actions use. */
  const shareUrl = computed(() => trackedUrl.value || baseUrl.value)

  /** Clean link for display — identical to shareUrl; kept as its own prop since
   *  the card component expects a display/encode pair. */
  const displayUrl = computed(() => shareUrl.value)

  /** Flat ₦/unit the affiliate earns — surfaced on the AFFILIATE card only. */
  const commissionText = computed(() =>
    affiliateActive.value && product.value?.affiliateCommission
      ? formatProductPrice(product.value.affiliateCommission, 'NGN')
      : '',
  )

  const priceMajor = computed(() => {
    const p = product.value
    if (!p) return 0
    const disc = p.discount ?? 0
    return disc > 0 ? Math.round(p.price * (1 - disc / 100)) : p.price
  })
  const priceText = computed(() => formatProductPrice(priceMajor.value, 'NGN'))

  // Re-render the QR whenever the share link changes.
  watch(
    shareUrl,
    async (url) => {
      if (!url) {
        qr.value = ''
        return
      }
      try {
        qr.value = await QRCode.toDataURL(url, {
          width: 320,
          margin: 1,
          color: { dark: '#0a0a0a', light: '#ffffff' },
        })
      } catch {
        qr.value = ''
      }
    },
    { immediate: true },
  )

  /** Mint this viewer's personal tracked link for the current product+channel. */
  const mintTrackedLink = async () => {
    trackedUrl.value = ''
    if (!mintEligible.value || !product.value?.id) return
    minting.value = true
    try {
      const res = await growthAssetApi.forSharer(product.value.id, channel)
      trackedUrl.value = res.data.trackedUrl
    } catch {
      // Falls back to the plain baseUrl — sharing still works, just untracked.
    } finally {
      minting.value = false
    }
  }

  /** Point the card at a product (already-loaded object — no refetch). */
  const load = async (p: any) => {
    product.value = p
    // Only the AFFILIATE card needs enrollment status; ORGANIC_SHARE doesn't gate
    // on it, so skip the extra round trip for the common public-share case.
    if (channel === 'AFFILIATE' && profileStore.isLoggedIn) {
      try {
        await fetchAffiliateStatus()
      } catch {
        /* isEnrolled stays false — mintEligible naturally excludes this viewer */
      }
    }
    await mintTrackedLink()
  }

  const copy = async (text: string | null | undefined, label: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      copied.value = label
      notify({ type: 'success', text: `${label} copied!` })
      setTimeout(() => (copied.value = null), 2000)
    } catch {
      notify({ type: 'error', text: 'Could not copy' })
    }
  }

  const caption = computed(() => {
    const p = product.value
    if (!p) return ''
    const seller = p.seller?.store_name ? `by ${p.seller.store_name}\n` : ''
    // Public affiliate invite (not the owner's specific commission) — subtle CTA
    // so recipients know they can share & earn too.
    const earn = commissionText.value
      ? `\n💸 Share products like this and earn — become a MarketX affiliate.\n`
      : ''
    return `🛍 ${p.title} — ${priceText.value}\n${seller}${earn}\n${shareUrl.value}`
  })

  const share = async () => {
    const data = {
      title: product.value?.title,
      text: caption.value,
      url: shareUrl.value,
    }
    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        /* cancelled */
      }
    } else {
      await copy(caption.value, 'Card')
    }
  }

  const downloadQr = () => {
    if (!qr.value) return
    const a = document.createElement('a')
    a.href = qr.value
    a.download = `${slug.value || 'product'}-qr.png`
    a.click()
  }

  // One row of platform buttons — each shares the card image + link/caption.
  const shareTargets = computed(() => {
    const url = encodeURIComponent(shareUrl.value)
    const text = encodeURIComponent(caption.value)
    return [
      { id: 'whatsapp', label: 'WhatsApp', icon: 'simple-icons:whatsapp', bg: '#25D366', href: `https://wa.me/?text=${text}` },
      { id: 'instagram', label: 'Instagram', icon: 'simple-icons:instagram', bg: '#E4405F', href: undefined },
      { id: 'facebook', label: 'Facebook', icon: 'simple-icons:facebook', bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
      { id: 'x', label: 'X', icon: 'simple-icons:x', bg: '#000000', href: `https://twitter.com/intent/tweet?text=${text}` },
      { id: 'telegram', label: 'Telegram', icon: 'simple-icons:telegram', bg: '#229ED9', href: `https://t.me/share/url?url=${url}&text=${text}` },
    ]
  })

  return {
    product,
    qr,
    copied,
    minting,
    slug,
    shareUrl,
    displayUrl,
    priceText,
    commissionText,
    affiliateActive,
    isAffiliatable,
    load,
    copy,
    share,
    downloadQr,
    shareTargets,
    caption,
  }
}
