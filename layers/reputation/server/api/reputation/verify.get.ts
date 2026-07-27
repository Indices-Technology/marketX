// GET /api/reputation/verify?q=<identifier> — the buyer-facing "check any
// seller" lookup behind the Verify door. Resolves a pasted identifier (a
// MarketX link, a public Seller ID, a phone, or an @handle) to ONE of three
// honest states:
//
//   verified   → on MarketX AND has real evidence / is_verified — we can vouch
//   unverified → on MarketX but hasn't earned/completed verification
//   unknown    → no MarketX footprint. We can't vouch, only (later) scam-screen
//                and offer protected payment. Absence of a record is never
//                dressed up as a clean bill.
//
// Guest-usable (skipAuth). We deliberately return NO reassuring signal for a
// stranger — a scammer with no record must not look like a verified seller.

import { resolveProfile } from '~~/layers/reputation/server/utils/reputationEngine'

type VerifyStatus = 'verified' | 'unverified' | 'unknown'
type MatchedBy = 'link' | 'id' | 'phone' | 'handle'

const SELLER_SELECT = {
  id: true,
  publicId: true,
  store_name: true,
  store_slug: true,
  store_logo: true,
  store_location: true,
  is_verified: true,
  cac_verified: true,
  created_at: true,
} as const

// Pull a store slug out of a pasted MarketX link, if that's what this is.
function slugFromLink(raw: string): string | null {
  const m = raw.match(/\/sellers\/profile\/([^/?#\s]+)/i)
  return m?.[1] ?? null
}

// Collapse a public Seller ID to its normalized form (MX-LAG-J8KP → MXLAGJ8KP).
function normalizePublicId(raw: string): string | null {
  const collapsed = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return collapsed.startsWith('MX') && collapsed.length >= 6 ? collapsed : null
}

// Digits only; last 9 tolerates +234 / leading-0 variants of the same number.
function phoneDigits(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  return d.length >= 7 ? d.slice(-9) : null
}

// @handle or bare handle → lowercase, no leading @.
function handleOf(raw: string): string | null {
  const h = raw.trim().replace(/^@/, '').toLowerCase()
  return /^[a-z0-9._]{2,40}$/.test(h) ? h : null
}

async function resolveSeller(q: string) {
  // 1) A pasted MarketX profile link → slug (most precise).
  const slug = slugFromLink(q)
  if (slug) {
    const s = await prisma.sellerProfile.findUnique({
      where: { store_slug: slug },
      select: SELLER_SELECT,
    })
    if (s) return { seller: s, matchedBy: 'link' as MatchedBy }
  }

  // 2) Public Seller ID (MX-…). Match the normalized (hyphen/case-insensitive)
  //    form first, then fall back to the raw publicId as printed on the card —
  //    so it resolves whether or not publicIdNormalized has been backfilled.
  const pid = normalizePublicId(q)
  if (pid) {
    const s = await prisma.sellerProfile.findFirst({
      where: {
        OR: [{ publicIdNormalized: pid }, { publicId: q.trim().toUpperCase() }],
      },
      select: SELLER_SELECT,
    })
    if (s) return { seller: s, matchedBy: 'id' as MatchedBy }
  }

  // 3) Phone — loose contains on the last 9 digits (store_phone isn't normalized).
  const phone = phoneDigits(q)
  if (phone) {
    const s = await prisma.sellerProfile.findFirst({
      where: { store_phone: { contains: phone } },
      select: SELLER_SELECT,
    })
    if (s) return { seller: s, matchedBy: 'phone' as MatchedBy }
  }

  // 4) Social @handle across the platforms kept in store_socials JSON, or a
  //    bare handle that happens to be their store slug. (case-sensitive contains
  //    is a known limitation — good enough until handles are normalized on save.)
  const handle = handleOf(q)
  if (handle) {
    const s = await prisma.sellerProfile.findFirst({
      where: {
        OR: [
          { store_slug: handle },
          { store_socials: { path: ['instagram'], string_contains: handle } },
          { store_socials: { path: ['tiktok'], string_contains: handle } },
          { store_socials: { path: ['facebook'], string_contains: handle } },
        ],
      },
      select: SELLER_SELECT,
    })
    if (s) return { seller: s, matchedBy: 'handle' as MatchedBy }
  }

  return null
}

export default defineEventHandler(async (event) => {
  try {
    const q = String(getQuery(event).q ?? '').trim()
    if (!q) {
      throw createError({ statusCode: 400, statusMessage: 'Missing query' })
    }

    const match = await resolveSeller(q)

    // Stranger: no MarketX footprint. Return nothing reassuring — scam-report
    // screening is a TODO for when the reports table lands.
    if (!match) {
      return {
        success: true,
        data: { status: 'unknown' as VerifyStatus, query: q },
      }
    }

    const { seller, matchedBy } = match
    const c = await resolveProfile(seller)
    const status: VerifyStatus =
      seller.is_verified || c.enoughEvidence ? 'verified' : 'unverified'

    return {
      success: true,
      data: {
        status,
        query: q,
        matchedBy,
        seller: {
          store_slug: seller.store_slug,
          store_name: seller.store_name,
          store_logo: seller.store_logo,
          store_location: seller.store_location,
          publicId: seller.publicId,
          is_verified: seller.is_verified,
          cac_verified: seller.cac_verified,
          enoughEvidence: c.enoughEvidence,
          tier: c.tier,
          headline: c.enoughEvidence
            ? `${c.facts.sales} protected order${c.facts.sales === 1 ? '' : 's'} completed`
            : 'On MarketX, still building a track record',
        },
      },
    }
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    logger.logError('[GET /api/reputation/verify]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Verification lookup failed',
    })
  }
})
