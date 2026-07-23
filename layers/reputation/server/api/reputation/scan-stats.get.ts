// GET /api/reputation/scan-stats?slug= — the seller's own Trust Card funnel
// metrics (scans, surfaces, 14-day trend, conversion rate). Owner-gated; the
// pilot's kill/scale numbers. Resilient until the TrustScanEvent table exists.

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { summarizeScans } from '~~/layers/reputation/server/utils/scanStats'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const slug = String(getQuery(event).slug || '').trim()
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing store slug',
      })
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { store_slug: slug },
      select: { id: true, profileId: true },
    })
    if (!seller) {
      throw createError({ statusCode: 404, statusMessage: 'Seller not found' })
    }
    if (seller.profileId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Not your store' })
    }

    let rows: {
      surface: string | null
      orderId: number | null
      created_at: Date
    }[] = []
    try {
      rows = await prisma.trustScanEvent.findMany({
        where: {
          sellerId: seller.id,
          created_at: { gte: new Date(Date.now() - 60 * 86_400_000) },
        },
        select: { surface: true, orderId: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 5000,
      })
    } catch {
      // TrustScanEvent table not migrated yet → empty stats.
    }

    return { success: true, data: summarizeScans(rows) }
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    logger.logError('[GET /api/reputation/scan-stats]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load scan stats',
    })
  }
})
