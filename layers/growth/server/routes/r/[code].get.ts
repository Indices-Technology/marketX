// GET /r/:code — resolve a Growth Asset distribution short link and 302 to its
// destination. This is the public entry point every QR/shared link routes through.
//
// Small bite: redirect only. Attribution logging (recording a CLICK/SCAN
// AttributionEvent) is the next bite — see docs/GROWTH_ENGINE.md §3.

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

  return sendRedirect(event, commerce.canonicalUrl, 302)
})
