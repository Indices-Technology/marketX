# MarketX Business Reputation Framework — Structuring Proposal

**Status:** Proposed · **Depends on:** Trust Card initiative · **Last updated:** 2026-07-22

The reputation layer that backs the Trust Card, the `/t/{publicId}` trust profile, and —
eventually — the institutional risk report banks/lenders consume. Companion strategy context:
[BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md](BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md) §1.

> **Core rule: don't score the business — score the evidence about the business.**
> Reputation is a *ledger of provenance-stamped signals*, and every displayed number is a
> versioned computation over that ledger. The ledger is the asset; scores are just views.

---

## 1. Design principles (non-negotiable)

1. **Append-only evidence ledger.** Signals are immutable. Corrections *supersede*, never edit.
   This is what makes the file auditable — a bank can ask "what did you know, when?"
2. **Provenance on every signal.** Source system, method, verifier, and a reference to the
   originating record. A claim without provenance is not a signal.
3. **Views, not a score.** Buyers, lenders, and logistics partners weight the *same ledger*
   differently. There is no single "MarketX score." Public view shows dimensions; institutional
   view shows numbers; both resolve to the same evidence.
4. **Tier ceilings are structural.** Gold (money movement) / Silver (institutional) / Bronze
   (social) — bronze signals are **capped at aggregation time**, not merely down-weighted.
   A million followers can never outrank one verified transaction. (Low weights alone fail:
   many bronze signals still add up. The cap is a hard clamp per dimension.)
5. **Absence is neutral in public view.** A seller who hasn't linked a bank account shows
   *"not provided"*, never a penalty — otherwise we coerce consent. In the *lender* view,
   absence legitimately matters. Views differ; the ledger doesn't.
6. **Minimum evidence thresholds.** A dimension with too little data displays "not enough
   data yet" — never a fake-precise number computed from three events.
7. **Never store raw PII.** KYC results (matched / not matched, provider, date), never the
   NIN/BVN itself. NDPA compliance and one less catastrophic breach surface.
8. **Weights are opinions until backtested.** v1 weights ship as a versioned registry and get
   recalibrated against outcomes (dispute prediction now; default prediction once credit
   launches). The defensibility path is *backtesting*, not cleverness.

---

## 2. Dimensions and signal mapping

Five dimensions, per the framework. Each signal maps to an **existing** source where one
exists — most do.

### 2.1 Identity Confidence (~20%) — *"Is this a real business run by a real person?"*

| Signal | Tier | Source (existing) | Provenance |
| --- | --- | --- | --- |
| Phone verified | Silver | `Profile` / checkout OTP flow | `PLATFORM_OTP` |
| Owner KYC (NIN match) | **Gold** | new — Smile ID / Dojah result | `KYC_PROVIDER` |
| CAC registered + verified | Silver | `SellerProfile.cac_number/cac_verified` | `CAC_REGISTRY` |
| Physical location verified | Silver | `SellerProfile.latitude/longitude` + new geo-proof | `FIELD_VERIFICATION` |
| Email/domain | Bronze | `store_email`, verification tokens | `PLATFORM_EMAIL` |

> `cac_verified` today is a bare boolean with no record of *how* it was verified. The ledger
> fixes exactly this: the boolean stays as a denormalised convenience; the signal carries the
> provenance.

### 2.2 Business Existence & History (~15%)

| Signal | Tier | Source |
| --- | --- | --- |
| Platform tenure | Silver | `SellerProfile.created_at` |
| Years operating (attested) | Silver | `Attestation` (association/chairman) |
| Social account age | Bronze | `ExternalAccountLink` (IG import) |
| Activity continuity | Silver | `lastActiveAt`, order cadence |

### 2.3 Commerce Performance (~35%) — the spine

All **Gold** — generated only from money movement on the rail. The evidence already exists:

| Signal | Source (existing, today) |
| --- | --- |
| Completed transactions / GMV | `Orders` (paymentStatus PAID, status COMPLETED) |
| Fulfillment rate | `Orders.status` transitions; `shippedAt` |
| **Delivery confirmed** | `Orders.deliveredAt` (carrier-scan-gated) · `PodDelivery.attemptOutcome/attemptProof` |
| Dispute rate + outcomes | `SupportTicket` + `DisputeOutcome` (REFUND_BUYER hits hard; REJECTED doesn't) |
| Refund/cancellation rate | `Orders`, `Transaction` |
| Repeat-buyer rate | distinct `Orders.userId` recurrence |
| Speed (processing, ship, deliver) | `created_at → shippedAt → deliveredAt` deltas |
| Verified reviews | `SellerReview` (already gated on completed order) |
| **Manual/concierge escrow** | new signal, `MANUAL_ESCROW` provenance — see §7 Phase 0 |

**Repeat-buyer nuance (wash-trading tension):** repeat customers are a positive signal *within
a band*. Beyond a concentration threshold (e.g. >40% of GMV from ≤3 counterparties), the
concentration itself becomes a negative anomaly signal. Same evidence, two readings — the
engine must model both.

### 2.4 Financial Behavior (~15–20%) — consent-gated

| Signal | Tier | Source |
| --- | --- | --- |
| Inflow consistency / volatility | Silver | `ExternalAccountLink` (Mono open banking) |
| Months active / avg. turnover | Silver | same |
| On-platform settlement history | **Gold** | `Transaction`, `Payout`, `SellerWallet` |

Only exists if the seller links an account. Public view: "not provided" if absent (§1.5).

### 2.5 Community Reputation (~10–15%) — the Nigerian advantage

| Signal | Tier | Source (existing) |
| --- | --- | --- |
| Square/association membership | Silver | `SquareMembership.status` + **`verifiedById`** (already recorded!) |
| Officer attestation | Silver | `SquareOfficer` (role + `appointedBy` chain) |
| Membership tenure | Silver | `SquareMembership.joinedAt` |
| Suspension history | Silver (negative) | `suspendedAt/suspendReason` |

**Alignment caveat:** `SquareWallet` earns a cut of member orders — the association has skin
in the game, which makes attestation credible *and* creates incentive to over-attest. Two
mitigations: attestations are **revocable** (a chairman who vouched carries the revocation
trail), and a Square whose members show anomalous dispute rates has its attestation weight
discounted as a group. Attest carefully or your Square's word is worth less — self-policing.

### 2.6 Social Presence (~10%) — Bronze, capped

IG/FB/TikTok age, engagement, Google reviews via `ExternalAccountLink`. Displayed for
continuity ("this is the same @ada_thrifts you follow"), structurally capped per §1.4.
100k followers + 20 disputes < 2k followers + 500 clean orders — *always*, by construction.

---

## 3. Data model (new)

Follows existing schema conventions (uuid PKs, `Timestamptz(6)`, snake `created_at`).

```prisma
/// Append-only evidence ledger. Rows are NEVER updated except lifecycle stamps
/// (supersededById, revokedAt). One row = one provenance-stamped observation.
model ReputationSignal {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId       String        @db.Uuid
  /// Key into the code registry (reputation.registry.ts), e.g. "kyc.nin_match",
  /// "commerce.order_completed", "community.membership_attested"
  signalKey      String
  /// Dimension shortcut for aggregation queries
  dimension      ReputationDimension
  tier           SignalTier    // GOLD | SILVER | BRONZE
  /// Signal payload — shape defined per signalKey in the registry
  value          Json
  /// 0–1: how sure we are of THIS observation (distinct from registry weight)
  confidence    Float          @default(1)
  // ── Provenance (the point of the whole model) ────────────────────────────
  sourceType     SignalSource  // ESCROW_TRANSACTION | MANUAL_ESCROW | KYC_PROVIDER | ...
  /// Originating record: "Orders:1234", "SquareMembership:uuid", "MonoLink:uuid"
  sourceRef      String?
  /// How it was verified: "SMILE_ID_NIN_MATCH", "CARRIER_SCAN", "CHAIRMAN_ATTEST"
  method         String
  /// Who verified (profileId of attester / "system" / provider name)
  verifierId     String?
  // ── Lifecycle ────────────────────────────────────────────────────────────
  observedAt     DateTime      @db.Timestamptz(6)
  expiresAt      DateTime?     @db.Timestamptz(6)  // KYC re-verification windows etc.
  supersededById String?       @db.Uuid            // corrections point forward
  revokedAt      DateTime?     @db.Timestamptz(6)  // attestation withdrawn
  revokedReason  String?
  created_at     DateTime      @default(now()) @db.Timestamptz(6)

  seller SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId, dimension, observedAt(sort: Desc)])
  @@index([signalKey])
  @@index([sourceRef]) // idempotency: one signal per source event
}

/// Cached computation output — rebuilt, never hand-edited. Keep history (one row
/// per computation) so "score as of date X, engine vN" is answerable for banks.
model ReputationProfile {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId      String   @db.Uuid
  engineVersion String   // "v1.0.0" — weights live in code, versioned
  /// Per-dimension: { score: 0-100 | null, band: HIGH|MEDIUM|LOW|INSUFFICIENT,
  ///                  evidenceCount, lastEvidenceAt }
  dimensions    Json
  /// Headline facts for the public page (protected sales, dispute %, tenure…)
  facts         Json
  computedAt    DateTime @default(now()) @db.Timestamptz(6)
  /// Latest row per seller is the live profile
  isCurrent     Boolean  @default(true)

  seller SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId, isCurrent])
  @@index([sellerId, computedAt(sort: Desc)])
}

/// A person/institution vouching for a seller. Generates a SIGNAL on create
/// and a negative-lifecycle signal on revoke. Revocations keep the attester honest.
model Attestation {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId     String    @db.Uuid
  attesterId   String    @db.Uuid  // profileId — chairman, officer, supplier
  /// ASSOCIATION_MEMBER | YEARS_OPERATING | SUPPLIER_REFERENCE | SHOP_EXISTS
  kind         String
  claim        Json      // { since: "2019", squareId: ..., note: ... }
  revokedAt    DateTime? @db.Timestamptz(6)
  revokedReason String?
  created_at   DateTime  @default(now()) @db.Timestamptz(6)

  @@index([sellerId])
  @@index([attesterId])
}

/// Linked external account (Mono bank link, IG business account, Google Business).
/// Stores link + consent scope — imported observations land in ReputationSignal.
model ExternalAccountLink {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId     String    @db.Uuid
  provider     String    // MONO | INSTAGRAM | GOOGLE_BUSINESS
  externalId   String    // provider-side account id (never credentials)
  scope        Json      // what the seller consented to share
  linkedAt     DateTime  @default(now()) @db.Timestamptz(6)
  revokedAt    DateTime? @db.Timestamptz(6)
  lastSyncedAt DateTime? @db.Timestamptz(6)

  @@unique([sellerId, provider, externalId])
}

/// Pull-based consent for third-party (lender) access to the institutional view.
/// NEVER push-based. One grant = one requester, scoped, expiring.
model ReputationConsentGrant {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId    String    @db.Uuid
  /// Who may pull: partner org identifier
  granteeOrg  String
  scope       Json      // which dimensions/facts are shared
  expiresAt   DateTime  @db.Timestamptz(6)
  revokedAt   DateTime? @db.Timestamptz(6)
  created_at  DateTime  @default(now()) @db.Timestamptz(6)

  @@index([sellerId])
}

/// Trust Card QR scan — the funnel's top. Which card, when, converted or not.
model TrustScanEvent {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId   String   @db.Uuid
  /// Where the QR lived: CARD | PLAQUE | IG_BIO | PARCEL
  surface    String?
  /// Filled if the scan led to a protected payment (funnel conversion)
  orderId    Int?
  created_at DateTime @default(now()) @db.Timestamptz(6)

  @@index([sellerId, created_at(sort: Desc)])
}

enum ReputationDimension {
  IDENTITY
  HISTORY
  COMMERCE
  FINANCIAL
  COMMUNITY
  SOCIAL
}

enum SignalTier {
  GOLD
  SILVER
  BRONZE
}

enum SignalSource {
  ESCROW_TRANSACTION
  MANUAL_ESCROW
  POD_DELIVERY
  KYC_PROVIDER
  CAC_REGISTRY
  OPEN_BANKING
  ASSOCIATION_ATTESTATION
  FIELD_VERIFICATION
  SOCIAL_IMPORT
  PLATFORM_OBSERVED
  SELF_REPORTED
}
```

**What is deliberately NOT in the database:** signal definitions, weights, decay curves, tier
caps, band thresholds. Those live in a **code registry** — `reputation.registry.ts` — typed,
reviewed, versioned (same pattern as Dasah's `skills.registry.ts`). Changing a weight is a PR
with an `engineVersion` bump, and old `ReputationProfile` rows remain interpretable forever.

```ts
// layers/reputation/server/reputation.registry.ts (shape sketch)
export const ENGINE_VERSION = '1.0.0'

export const signalDefs = {
  'commerce.order_completed': {
    dimension: 'COMMERCE', tier: 'GOLD',
    weight: 5, halfLifeDays: 365,          // decay: recent evidence counts more
  },
  'kyc.nin_match': {
    dimension: 'IDENTITY', tier: 'GOLD',
    weight: 5, expiresDays: 730,
  },
  'social.account_age': {
    dimension: 'SOCIAL', tier: 'BRONZE',
    weight: 3,
  },
  // ...
} satisfies Record<string, SignalDef>

export const dimensionConfig = {
  COMMERCE:  { weight: 0.35, minEvidence: 5,  bronzeCap: 0 },
  IDENTITY:  { weight: 0.20, minEvidence: 2,  bronzeCap: 0.1 },
  // bronzeCap: max fraction of a dimension's score attributable to BRONZE signals
  // ...
}
```

---

## 4. Computation architecture

```
domain events                     ReputationSignal (append-only)
(order completed, dispute   ──►   one row per event, idempotent on sourceRef
 resolved, KYC result,
 attestation, Mono sync)                    │
                                            ▼
                              Reputation Engine (BullMQ job)
                          registry weights · decay · tier caps ·
                          concentration analysis · min-evidence
                                            │
                                            ▼
                              ReputationProfile (versioned snapshot)
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
              Buyer view             Institutional view       Internal/Dasah
           /t/{publicId}            consent-gated report     agent context
           bands + facts            numbers + evidence       ("this seller is
           no composite             counts, engineVersion     Tier 2, 97% …")
```

- **Emission:** services that already write the domain records (`order.service`,
  support/dispute resolution, membership approval) enqueue a signal write — same
  fire-and-forget pattern as `auditQueue.enqueue` today. Idempotent on `sourceRef`.
- **Recompute:** event-driven for the affected seller (debounced), plus a nightly full pass
  (existing cron/queue infra). Snapshot history retained.
- **Backfill:** a one-time job replays existing `Orders`, `SellerReview`, `SquareMembership`,
  `VerificationDocument` history into the ledger — sellers start with their real history, not
  zero. (This is the internal version of "reputation import.")

---

## 5. The three views

**Buyer (`/t/{publicId}`)** — the Trust Card destination. Bands + human facts, five-second
read, no composite number, no login, SSR-fast on a cheap Android:

```
Chinedu Phones            MX-PL-04KT
✓ Owner identity verified          ✓ Shop verified — Hamaz Plaza, Jos
Member, Hamaz Phone Dealers Assoc. since 2020

COMMERCE   █████████░  214 protected sales · 1.4% disputes · repeat buyers 38%
IDENTITY   ████████░░  KYC + CAC verified
COMMUNITY  ████████░░  Chairman-attested
FINANCIAL  not provided
SOCIAL     ███████░░░  IG since 2019 (imported)

[ Pay this seller protected ]
```

**Institutional** — consent-gated (`ReputationConsentGrant`), numeric, evidence-counted,
`engineVersion`-stamped. What the framework's "Business Risk Report" describes. Exposed as an
API a partner lender pulls **per seller request** — never a bulk feed, never to tax
authorities (the platform's survival depends on this stance being structural, not policy).

**Internal / Dasah** — the agent reads the current snapshot to answer "can I trust this
seller?" in chat, and to gate platform capabilities (escrow limits, release speed by tier).

### 5.4 Discovery projection — the Trust Card in the feed

Not a fourth view — a **teaser projection of the buyer view**, pulled into discovery surfaces
so reputation itself becomes the reason to tap. Same ledger, same bands, same facts; fewer of
them, and *ranked*. It reads `ReputationProfile.facts` — no per-render computation.

The in-feed card is **facts-first and chrome-light** — the dimension bars stay on
`/t/{publicId}`; the card carries only the five-second read:

```
Chinedu Phones  ✓          MX-PL-04KT   [ GOLD ]
214 protected sales · 1.4% disputes · 38% repeat buyers
Chairman-attested — Hamaz Phone Dealers Assoc.
[ View trust profile → ]                  🔒 Protected
```

- Identity + the shareable **public ID** — the same `MX-STATE-code` printed on the QR card,
  plaque and parcel, so the feed card is visibly *the same seller* across every surface.
- Three **Gold** headline facts (money that actually moved), never a composite number.
- One community/identity line — attestation or verification, the revocable Nigerian advantage.
- Tier as a capped chip; the whole card is the entry point into the full buyer view.

**Ranking contract — this is the point of the surface:**

| Rule | Why |
| --- | --- |
| Gold COMMERCE band + min-evidence to appear at all | Below threshold → *no card*. "Not enough data yet" beats a fake-precise slot (§1.6) |
| Recency-weighted via registry half-lives | Rewards sellers trading cleanly *now*, not coasting on banked volume (§6 "burst then coast") |
| Bronze/social excluded from ranking | The rail literally cannot be bought — 100k followers never outrank 500 clean orders (§1.4) |

The rail is an argument for the framework's core rule made visible: the most prominent thing on
the home feed is the thing you can least fake.

**Surfaces (reuse existing feed patterns — no new feed engine):**

- **Logged-in feed** — interleaved every ~2 chunks, exactly like `FeedProductShelf` in
  `SocialFeed.vue`.
- **Market home (logged-out)** — the trust-bearing upgrade to the flat "Traders selling live"
  avatar row.
- **`/discover` → Sellers** — the grid graduates from banner + follower count to this surface.

Component: `TrustSpotlightRail` + `TrustCard` in the new `layers/reputation` layer (§8 Q6).

---

## 6. Anti-gaming (structural, not aspirational)

| Attack | Defense |
| --- | --- |
| Fake volume (self-buys) | Signals only from fee-paid, settled escrow → faking costs money |
| Wash-trading ring | Counterparty concentration analysis (§2.3); buyer verification level scales signal confidence |
| Bought followers | Bronze cap — structurally cannot dominate any dimension |
| Friendly chairman over-attests | Revocable attestations + group-level discount when a Square's members show anomalous dispute rates |
| Review bombing / farming | Reviews already gated on completed orders (`SellerReview.verified`); one per buyer-seller pair (`@@unique`) |
| Burst then coast | Decay half-lives in registry — reputation must be maintained, not banked |
| Identity resale | KYC expiry (`expiresAt`) + re-verification windows |
| Score-shopping ("recompute until good") | Append-only ledger + snapshot history — there is no deleting bad evidence |
| Buying feed prominence (Trust Spotlight) | Rail eligibility keys on the Gold COMMERCE band only; social/paid signals are excluded — a slot is earned per settled sale, never purchased (§5.4) |

---

## 7. Phasing (aligned with the Trust Card initiative)

| Phase | Ships | New surface |
| --- | --- | --- |
| **0 — with Trust Card pilot** | `ReputationSignal` + `TrustScanEvent` migrations; identity signals (KYC via provider, phone, CAC); `/t/{publicId}` page reads IDENTITY + facts; **manual escrow deals recorded as `MANUAL_ESCROW` signals from day one** — the 20-seller pilot's data is never lost | Trust profile page |
| **1** | Backfill job (orders/reviews/memberships → ledger); COMMERCE dimension live; engine v1 + registry; **Trust Spotlight rail** (facts-only card) reads `ReputationProfile.facts` into the feed | Dimension bars appear · Trust Card rail in feed (§5.4) |
| **2** | `Attestation` flow for Square chairmen; COMMUNITY dimension; plaque rollout (Hamaz) | Attestation UI |
| **3** | Mono link (`ExternalAccountLink`); FINANCIAL dimension; IG import (SOCIAL) | Reputation import |
| **4** | `ReputationConsentGrant` + institutional API; first partner-lender pilot | The credit door opens |

Phase 0 is small: two tables, one SSR route, one KYC provider integration, and signal
emission from the concierge escrow flow. Everything else layers on without rework — that's
what the append-only ledger buys.

---

## 8. Open questions

1. **KYC provider choice** — Smile ID vs Dojah vs QoreID: pricing per verification at pilot
   volume; sandbox quality. (Decision needed in Phase 0.)
2. **Band thresholds** — what score range maps to HIGH/MEDIUM/LOW, and do we show bars or
   bands-only at first? (Lean: bands-only until backtesting justifies precision.)
3. **Negative-signal display** — is dispute rate shown numerically on the public page from
   day one, or only once a seller crosses the min-evidence threshold? (Fairness vs honesty.)
4. **Who may attest** — officers only, or any established member above a reputation floor?
5. **Data residency / NDPA** — confirm Neon region posture for verification-result storage;
   document the "no raw NIN/BVN" rule in SECURITY.md.
6. **Layer placement** — new `layers/reputation` vs inside `layers/seller`. (Lean: new layer;
   it will grow its own API surface and consumers.)
