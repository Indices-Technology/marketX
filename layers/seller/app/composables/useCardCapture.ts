import { ref } from 'vue'
import { toPng } from 'html-to-image'
import { notify } from '@kyvg/vue3-notification'
import {
  composeCardTemplate,
  type ShareTemplate,
} from '~~/layers/core/app/utils/cardTemplate'

/**
 * Capture the rendered MarketX Card (logo + contact + QR) to a PNG. Cloudinary
 * can't generate a QR, so we snapshot the real card. `captureTemplate` frames
 * that snapshot on a branded canvas for a share size (story / post / print).
 */
export function useCardCapture() {
  const capturing = ref(false)

  // Interactive-only bits (copy icons) are marked .capture-hide and excluded.
  const cardToPng = (el: HTMLElement) =>
    toPng(el, {
      pixelRatio: 3,
      cacheBust: true,
      skipFonts: true,
      filter: (node) =>
        !(node instanceof Element && node.classList.contains('capture-hide')),
    })

  const save = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  // Decode the base64 payload directly — fetch()ing a data: URL is blocked by
  // the CSP connect-src (data: isn't an allowed scheme).
  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const [head, b64] = dataUrl.split(',')
    const mime = head.match(/:(.*?);/)?.[1] || 'image/png'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new File([bytes], filename, { type: mime })
  }

  /** The card as-is (the business card). */
  const capture = async (
    el: HTMLElement | null | undefined,
    filename: string,
  ) => {
    if (!el) return
    capturing.value = true
    try {
      save(await cardToPng(el), filename)
      notify({ type: 'success', text: 'Card downloaded' })
    } catch {
      notify({ type: 'error', text: 'Could not generate the card image' })
    } finally {
      capturing.value = false
    }
  }

  /** The card framed on a branded canvas at a template size. */
  const captureTemplate = async (
    el: HTMLElement | null | undefined,
    tpl: ShareTemplate,
    slug: string,
  ) => {
    if (!el) return
    capturing.value = true
    try {
      const card = await cardToPng(el)
      const out = await composeCardTemplate(card, tpl)
      save(out, `${slug || 'store'}-${tpl.id}.png`)
      notify({ type: 'success', text: `${tpl.label} downloaded` })
    } catch {
      notify({ type: 'error', text: 'Could not generate the image' })
    } finally {
      capturing.value = false
    }
  }

  /**
   * Share the card as an image WITH the link/caption. On mobile this opens the
   * native share sheet with the PNG attached (works into WhatsApp, IG, FB, …).
   * On desktop / browsers without file-share, we save the image and open the
   * platform's web composer with the link so the user attaches it manually.
   */
  const shareImage = async (
    el: HTMLElement | null | undefined,
    opts: {
      tpl?: ShareTemplate
      slug: string
      text: string
      title?: string
      fallbackHref?: string
    },
  ) => {
    if (!el) return
    capturing.value = true
    try {
      const card = await cardToPng(el)
      const png = opts.tpl ? await composeCardTemplate(card, opts.tpl) : card
      const file = dataUrlToFile(
        png,
        `${opts.slug || 'store'}-${opts.tpl?.id || 'card'}.png`,
      )
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })

      if (canShareFiles) {
        await navigator.share({ files: [file], text: opts.text, title: opts.title })
      } else {
        save(png, file.name)
        if (opts.fallbackHref)
          window.open(opts.fallbackHref, '_blank', 'noopener')
        notify({ type: 'success', text: 'Image saved — attach it to your post' })
      }
    } catch (e) {
      // AbortError = user dismissed the native sheet; that isn't a failure.
      if ((e as { name?: string })?.name !== 'AbortError')
        notify({ type: 'error', text: 'Could not share the card' })
    } finally {
      capturing.value = false
    }
  }

  return { capture, captureTemplate, shareImage, capturing }
}
