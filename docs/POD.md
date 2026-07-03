# Pay-on-Delivery (POD) — design

POD is MarketX's trust-critical, Nigeria-first payment path: the buyer prepays a
**freight deposit** (skin in the game), the **product cash is collected on
delivery**, and the platform controls the money rail so it can guarantee buyers
and settle sellers. This doc defines the model **before** the code/migration.

Sits alongside the two provider layers we already have — shipping (`layers/shipping`)
and payments (`layers/payments`). POD is its own layer (`layers/pod`) because it
owns concerns neither of those does: money-in-transit, remittance, reconciliation,
and proof-gated settlement.

## 1. Providers (like shipping/payments)

| Provider | Model | Cash control | Attestation | Status |
|---|---|---|---|---|
| **GIG** | Courier-COD | courier → platform → seller | trusted (courier reports outcome + remits) | live target |
| **BYOP** | Bring-Your-Own-Provider / seller self-delivers | seller holds cash | weak (self-reported) | **registered but gated (`enabled: false`)** |

`IPodProvider` mirrors `IShippingProvider`/`IPaymentProvider`. New POD couriers = one
file + `enabled: true`. BYOP stays gated until we're satisfied with its proof flow.

**Decision (lean):** BYOP is an **unprotected "Local delivery" tier**, not a
platform-guaranteed POD — we never advertise a guarantee we can't back when the
seller holds the cash. GIG-style courier-COD is the only "Protected POD".

## 2. State machine

```
INITIATED
 → DEPOSIT_PENDING     (freight deposit initialized via payments layer)
 → DEPOSIT_PAID        (payments confirmPayment ok — freight secured)
 → COD_BOOKED          (courier COD registered for the product amount)
 → SHIPPED → OUT_FOR_DELIVERY
 ├─ DELIVERED_COLLECTED → REMITTED → RECONCILED → SETTLED      (happy path)
 └─ ATTEMPT_FAILED ──(proof + hold delay)──► FREIGHT_REFUNDED → RETURNED
 → CANCELLED
```

Terminal: `SETTLED`, `RETURNED`, `CANCELLED`. Transitions are explicit
(`POD_TRANSITIONS`) so no handler can jump states.

## 3. Money model (minor units / kobo)

- **Freight deposit `D`** — server-computed shipping (re-quoted via the shipping
  layer, **never client-trusted** → closes bug #3). **Mandatory** for every POD
  provider. Paid upfront through the payments layer's `confirmPayment` gate.
- **Platform freight tax `t`** — platform keeps `t·D`; the remainder `N = D − t·D`
  is the net cost-of-freight.
- **Happy path** (`DELIVERED_COLLECTED`): courier collected product cash `P`, remits
  `P` (minus courier COD fee) to the platform → `REMITTED`. Platform reconciles →
  settles seller `P − platformProductFee` → `SETTLED`. The freight `D` paid the
  courier's delivery; buyer's deposit is consumed.
- **Denied delivery** (`ATTEMPT_FAILED`): the delivery was attempted and refused, so
  the freight was still incurred. The buyer's deposit is forfeit and — **net of the
  platform tax** — returned to the **seller** as cost-of-freight, but only when:
  1. **Proof of attempt.** GIG **attests** the failed attempt (trusted). BYOP needs
     a harder signal — **buyer confirms the refusal, or an evidence upload +
     buyer non-dispute timeout auto-approves** (lean).
  2. **Deliberate hold delay** before release — slow and unattractive to game
     (anti-freight-farming). Effectively escrow on the deposit with a dispute window.

**Fee timing (fixes bug #2):** platform-fee / wallet debits move to the **`SETTLED`**
transition — never at init. `pod-initialize` today debits the seller before the
buyer has paid; that moves out.

## 4. Schema (proposed migration — NOT yet applied)

A dedicated `PodDelivery` row per POD order (keeps `Orders` clean):

```prisma
model PodDelivery {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId              Int      @unique
  order                Orders   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  provider             String   // 'gig' | 'byop'
  state                String   @default("INITIATED")
  freightDepositMinor  Int
  freightTaxMinor      Int      @default(0)
  codAmountMinor       Int      // product cash to collect on delivery
  trackingRef          String?
  // outcome / proof
  attemptOutcome       String?  // DELIVERED_COLLECTED | ATTEMPT_FAILED | RETURNED
  attemptProof         Json?
  attemptedAt          DateTime?
  disputeWindowEndsAt  DateTime? // BYOP buyer-confirm-or-timeout window
  // money-in-transit
  remittedAmountMinor  Int?
  remittedAt           DateTime?
  reconciledAt         DateTime?
  settledAt            DateTime?
  freightRefundedAt    DateTime?
  createdAt            DateTime @default(now()) @db.Timestamptz(6)
  updatedAt            DateTime @updatedAt @db.Timestamptz(6)
  @@index([state])
  @@index([provider, state])
}
```

Migration = one additive table + the `Orders.podDelivery` back-relation. Non-breaking.
(`PodRemittance` batch model can come later when we wire GIG's remittance feed.)

## 5. How the remaining payment bugs fold in

- **#2** POD fee at init → moved to `SETTLED`.
- **#3** shipping client-trusted → freight deposit re-quoted server-side.
- **#5** stock lifecycle → POD terminal states (`RETURNED`/`CANCELLED`) restore stock;
  handled with the shared Phase 3 stock work.

## 6. Layer shape

```
layers/pod/server/
  utils/types.ts          IPodProvider, PodState, transitions, money types
  providers/gig.pod.ts    courier-COD (live target) — books COD, parses outcome + remittance
  providers/byop.pod.ts   self-collect (GATED, enabled:false)
  providers/registry.ts   resolve/eligibility
  services/pod.service.ts orchestrator: select provider, state transitions,
                          freight/settlement math + debitSellerPodFees
```

## 7. Build status (July 2026)

**Done & live:**
- `PodDelivery` table migrated (`20260702000000_pod_delivery`); client regenerated; verified queryable.
- `layers/pod` scaffold: `IPodProvider`, `POD_TRANSITIONS` state machine, GIG provider
  (delegates the COD booking to the shipping GIG provider via `settlementMode: CARRIER_COD`),
  BYOP **gated** (`enabled: false`), registry, `pod.service`.
- **Lifecycle wired:** `pod-initialize` selects the provider + creates `PodDelivery`
  (`DEPOSIT_PENDING`, freight split) and no longer debits the seller; `pod-verify` +
  `webhook` advance to `DEPOSIT_PAID` and run `debitSellerPodFees` (idempotent) — **bug #2 fixed.**
- Freight deposit is server-derived via the signed shipping-quote token (see PAYMENTS.md #3).

**Pending / BLOCKED:**
- Courier-collect **settlement + remittance** (`DELIVERED_COLLECTED → REMITTED → SETTLED`)
  and the **denied-delivery proof-gated freight refund** — `gig.pod.ts` `parseOutcome`/
  `parseRemittance` are stubs. **Blocked** on capturing a real GIG COD outcome/remittance
  webhook payload (same "capture a real response" approach used for GIG pricing).
- BYOP proof/dispute flow (needed before un-gating BYOP).

Current model is transitional **seller-collect** (seller keeps the product cash, platform
fee pre-debited from wallet after the deposit is confirmed). Target is **courier-collect**
(platform deducts its fee from remitted cash at `SETTLED`) — see §3.
