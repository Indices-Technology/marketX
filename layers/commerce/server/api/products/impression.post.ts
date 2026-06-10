import { analyticsService } from '~~/layers/commerce/server/services/analytics.service'

// POST /api/products/impression — batch-record product impressions from the feed
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const ids: unknown = body?.productIds
    if (!Array.isArray(ids) || !ids.length) return { success: true }

    const productIds = ids
      .map((id) => parseInt(String(id), 10))
      .filter((n) => !isNaN(n))

    // Fire-and-forget — client doesn't need to wait
    analyticsService.trackImpressions(productIds).catch(() => {})
    return { success: true }
  } catch {
    return { success: true }
  }
})
