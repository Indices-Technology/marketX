// GET /r/:code — resolve a Growth Asset distribution short link, record the hit as
// an AttributionEvent, then 302 to its destination. Every QR / shared link routes
// through here — this is where the funnel data enters. See docs/GROWTH_ENGINE.md §3.

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing link code' })
  }

  const dist = await prisma.assetDistribution.findUnique({
    where: { shortCode: code },
    include: { asset: true },
  })
  if (!dist) {
    throw createError({ statusCode: 404, statusMessage: 'Link not found' })
  }

  const commerce = (dist.asset.commerce ?? {}) as { canonicalUrl?: string }
  if (!commerce.canonicalUrl) {
    // A distribution should always resolve; a missing destination is a data bug.
    logger.logError(
      '[GET /r/:code]',
      new Error('distribution asset has no canonicalUrl'),
      { requestId: event.context?.requestId, shortCode: code },
    )
    throw createError({ statusCode: 404, statusMessage: 'Link has no destination' })
  }

  // AFFILIATE links carry the sharer's referral code so the existing order-time
  // commission attribution (captureAffiliateRef reading ?ref=) keeps working —
  // looked up live rather than baked in, so a short code never goes stale.
  let destination = commerce.canonicalUrl
  if (dist.channel === 'AFFILIATE' && dist.sharerProfileId) {
    const sharer = await prisma.profile.findUnique({
      where: { id: dist.sharerProfileId },
      select: { affiliateCode: true },
    })
    if (sharer?.affiliateCode) {
      const url = new URL(destination)
      url.searchParams.set('ref', sharer.affiliateCode)
      destination = url.toString()
    }
  }

  // Record the hit — the CARD's own code is a physical/screenshot SCAN; every other
  // channel's code is a link CLICK. Fire-and-forget so a logging hiccup never blocks
  // the buyer's redirect.
  prisma.attributionEvent
    .create({
      data: {
        distributionId: dist.id,
        type: dist.channel === 'CARD' ? 'SCAN' : 'CLICK',
        meta: {
          ip: getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() || null,
          ua: getHeader(event, 'user-agent') || null,
          referrer: getHeader(event, 'referer') || null,
        },
      },
    })
    .catch((error) =>
      logger.logError('[GET /r/:code] attribution log failed', error, {
        requestId: event.context?.requestId,
        shortCode: code,
      }),
    )

  return sendRedirect(event, commerce.canonicalUrl, 302)
})
