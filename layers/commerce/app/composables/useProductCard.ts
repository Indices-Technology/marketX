import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import { notify } from '@kyvg/vue3-notification'
import { useRuntimeConfig } from '#imports'
import { useAffiliate } from './useAffiliate'
import { formatProductPrice } from '~~/shared/utils/currency'

/**
 * Everything a shareable **product card** needs: a context-aware share link, a
 * live QR of it, and copy/share/download helpers. Mirrors useStoreCard.
 *
 * The link is chosen once, here, and reused by the copy button, the QR, and the
 * platform share targets so they can never diverge:
 *   - product is **affiliatable** (`affiliateCommission > 0`) AND the viewer is a
 *     logged-in **enrolled affiliate** → `…/product/{slug}?ref={code}` so the
 *     sale attributes to them (self-referrals are ignored server-side at order
 *     time, so no client guard is needed);
 *   - otherwise (guest · not an affiliate · not affiliatable) → the plain link.
 */
export function useProductCard() {
  const config = useRuntimeConfig()
  const { isEnrolled, affiliateCode, fetchAffiliateStatus } = useAffiliate()

  const product = ref<any>(null)
  const qr = ref('')
  const copied = ref<string | null>(null)

  const slug = computed(() => product.value?.slug ?? '')
  const domain = computed(() => config.public.brandDomain as string)
  const baseUrl = computed(() =>
    slug.value
      ? `${(config.public.baseURL as string).replace(/\/+$/, '')}/product/${slug.value}`
      : '',
  )

  const isAffiliatable = computed(() => (product.value?.affiliateCommission ?? 0) > 0)

  /** Whether the current viewer gets their attributed link on this product. */
  const affiliateActive = computed(
    () => isAffiliatable.value && isEnrolled.value && !!affiliateCode.value,
  )

  /** The link the QR encodes and the share/copy actions use (ref when eligible). */
  const shareUrl = computed(() =>
    affiliateActive.value
      ? `${baseUrl.value}?ref=${affiliateCode.value}`
      : baseUrl.value,
  )

  /** Clean link for display — never shows the ref param. */
  const displayUrl = computed(() =>
    slug.value ? `${domain.value}/product/${slug.value}` : '',
  )

  /** Flat ₦/unit the affiliate earns — surfaced on the card when active. */
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

  // Re-render the QR whenever the (possibly ref-carrying) share link changes.
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

  /** Point the card at a product (already-loaded object — no refetch). */
  const load = (p: any) => {
    product.value = p
    // Need the viewer's affiliate status to decide the link; harmless if guest.
    fetchAffiliateStatus().catch(() => {})
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
    slug,
    shareUrl,
    displayUrl,
    priceText,
    commissionText,
    affiliateActive,
    load,
    copy,
    share,
    downloadQr,
    shareTargets,
    caption,
  }
}
