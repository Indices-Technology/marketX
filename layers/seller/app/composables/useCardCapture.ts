import { ref } from 'vue'
import { toPng } from 'html-to-image'
import { notify } from '@kyvg/vue3-notification'
import {
  composeCardTemplate,
  type ShareTemplate,
} from '~~/layers/core/app/utils/cardTemplate'

/**
 * Every export is rendered at this width, whatever the device. The live card is
 * fluid (≈330 px on a small phone, ≈420 px in the modal), and snapshotting it
 * as-is meant the PNG's size, aspect ratio and line breaks all changed with the
 * viewport — then the template scaled that varying image up or down to fit,
 * which is what made the same card look zoomed on one phone and shrunken on
 * another.
 */
const CAPTURE_WIDTH = 420

/** Templates pad by 7% of their short side; size the raster to that box. */
const pixelRatioFor = (tpl?: ShareTemplate) => {
  if (!tpl) return 3
  const availW =
    tpl.width - Math.round(Math.min(tpl.width, tpl.height) * 0.07) * 2
  return Math.min(4, Math.max(2, Math.ceil(availW / CAPTURE_WIDTH)))
}

/** Resolve once every <img> in the tree has settled (or given up). */
const imagesSettled = (root: HTMLElement) =>
  Promise.all(
    Array.from(root.querySelectorAll('img')).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve()
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
          setTimeout(done, 3000) // never hang the download on a slow asset
        }),
    ),
  )

/**
 * Capture the rendered MarketX Card (logo + contact + QR) to a PNG. Cloudinary
 * can't generate a QR, so we snapshot the real card. `captureTemplate` frames
 * that snapshot on a branded canvas for a share size (story / post / print).
 */
export function useCardCapture() {
  const capturing = ref(false)

  /**
   * Snapshot an offscreen clone laid out at CAPTURE_WIDTH instead of the live
   * node, so the output is identical on every screen and the card on screen
   * never flickers mid-capture.
   */
  const cardToPng = async (el: HTMLElement, pixelRatio = 3) => {
    const holder = document.createElement('div')
    holder.setAttribute('aria-hidden', 'true')
    holder.style.cssText = `position:fixed;top:0;left:-10000px;width:${CAPTURE_WIDTH}px;pointer-events:none;z-index:-1;`

    const clone = el.cloneNode(true) as HTMLElement
    clone.style.width = '100%'
    clone.style.maxWidth = 'none'
    holder.appendChild(clone)
    document.body.appendChild(holder)

    try {
      await imagesSettled(clone)
      await new Promise(requestAnimationFrame) // let the relayout settle
      // Interactive-only bits (copy icons) are marked .capture-hide and excluded.
      return await toPng(clone, {
        pixelRatio,
        cacheBust: true,
        skipFonts: true,
        filter: (node) =>
          !(node instanceof Element && node.classList.contains('capture-hide')),
      })
    } finally {
      holder.remove()
    }
  }

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
      const card = await cardToPng(el, pixelRatioFor(tpl))
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
      const card = await cardToPng(el, pixelRatioFor(opts.tpl))
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
        await navigator.share({
          files: [file],
          text: opts.text,
          title: opts.title,
        })
      } else {
        save(png, file.name)
        if (opts.fallbackHref)
          window.open(opts.fallbackHref, '_blank', 'noopener')
        notify({
          type: 'success',
          text: 'Image saved — attach it to your post',
        })
      }
    } catch (e) {
      // AbortError = user dismissed the native sheet; that isn't a failure.
      if ((e as { name?: string })?.name !== 'AbortError')
        notify({ type: 'error', text: 'Could not share the card' })
    } finally {
      capturing.value = false
    }
  }

  return {
    capture,
    captureTemplate,
    shareImage,
    capturing,
    // Exposed for programmatic capture→upload (Growth Assets).
    cardToPng,
    dataUrlToFile,
  }
}
