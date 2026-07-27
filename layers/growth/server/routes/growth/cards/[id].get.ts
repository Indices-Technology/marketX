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
