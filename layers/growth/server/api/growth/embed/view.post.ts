// POST /api/growth/embed/view
// Logs a VIEW AttributionEvent for an EMBED distribution — called by the
// /embed/product/[slug] page on mount. Public, unauthenticated (the embed can be
// loaded by anyone, on any site) and intentionally silent on every "not really an
// error" case (unknown code, wrong channel, duplicate) — an embed widget on a
// stranger's site should never surface a failure in the response, and giving a
// distinct error for "wrong channel" vs "not found" would let a caller probe
// which codes exist. Body: { code }.
//
// Anti-inflation: the app-wide rate-limit middleware already caps this at
// 300 req/min/IP like every other public endpoint; on top of that, `once()`
// de-dupes repeat views of the SAME distribution from the SAME IP within a short
// window, so a refreshing tab can't inflate the count.

import { once } from '~~/server/utils/cache'

const VIEW_DEDUPE_TTL_SECONDS = 60

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    if (!code) return { success: true }

    const dist = await prisma.assetDistribution.findUnique({
      where: { shortCode: code },
      select: { id: true, channel: true },
    })
    // Unknown code or not an EMBED distribution — no-op, no error surfaced.
    if (!dist || dist.channel !== 'EMBED') return { success: true }

    const ip =
      getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      getHeader(event, 'x-real-ip') ||
      'unknown'

    await once(`embed:view:${code}:${ip}`, VIEW_DEDUPE_TTL_SECONDS, () =>
      prisma.attributionEvent.create({
        data: {
          distributionId: dist.id,
          type: 'VIEW',
          meta: {
            ip,
            ua: getHeader(event, 'user-agent') || null,
            referrer: getHeader(event, 'referer') || null,
          },
        },
      }),
    )

    return { success: true }
  } catch (error) {
    logger.logError('[POST /api/growth/embed/view]', error, {
      requestId: event.context?.requestId,
    })
    // Impression logging must never break the embed for the viewer.
    return { success: true }
  }
})
