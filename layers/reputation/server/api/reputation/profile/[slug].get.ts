// GET /api/reputation/profile/[slug] — the full trust view for one seller,
// used by the Trust tab on the seller profile (framework §5 buyer view). Reads
// a versioned ReputationProfile snapshot via the engine (live fallback until the
// snapshot table is migrated). Consent-gated dimensions read "not provided",
// never a penalty (§1.5).

import { resolveProfile } from '~~/layers/reputation/server/utils/reputationEngine'
import {
  tenureChip,
  daysAgo,
} from '~~/layers/reputation/server/utils/trustFacts'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing store slug',
      })
    }

    return await remember(`reputation:profile:v1:${slug}`, 180, async () => {
      const seller = await prisma.sellerProfile.findUnique({
        where: { store_slug: slug },
        select: {
          id: true,
          publicId: true,
          store_name: true,
          store_slug: true,
          store_logo: true,
          store_location: true,
          is_verified: true,
          cac_verified: true,
          created_at: true,
        },
      })

      if (!seller) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Seller not found',
        })
      }

      const c = await resolveProfile(seller)
      const f = c.facts

      return {
        success: true,
        data: {
          id: seller.id,
          publicId: seller.publicId,
          store_name: seller.store_name,
          store_slug: seller.store_slug,
          store_logo: seller.store_logo,
          store_location: seller.store_location,
          is_verified: seller.is_verified,
          cac_verified: seller.cac_verified,
          enoughEvidence: c.enoughEvidence,
          // Whether facts came from the append-only ledger or the live fallback.
          source: c.source,
          tier: c.tier,
          headline: c.enoughEvidence
            ? f.delivered > 0
              ? `${f.delivered} of ${f.sales} orders delivered as described`
              : `${f.sales} protected order${f.sales === 1 ? '' : 's'} completed`
            : 'This seller is just getting started on MarketX',
          facts: {
            sales: f.sales,
            delivered: f.delivered,
            disputeRate: f.disputeRate,
            reviewCount: f.reviewCount,
            rating: f.rating,
            tenure: tenureChip(f.tenureYears),
            lastSale: f.lastAt
              ? `Last sale to ${f.lastPlace ?? 'a buyer'} · ${daysAgo(new Date(f.lastAt))}`
              : null,
          },
          dimensions: c.dimensions,
        },
      }
    })
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    logger.logError('[GET /api/reputation/profile/[slug]]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load trust profile',
    })
  }
})
