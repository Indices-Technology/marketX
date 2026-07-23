// Reputation engine (framework §4). Turns real evidence into a versioned
// ReputationProfile snapshot. `resolveProfile` reads the cached snapshot and,
// only when it's missing or stale, recomputes and persists a new one — so the
// hot path is a single indexed read instead of the per-seller aggregation the
// spotlight used to do on every request.
//
// Resilient by design: if the ReputationProfile table doesn't exist yet (before
// the migration is applied) every DB step is swallowed and we serve a freshly
// computed profile. Correctness now, speed once the snapshot lands.

import {
  ENGINE_VERSION,
  MIN_EVIDENCE,
  SNAPSHOT_TTL_MS,
  BAND_SCORE,
  commerceBand,
  identityBand,
  tierFrom,
  type Band,
  type Tier,
} from '../reputation.registry'
import { sellerTrustFacts } from './trustFacts'
import { reduceSignalsToFacts, type SignalRow } from './signalReduce'

/** Identity fields the engine needs (from SellerProfile). */
export interface SellerBasic {
  id: string
  is_verified: boolean
  cac_verified: boolean
  created_at: Date
}

export interface ComputedFacts {
  sales: number
  delivered: number
  disputeRate: number
  reviewCount: number
  rating: number | null
  tenureYears: number
  lastPlace: string | null
  lastAt: string | null
}

export interface ComputedDimension {
  key: string
  label: string
  band: Band
  score: number | null
  fact: string
}

export interface ReputationComputed {
  engineVersion: string
  /** 'ledger' once the seller has signals; 'live' fallback until backfilled. */
  source: 'ledger' | 'live'
  enoughEvidence: boolean
  tier: Tier | null
  facts: ComputedFacts
  dimensions: ComputedDimension[]
}

/** Read the seller's COMMERCE signals from the ledger; null if none/unmigrated. */
async function trustFactsFromSignals(sellerId: string, createdAt: Date) {
  try {
    const signals = await prisma.reputationSignal.findMany({
      where: {
        sellerId,
        dimension: 'COMMERCE',
        revokedAt: null,
        supersededById: null,
      },
      select: { signalKey: true, value: true, observedAt: true },
    })
    if (!signals.length) return null
    return reduceSignalsToFacts(signals as SignalRow[], createdAt)
  } catch {
    // Ledger not migrated yet → caller falls back to live aggregation.
    return null
  }
}

/** Compute a profile — from the ledger when populated, else live tables. */
export async function computeProfileFor(
  seller: SellerBasic,
): Promise<ReputationComputed> {
  const fromLedger = await trustFactsFromSignals(seller.id, seller.created_at)
  const f = fromLedger ?? (await sellerTrustFacts(seller.id, seller.created_at))
  const source: 'ledger' | 'live' = fromLedger ? 'ledger' : 'live'
  const enoughEvidence = f.sales >= MIN_EVIDENCE

  const cBand = commerceBand(f.sales, f.disputeRate)
  const iBand = identityBand(seller)

  const dimensions: ComputedDimension[] = [
    {
      key: 'COMMERCE',
      label: 'Commerce',
      band: cBand,
      score: BAND_SCORE[cBand],
      fact: enoughEvidence
        ? `${f.delivered || f.sales} ${f.delivered > 0 ? 'verified' : 'completed'} · ${f.disputeRate.toFixed(1)}% disputes${
            f.reviewCount > 0 && f.rating != null
              ? ` · ${f.rating.toFixed(1)}★ (${f.reviewCount})`
              : ''
          }`
        : 'Not enough sales yet',
    },
    {
      key: 'IDENTITY',
      label: 'Identity',
      band: iBand,
      score: BAND_SCORE[iBand],
      fact:
        [
          seller.is_verified ? 'Verified' : null,
          seller.cac_verified ? 'CAC registered' : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Not yet verified',
    },
    {
      key: 'COMMUNITY',
      label: 'Community',
      band: 'NOT_PROVIDED',
      score: null,
      fact: 'Not provided',
    },
    {
      key: 'FINANCIAL',
      label: 'Financial',
      band: 'NOT_PROVIDED',
      score: null,
      fact: 'Not provided',
    },
    {
      key: 'SOCIAL',
      label: 'Social',
      band: 'NOT_PROVIDED',
      score: null,
      fact: 'Not provided',
    },
  ]

  return {
    engineVersion: ENGINE_VERSION,
    source,
    enoughEvidence,
    tier: enoughEvidence ? tierFrom(f.sales, f.disputeRate) : null,
    facts: {
      sales: f.sales,
      delivered: f.delivered,
      disputeRate: Number(f.disputeRate.toFixed(1)),
      reviewCount: f.reviewCount,
      rating: f.rating != null ? Number(f.rating.toFixed(1)) : null,
      tenureYears: f.tenureYears,
      lastPlace: f.lastOrder?.place ?? null,
      lastAt: f.lastOrder ? new Date(f.lastOrder.at).toISOString() : null,
    },
    dimensions,
  }
}

/** Read the current snapshot; recompute + persist only if missing/stale. */
export async function resolveProfile(
  seller: SellerBasic,
): Promise<ReputationComputed> {
  try {
    const snap = await prisma.reputationProfile.findFirst({
      where: { sellerId: seller.id, isCurrent: true },
      orderBy: { computedAt: 'desc' },
    })
    if (
      snap &&
      Date.now() - new Date(snap.computedAt).getTime() < SNAPSHOT_TTL_MS
    ) {
      const stored = snap.facts as unknown as {
        enoughEvidence: boolean
        tier: Tier | null
        source?: 'ledger' | 'live'
        facts: ComputedFacts
      }
      return {
        engineVersion: snap.engineVersion,
        source: stored.source ?? 'live',
        enoughEvidence: stored.enoughEvidence,
        tier: stored.tier,
        facts: stored.facts,
        dimensions: snap.dimensions as unknown as ComputedDimension[],
      }
    }
  } catch {
    // Table not migrated yet → compute live below.
  }

  const computed = await computeProfileFor(seller)
  void persistSnapshot(seller.id, computed)
  return computed
}

/** Best-effort snapshot write; keeps history (isCurrent flips on the old row). */
async function persistSnapshot(sellerId: string, c: ReputationComputed) {
  try {
    await prisma.$transaction([
      prisma.reputationProfile.updateMany({
        where: { sellerId, isCurrent: true },
        data: { isCurrent: false },
      }),
      prisma.reputationProfile.create({
        data: {
          sellerId,
          engineVersion: c.engineVersion,
          facts: {
            enoughEvidence: c.enoughEvidence,
            tier: c.tier,
            source: c.source,
            facts: c.facts,
          } as object,
          dimensions: c.dimensions as unknown as object,
        },
      }),
    ])
  } catch {
    // No-op until the ReputationProfile table exists.
  }
}
