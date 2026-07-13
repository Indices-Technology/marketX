/**
 * MarketX Card image — a shareable graphic composited by Cloudinary.
 *
 * Powers both rich link previews (og:image) and the seller's downloadable
 * templates. Works whether or not the store has a Cloudinary banner:
 *   - Cloudinary banner  → used as the base, darkened for text legibility.
 *   - anything else       → a solid brand canvas (Cloudinary's always-present
 *                           `sample` image colorized to a flat colour).
 *
 * Text layers are percentage-positioned so one recipe scales across every
 * template aspect ratio (OG, story, square, …).
 */

export interface CardImageSeller {
  store_name?: string | null
  store_banner?: string | null
  publicId?: string | null
}

export interface CardImageOpts {
  /** Cloudinary cloud name (runtimeConfig.public.cloudinaryCloud). */
  cloud: string
  /** Memorable link shown on the image, e.g. "marketx.africa/ada-styles". */
  displayUrl: string
  width: number
  height: number
}

// Cloudinary text must be URL-encoded, and `/` `,` further double-encoded so
// they survive the transformation path.
function txt(s: string, max = 42): string {
  return encodeURIComponent(String(s).slice(0, max))
    .replace(/%2F/g, '%252F')
    .replace(/%2C/g, '%252C')
}

/** Extract a Cloudinary public_id (folder/name, no version/ext) from a URL. */
function bannerPublicId(url?: string | null): string | null {
  if (!url || !url.includes('cloudinary.com')) return null
  const i = url.indexOf('/upload/')
  if (i === -1) return null
  let after = url.slice(i + '/upload/'.length)
  // Drop a leading transform segment (has commas or known prefixes) then version.
  if (/^[a-z0-9_,:.%-]+\//i.test(after) && /[,_]/.test(after.split('/')[0]))
    after = after.replace(/^[^/]+\//, '')
  after = after.replace(/^v\d+\//, '')
  return after.replace(/\.[a-z0-9]+$/i, '') || null
}

/** Build the composite Cloudinary URL. Returns '' when no cloud is configured. */
export function storeCardImage(
  seller: CardImageSeller,
  opts: CardImageOpts,
): string {
  const { cloud, displayUrl, width: w, height: h } = opts
  if (!cloud) return ''

  const pad = Math.round(w * 0.06)
  const bpid = bannerPublicId(seller?.store_banner)
  const base = bpid || 'sample'
  const canvas = bpid
    ? `w_${w},h_${h},c_fill,e_brightness:-48,q_auto`
    : `w_${w},h_${h},c_fill,e_colorize:100,co_rgb:0f172a,q_auto`

  const name = txt(seller?.store_name || 'Store')
  const id = txt(seller?.publicId || '')
  const link = txt(displayUrl)

  const nameSize = Math.round(w * 0.064)
  const idSize = Math.round(w * 0.03)
  const smallSize = Math.round(w * 0.027)

  const layers = [
    id &&
      `co_rgb:f43f5e,l_text:Arial_${idSize}_bold:${id}/fl_layer_apply,g_north_west,x_${pad},y_${Math.round(h * 0.32)}`,
    `co_white,l_text:Arial_${nameSize}_bold:${name},c_fit,w_${w - 2 * pad}/fl_layer_apply,g_north_west,x_${pad},y_${Math.round(h * 0.38)}`,
    link &&
      `co_white,l_text:Arial_${smallSize}:${link}/fl_layer_apply,g_south_west,x_${pad},y_${pad}`,
    `co_rgb:f43f5e,l_text:Arial_${Math.round(w * 0.032)}_bold:MarketX/fl_layer_apply,g_south_east,x_${pad},y_${pad}`,
  ].filter(Boolean)

  return `https://res.cloudinary.com/${cloud}/image/upload/${canvas}/${layers.join('/')}/${base}.jpg`
}

/** The share/download templates. */
export const CARD_TEMPLATES = [
  { id: 'og', label: 'Link preview', width: 1200, height: 630 },
  { id: 'story', label: 'WhatsApp / IG Story', width: 1080, height: 1920 },
  { id: 'square', label: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'facebook', label: 'Facebook', width: 1200, height: 630 },
  { id: 'print', label: 'Printable (A5)', width: 1748, height: 2480 },
  { id: 'business', label: 'Business card', width: 1050, height: 600 },
] as const
