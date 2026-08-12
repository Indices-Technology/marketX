// GET /api/reputation/tiers?slugs=a,b,c — seller tier for a batch of stores.
//
// Exists so compact surfaces (the feed action rail, product tiles) can label a
// seller with their earned tier without pulling the whole trust profile. A feed
// screen holds ~15 mounted slides; one batched call keeps that at a single
// request instead of 15.
//
// Returns null for a seller below the minimum-evidence threshold (§1.6) — the
// caller shows its neutral fallback rather than implying an unearned rank.

import { resolveProfile } from '~~/layers/reputation/server/utils/reputationEngine'

/** Bounded so a crafted query string can't fan out into unbounded work. */
const MAX_SLUGS = 30

export default defineEventHandler(async (event) => {
  try {
    const raw = String(getQuery(event).slugs ?? '')
    const slugs = [
      ...new Set(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ].slice(0, MAX_SLUGS)

    if (!slugs.length) return { success: true, data: {} }

    const sellers = await prisma.sellerProfile.findMany({
      where: { store_slug: { in: slugs } },
      select: {
        id: true,
        store_slug: true,
        is_verified: true,
        cac_verified: true,
        created_at: true,
      },
    })

    // Snapshot-backed (recomputes only when missing/stale), same path the
    // profile tab and spotlight rail use — so a tier can never disagree with
    // the Trust Card it links to.
    const resolved = await Promise.all(
      sellers.map(
        async (s) => [s.store_slug, (await resolveProfile(s)).tier] as const,
      ),
    )

    // Every requested slug gets a key, including unknown stores — the client
    // caches the null and won't ask again.
    const data: Record<string, string | null> = Object.fromEntries(
      slugs.map((s) => [s, null]),
    )
    for (const [slug, tier] of resolved) data[slug] = tier

    return { success: true, data }
  } catch (error: unknown) {
    logger.logError('[GET /api/reputation/tiers]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load seller tiers',
    })
  }
})
