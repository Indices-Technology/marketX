import { initialsAvatar } from '~~/shared/utils/avatar'

/**
 * Build an optimised Cloudinary URL by injecting transformation parameters.
 *
 * Transforms applied:
 *  - w_<width>        resize to target width (proportional)
 *  - c_fill           crop mode so images fill the requested dimensions
 *  - f_auto           serve WebP/AVIF automatically based on browser support
 *  - q_auto:good      Cloudinary picks quality; "good" is best for mobile bandwidth
 *
 * Non-Cloudinary URLs are returned unchanged, so the helper is safe to call
 * on any URL including placeholders or external sources.
 */
export function cloudinaryUrl(
  url: string | null | undefined,
  opts: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad' | 'limit'
    quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low' | number
    format?: 'auto' | 'webp' | 'avif'
  } = {},
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com')) return url

  const uploadMarker = '/upload/'
  const idx = url.indexOf(uploadMarker)
  if (idx === -1) return url

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto',
  } = opts

  const parts: string[] = []
  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (width || height) parts.push(`c_${crop}`)
  parts.push(`f_${format}`)
  parts.push(`q_${quality}`)

  const transforms = parts.join(',')
  const before = url.slice(0, idx + uploadMarker.length)
  const after = url.slice(idx + uploadMarker.length)

  // Don't double-insert transforms if they're already present
  if (
    after.startsWith('w_') ||
    after.startsWith('f_') ||
    after.startsWith('q_')
  ) {
    return url
  }

  return `${before}${transforms}/${after}`
}

/** Preset: tiny square thumbnail for grid cards (mobile-first) */
export const imgThumb = (url: string | null | undefined) =>
  cloudinaryUrl(url, { width: 400, height: 400, crop: 'fill' })

/** Preset: feed/post image — wider but still compressed */
export const imgFeed = (url: string | null | undefined) =>
  cloudinaryUrl(url, { width: 720 })

/** Preset: small avatar */
export const imgAvatar = (url: string | null | undefined) =>
  cloudinaryUrl(url, { width: 96, height: 96, crop: 'fill' })

/**
 * Canonical avatar source: an optimised real avatar, or a LOCAL initials avatar
 * (inline SVG data URI) when there's none. Never returns an external URL, so it
 * can't be blocked by CSP or fail because a third-party avatar service is down.
 */
export const avatarSrc = (
  url: string | null | undefined,
  seed?: string | null,
): string => (url ? imgAvatar(url) : initialsAvatar(seed))

/** Preset: full-width modal/detail view */
export const imgDetail = (url: string | null | undefined) =>
  cloudinaryUrl(url, { width: 1080, quality: 'auto' })

/**
 * Category thumbnail — handles both Cloudinary uploads and Unsplash seed URLs.
 * For Cloudinary: injects fill/crop transforms.
 * For Unsplash: rewrites the w/h params directly on the CDN URL (no proxy needed).
 * @param size - pixel dimension for both width and height (square crop), default 64
 */
export function catThumb(url: string | null | undefined, size = 64): string {
  if (!url) return ''
  if (url.includes('cloudinary.com')) {
    return cloudinaryUrl(url, { width: size, height: size, crop: 'fill' })
  }
  if (url.includes('unsplash.com')) {
    try {
      const u = new URL(url)
      u.searchParams.set('w', String(size))
      u.searchParams.set('h', String(size))
      u.searchParams.set('fit', 'crop')
      u.searchParams.set('auto', 'format')
      u.searchParams.set('q', '80')
      return u.toString()
    } catch {
      return url
    }
  }
  return url
}

/**
 * LQIP — Low Quality Image Placeholder.
 * 20 px wide, auto-compressed. Loads in < 100 ms even on 3G.
 * Use as an inline CSS background that shows instantly while the real image fetches.
 */
export const imgLqip = (url: string | null | undefined) =>
  cloudinaryUrl(url, { width: 20, quality: 'auto:eco', format: 'auto' })

/**
 * Feed video URL — serves WebM to Chrome/Android (~30 % smaller than MP4),
 * capped at 720 p. Pass eco=true on slow networks for a lower bitrate encode.
 */
export const videoFeedUrl = (
  url: string | null | undefined,
  eco = false,
): string =>
  cloudinaryUrl(url, {
    width: 720,
    crop: 'limit',
    quality: eco ? 'auto:eco' : 'auto:good',
    format: 'auto',
  })

/** Max characters allowed in a watermark label — keeps it legible and cheap. */
export const WATERMARK_MAX_LEN = 24

/**
 * Normalise a watermark label: strip anything that isn't a safe, legible
 * character and cap the length. Shared by the settings input, the API schema,
 * and the render helper so all three agree on what's valid.
 */
export function sanitizeWatermarkText(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/[^\w @&.'-]/g, '') // letters, digits, _ and a few safe symbols
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, WATERMARK_MAX_LEN)
}

/**
 * Overlay a text watermark on a Cloudinary video and serve an optimised (720p,
 * auto-format) rendition. The overlay is applied at delivery time — the original
 * upload stays clean — and Cloudinary caches the derived asset after the first
 * request. Non-Cloudinary URLs (or empty text) fall back to the plain optimised
 * video so callers never have to branch.
 */
export function videoWatermarkUrl(
  url: string | null | undefined,
  text: string | null | undefined,
  opts: { eco?: boolean } = {},
): string {
  const { eco = false } = opts
  if (!url) return ''
  const label = sanitizeWatermarkText(text)
  if (!url.includes('cloudinary.com') || !label) return videoFeedUrl(url, eco)

  const uploadMarker = '/upload/'
  const idx = url.indexOf(uploadMarker)
  if (idx === -1) return url

  const before = url.slice(0, idx + uploadMarker.length)
  let after = url.slice(idx + uploadMarker.length)
  // Strip any existing leading transform segment so we don't stack them.
  if (/^[a-z0-9_,:.%-]+\//i.test(after)) after = after.replace(/^[^/]+\//, '')

  // Cloudinary text layers require the label URL-encoded (spaces → %20, etc.).
  const encoded = encodeURIComponent(label)
  const base = `w_720,c_limit,q_${eco ? 'auto:eco' : 'auto:good'},f_auto`
  // Bold white label, slightly transparent, bottom-right with a small inset.
  const overlay = `l_text:Arial_36_bold:${encoded},co_white,o_70`
  const apply = 'fl_layer_apply,g_south_east,x_28,y_28'

  return `${before}${base}/${overlay}/${apply}/${after}`
}

/**
 * Derive a static poster/thumbnail from a Cloudinary video URL.
 * Seeks to 0.5 s and returns a compressed JPEG.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function videoThumb(
  url: string | null | undefined,
  opts: { width?: number; height?: number; crop?: 'fill' | 'limit' } = {
    width: 400,
    height: 400,
  },
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com')) return url

  const uploadMarker = '/upload/'
  const idx = url.indexOf(uploadMarker)
  if (idx === -1) return url

  const before = url.slice(0, idx + uploadMarker.length)
  // Strip existing transforms
  let after = url.slice(idx + uploadMarker.length)
  // Remove any leading transform segment (contains commas or known prefixes)
  if (/^[a-z_,]+\//.test(after)) after = after.replace(/^[^/]+\//, '')

  // `fill` (default) center-crops to the requested box — right for square grid
  // and product thumbnails. `limit` scales down within the box preserving the
  // video's aspect ratio — use it for full-frame feed posters so a portrait
  // clip isn't cropped (e.g. the subject's head sliced off).
  const crop = opts.crop ?? 'fill'
  const parts: string[] = ['so_0.5'] // seek to 0.5 s
  if (opts.width) parts.push(`w_${opts.width}`)
  if (opts.height) parts.push(`h_${opts.height}`)
  if (opts.width || opts.height) parts.push(`c_${crop}`)
  parts.push('f_jpg', 'q_auto:good')

  // Replace video extension with .jpg
  const withJpg = after.replace(/\.[^./]+$/, '.jpg')
  return `${before}${parts.join(',')}/${withJpg}`
}

/**
 * Resolve a product's display thumbnail, handling VIDEO covers correctly.
 * Order: the still `bannerImageUrl` (set at upload) → a poster derived from a video
 * cover → the first image. Prevents the broken-placeholder bug where a video URL
 * was put straight into an <img> (e.g. in the affiliate marketplace list).
 */
export function productThumb(
  product: {
    bannerImageUrl?: string | null
    media?: Array<{ url?: string | null; type?: string | null }> | null
  },
  size = 400,
): string {
  if (product?.bannerImageUrl) return cloudinaryUrl(product.bannerImageUrl, { width: size, height: size, crop: 'fill' })
  const m = product?.media?.[0]
  if (!m?.url) return ''
  const isVideo = (m.type ?? '').toUpperCase() === 'VIDEO' || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(m.url)
  return isVideo ? videoThumb(m.url, { width: size, height: size }) : cloudinaryUrl(m.url, { width: size, height: size, crop: 'fill' })
}
