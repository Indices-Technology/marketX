import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import { notify } from '@kyvg/vue3-notification'
import { useRuntimeConfig } from '#imports'
import { useSellerApi } from '../services/seller.services'
import { useProduct } from '~~/layers/commerce/app/composables/useProduct'
import {
  storeDisplayUrl,
  storeShareUrl,
} from '~~/layers/core/app/utils/storeUrl'
import { SHARE_TEMPLATES } from '~~/layers/core/app/utils/cardTemplate'

const tpl = (id: string) => SHARE_TEMPLATES.find((t) => t.id === id)

/**
 * Everything the MarketX Card surfaces need: load a store (into a LOCAL ref so
 * opening a card modal never disturbs the page's shared currentSeller), a live
 * QR of the short link, share/copy/download, and platform share targets.
 */
export function useStoreCard() {
  const config = useRuntimeConfig()
  const api = useSellerApi()
  const { fetchSellerProducts } = useProduct()

  const seller = ref<any>(null)
  const productCount = ref(0)
  const qr = ref('')
  const copied = ref<string | null>(null)
  const loading = ref(true)

  const displayUrl = computed(() =>
    seller.value
      ? storeDisplayUrl(
          seller.value.store_slug,
          config.public.brandDomain as string,
        )
      : '',
  )
  const shareUrl = computed(() =>
    seller.value
      ? storeShareUrl(seller.value.store_slug, config.public.baseURL as string)
      : '',
  )

  watch(shareUrl, async (url) => {
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
  })

  const load = async (slug?: string) => {
    if (!slug) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const res = await api.getSellerBySlug(slug)
      seller.value = res?.data ?? res
    } catch {
      seller.value = null
    } finally {
      loading.value = false
    }
    // Product count is secondary — never block the card on it.
    fetchSellerProducts(slug, { status: 'PUBLISHED', limit: 1, offset: 0 })
      .then((r: any) => {
        productCount.value = r?.total ?? r?.meta?.total ?? 0
      })
      .catch(() => {})
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
    const s = seller.value
    if (!s) return ''
    const rating = s.averageRating
      ? `⭐ ${Number(s.averageRating).toFixed(1)} (${s.totalReviews ?? 0} reviews)\n`
      : ''
    const loc = s.store_location ? `📍 ${s.store_location}\n` : ''
    return `🛍 ${s.store_name}\n${s.is_verified ? 'Verified seller on MarketX.\n' : ''}${rating}${loc}\nBrowse products:\n${shareUrl.value}`
  })

  const share = async () => {
    const data = {
      title: seller.value?.store_name,
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
    a.download = `${seller.value?.store_slug || 'store'}-qr.png`
    a.click()
  }


  // One row of platform buttons. Each shares the card IMAGE (sized for that
  // platform) together with the link/caption — `tpl` picks the size, `href` is
  // the desktop fallback composer. See useCardCapture.shareImage.
  const shareTargets = computed(() => {
    const url = encodeURIComponent(shareUrl.value)
    const text = encodeURIComponent(caption.value)
    return [
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: 'simple-icons:whatsapp',
        bg: '#25D366',
        tpl: tpl('story'),
        href: `https://wa.me/?text=${text}`,
      },
      {
        id: 'instagram',
        label: 'Instagram',
        icon: 'simple-icons:instagram',
        bg: '#E4405F',
        tpl: tpl('square'),
        href: undefined, // no web composer — image is saved to post manually
      },
      {
        id: 'facebook',
        label: 'Facebook',
        icon: 'simple-icons:facebook',
        bg: '#1877F2',
        tpl: tpl('facebook'),
        href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      },
      {
        id: 'x',
        label: 'X',
        icon: 'simple-icons:x',
        bg: '#000000',
        tpl: tpl('facebook'),
        href: `https://twitter.com/intent/tweet?text=${text}`,
      },
      {
        id: 'telegram',
        label: 'Telegram',
        icon: 'simple-icons:telegram',
        bg: '#229ED9',
        tpl: tpl('square'),
        href: `https://t.me/share/url?url=${url}&text=${text}`,
      },
    ]
  })

  return {
    seller,
    productCount,
    qr,
    copied,
    loading,
    displayUrl,
    shareUrl,
    load,
    copy,
    share,
    downloadQr,
    shareTargets,
    caption,
  }
}
