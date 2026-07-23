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

/** A plain folder/name id — no separators Cloudinary would read as transforms. */
const SAFE_PUBLIC_ID = /^[A-Za-z0-9_\-/]+$/

/**
 * Extract a Cloudinary public_id (folder/name, no version/ext) from a URL.
 *
 * Hardened, because the source is attacker-controlled: `store_banner` accepts
 * ANY url (seller.schema → `z.string().url()`), and this id is interpolated
 * straight into the composed transformation path.
 *   - Real host check. A substring test like `includes('cloudinary.com')` would
 *     happily accept `https://evil.com/cloudinary.com/upload/x.jpg`.
 *   - Our cloud + image/upload only, so a crafted URL can't point the base at
 *     another delivery type.
 *   - Strict charset. Without it a banner could smuggle `,`/`:` segments into
 *     the URL and bolt extra (expensive) transforms onto every render.
 * Anything suspicious returns null, and callers fall back to the brand canvas.
 */
function bannerPublicId(
  url: string | null | undefined,
  cloud: string,
): string | null {
  if (!url || !cloud) return null

  let path: string
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com') return null
    path = u.pathname
  } catch {
    return null // not a parseable absolute URL
  }

  const marker = `/${cloud}/image/upload/`
  if (!path.startsWith(marker)) return null
  let after = path.slice(marker.length)

  // Drop a leading transform segment (has commas or known prefixes) then version.
  if (/^[a-z0-9_,:.%-]+\//i.test(after) && /[,_]/.test(after.split('/')[0]))
    after = after.replace(/^[^/]+\//, '')
  after = after.replace(/^v\d+\//, '')
  after = after.replace(/\.[a-z0-9]+$/i, '')

  if (!after || after.includes('..') || !SAFE_PUBLIC_ID.test(after)) return null
  return after
}

/** Build the composite Cloudinary URL. Returns '' when no cloud is configured. */
export function storeCardImage(
  seller: CardImageSeller,
  opts: CardImageOpts,
): string {
  const { cloud, displayUrl, width: w, height: h } = opts
  if (!cloud) return ''

  const pad = Math.round(w * 0.06)
  const bpid = bannerPublicId(seller?.store_banner, cloud)
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

export interface CardImageProduct {
  title?: string | null
  /** Product cover URL — the Cloudinary photo is used as the base when possible. */
  imageUrl?: string | null
  /** Pre-formatted price, e.g. "₦45,000". */
  priceText?: string | null
  sellerName?: string | null
  sellerPublicId?: string | null
}

/**
 * Product card image for rich link previews — mirrors storeCardImage but leads
 * with the product photo, price and title. Same graceful fallback: a Cloudinary
 * cover is used as the (darkened) base; anything else → a solid brand canvas.
 */
export function productCardImage(
  product: CardImageProduct,
  opts: CardImageOpts,
): string {
  const { cloud, displayUrl, width: w, height: h } = opts
  if (!cloud) return ''

  const pad = Math.round(w * 0.06)
  const cpid = bannerPublicId(product?.imageUrl, cloud)
  const base = cpid || 'sample'
  const canvas = cpid
    ? `w_${w},h_${h},c_fill,e_brightness:-45,q_auto`
    : `w_${w},h_${h},c_fill,e_colorize:100,co_rgb:0f172a,q_auto`

  const title = txt(product?.title || 'Product', 60)
  const price = txt(product?.priceText || '')
  const seller = txt(
    [product?.sellerName, product?.sellerPublicId].filter(Boolean).join(' · '),
    48,
  )
  const link = txt(displayUrl)

  const priceSize = Math.round(w * 0.068)
  const titleSize = Math.round(w * 0.05)
  const smallSize = Math.round(w * 0.027)

  const layers = [
    price &&
      `co_rgb:f43f5e,l_text:Arial_${priceSize}_bold:${price}/fl_layer_apply,g_north_west,x_${pad},y_${Math.round(h * 0.28)}`,
    `co_white,l_text:Arial_${titleSize}_bold:${title},c_fit,w_${w - 2 * pad}/fl_layer_apply,g_north_west,x_${pad},y_${Math.round(h * 0.42)}`,
    seller &&
      `co_white,l_text:Arial_${smallSize}:${seller}/fl_layer_apply,g_north_west,x_${pad},y_${Math.round(h * 0.62)}`,
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
