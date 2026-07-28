// GET /growth/cards/:id — serve a Growth Asset's card image as JPEG from OUR
// domain. TikTok's PULL_FROM_URL requires the media to sit on a *verified* domain
// and must NOT redirect — so we stream the bytes here rather than 302 to Cloudinary.
// Verify the URL-prefix `https://marketx.africa/growth/cards/` in the TikTok console.
//
// Public (no auth): the card is meant to be posted publicly; it holds no secrets.

/** Force a Cloudinary URL to JPEG — TikTok photo posts accept JPEG/WebP, not PNG. */
function toJpg(url: string): string {
  return url.includes('/upload/')
    ? url.replace('/upload/', '/upload/f_jpg,q_auto/')
    : url
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  // TikTok URL-prefix verification: it fetches `tiktok{TOKEN}.txt` under this
  // prefix and expects the body `tiktok-developers-site-verification={TOKEN}`.
  // If TIKTOK_SITE_VERIFICATION is set, only that exact token is served (locks the
  // prefix to your app); if unset, we echo the requested token so first-time
  // verification works before you add the env var.
  const verify = /^tiktok([A-Za-z0-9_-]+)\.txt$/.exec(id)
  if (verify) {
    const configured = process.env.TIKTOK_SITE_VERIFICATION
    const token = verify[1]!
    if (!configured || configured === token) {
      setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
      return `tiktok-developers-site-verification=${token}`
    }
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const asset = await prisma.growthAsset.findUnique({
    where: { id },
    select: { content: true },
  })
  const src = ((asset?.content ?? {}) as { cardImageUrl?: string }).cardImageUrl
  if (!src) throw createError({ statusCode: 404, statusMessage: 'Card image not found' })

  const res = await fetch(toJpg(src))
  if (!res.ok) {
    logger.logError('[GET /growth/cards/:id]', new Error(`upstream ${res.status}`), {
      requestId: event.context?.requestId,
      id,
    })
    throw createError({ statusCode: 502, statusMessage: 'Could not fetch card image' })
  }

  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return Buffer.from(await res.arrayBuffer())
})
