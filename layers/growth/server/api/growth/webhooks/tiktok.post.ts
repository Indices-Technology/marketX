// POST /api/growth/webhooks/tiktok
// Receiver for TikTok webhook events (post publish status, etc.). TikTok requires
// a callback URL that returns 200 — this satisfies the app's "Test URL" check and
// is where post-status → attribution updates will hook in later.
//
// Public endpoint (no seller auth — TikTok calls it server-to-server). Always 200
// so TikTok doesn't disable the subscription; real handling is logged.
//
// TODO: verify the signature. TikTok signs with the client secret via the
// `TikTok-Signature` header — validate it before trusting the payload for state
// changes (safe to defer while we only log).

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => null)
    logger.info?.('[tiktok webhook]', {
      event: (body as { event?: string })?.event,
      requestId: event.context?.requestId,
    })
    // Ack fast — event fan-out (update AssetDistribution status) comes with the
    // tiktok channel build.
    return { received: true }
  } catch (error) {
    logger.logError('[POST /api/growth/webhooks/tiktok]', error, {
      requestId: event.context?.requestId,
    })
    // Still 200 — a non-2xx makes TikTok retry then disable the subscription.
    return { received: true }
  }
})
