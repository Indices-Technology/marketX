// GET /api/reputation/spotlight — top sellers for the home "Trusted this week"
// rail, ranked by REAL completed-sale evidence (framework §5.4). Each candidate
// resolves through the engine (snapshot-backed), and sellers below the
// minimum-evidence threshold (§1.6) never appear — no placeholder filler.

import { resolveProfile } from '~~/layers/reputation/server/utils/reputationEngine'
import {
  tenureChip,
  daysAgo,
} from '~~/layers/reputation/server/utils/trustFacts'

// How many candidates to score before ranking. Fine at pilot volume.
const CANDIDATE_POOL = 24

export default defineEventHandler(async (event) => {
  try {
    const limit = Math.min(Math.max(Number(getQuery(event).limit) || 8, 1), 12)

    return await remember(`reputation:spotlight:v1:${limit}`, 300, async () => {
      // Candidates: active sellers with at least one completed, paid order.
      const candidates = await prisma.sellerProfile.findMany({
        where: {
          is_active: true,
          products: {
            some: {
              variants: {
                some: {
                  orderItems: {
                    some: {
                      order: {
                        paymentStatus: 'PAID',
                        status: { in: ['COMPLETED', 'DELIVERED'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          publicId: true,
          store_name: true,
          store_slug: true,
          store_logo: true,
          is_verified: true,
          cac_verified: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: CANDIDATE_POOL,
      })

      const scored = await Promise.all(
        candidates.map(async (s) => ({ s, c: await resolveProfile(s) })),
      )

      const data = scored
        .filter(({ c }) => c.enoughEvidence)
        .sort((a, b) => b.c.facts.sales - a.c.facts.sales)
        .slice(0, limit)
        .map(({ s, c }) => {
          const f = c.facts

          const chips = [
            {
              icon: 'solar:lock-keyhole-minimalistic-bold',
              label: 'Escrow-protected',
            },
            s.cac_verified
              ? { icon: 'solar:shield-check-linear', label: 'CAC verified' }
              : s.is_verified
                ? { icon: 'solar:verified-check-linear', label: 'Verified' }
                : null,
            {
              icon: 'solar:calendar-minimalistic-linear',
              label: tenureChip(f.tenureYears),
            },
          ].filter(Boolean)

          const deliveryFact =
            f.delivered > 0
              ? `${f.delivered} verified deliveries`
              : `${f.sales} completed orders`
          const headline =
            f.delivered > 0
              ? `${f.delivered} of ${f.sales} orders delivered as described`
              : `${f.sales} protected order${f.sales === 1 ? '' : 's'} completed`
          const loyalty =
            f.reviewCount > 0 && f.rating != null
              ? `Rated ${f.rating.toFixed(1)}★ by ${f.reviewCount} buyer${f.reviewCount === 1 ? '' : 's'}`
              : `${tenureChip(f.tenureYears)} on MarketX`
          const recent = f.lastAt
            ? `Last sale to ${f.lastPlace ?? 'a buyer'} · ${daysAgo(new Date(f.lastAt))}`
            : ''
          const stats = `${deliveryFact} · ${f.disputeRate.toFixed(1)}% dispute rate · ${tenureChip(f.tenureYears)}`

          return {
            id: s.id,
            publicId: s.publicId,
            store_name: s.store_name,
            store_slug: s.store_slug,
            store_logo: s.store_logo,
            is_verified: s.is_verified,
            tier: c.tier,
            headline,
            loyalty,
            recent,
            chips,
            stats,
          }
        })

      return { success: true, data }
    })
  } catch (error: unknown) {
    logger.logError('[GET /api/reputation/spotlight]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load trust spotlight',
    })
  }
})
