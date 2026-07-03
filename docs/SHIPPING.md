# MarketX Shipping — Policy & Architecture

**Status:** Design locked, implementation in progress (June 2026)
**Owner:** Indices Technology
**Scope:** The isolated `layers/shipping` layer — carrier-agnostic orchestration,
pricing, zoning, settlement, returns/claims — for both **domestic Nigeria** and
**international** delivery.

This document is the contract. It pins the policy, the domain model, and the
provider interface so any carrier can be integrated without touching the core.
Progress is tracked in the [Progress](#progress) section at the bottom.

---

## 1. Principles

1. **Carrier-agnostic.** There is **no fixed carrier**. Each carrier brings its own
   coverage, pricing model, policy (returns/claims/liability), and settlement
   model. The platform orchestrates across them and presents the optimal option.
2. **Isolated layer.** Shipping lives in `layers/shipping/` with its own services,
   repositories, APIs, composables, and components — extractable later as an
   **independent shipping product** (the same discipline applied to Dasah).
3. **Dependency-light & inversion of control.** The layer depends only on `core`
   (db, auth, config, logger). It **never** imports `commerce`, `seller`, order,
   or product models. Callers pass a normalized shipment request; shipping returns
   quotes/labels/tracking. This boundary is what makes it independently extractable.
4. **International-aware from day one.** Types accommodate cross-border (country,
   currency, customs/HS codes, duties) even though full international booking
   (Shippo) is scaffolded, not completed.
5. **Chain delivery reserved, not built.** Model the **Shipment** as the atomic
   unit; allow *one order → many shipments* now (multi-vendor reality) and reserve
   *one shipment → many legs* for future relay/chain delivery — without
   re-architecting.
6. **Config-driven, not hardcoded.** Rate cards, zone matrices, category weights,
   discount knobs, and carrier config live in **effective-dated DB tables**,
   editable from admin — because carriers revise prices on notice (GIG SLA §7.2:
   14 days' notice on diesel/FX/distance).

---

## 2. Layer placement

Dependency order: `core → shipping → commerce → social → …`

- Shipping is **below commerce**. Commerce/orders/checkout import shipping; never
  the reverse.
- Category weights are keyed by an **opaque `categoryId` string** so shipping does
  not import commerce's Category model.
- The caller resolves origin/destination addresses (e.g. checkout resolves the
  seller ship-from and the buyer address) and passes plain `Address` objects in.

---

## 3. Domain model

Pure value objects — no reference to Order/Product/Seller.

```
Address      { name, street1, street2?, city, state, country (ISO-2), zip?, phone?, email? }
Parcel       { weightKg, lengthCm?, widthCm?, heightCm? }            // dims optional (volumetric later)
ShipmentItem { categoryId, qty, unitWeightKg?, declaredValue }       // used to derive parcel + value
ShipmentRequest {
  origin: Address
  destination: Address
  items: ShipmentItem[]
  parcel?: Parcel            // derived from items if absent
  declaredValueMinor: int    // for liability/claims (minor units, e.g. kobo)
  currency: string           // ISO-4217, default NGN
  options?: { codRequested?: bool, expressOnly?: bool, insured?: bool }
  customs?: CustomsInfo      // international only (reserved)
}
Quote {
  carrierId, carrierName, serviceLevel ('standard'|'express'|...), zoneCode?,
  costMinor, listMinor, buyerPriceMinor, currency,
  etaText, etaMinHours, etaMaxHours,
  codEligible, insuredValueMinor?, capabilities, expiresAt
}
Shipment {
  id, orderRef (opaque), carrierId, serviceLevel, status,
  origin, destination, parcel, declaredValueMinor, currency,
  costMinor, buyerPriceMinor,
  trackingNumber?, labelUrl?,
  settlementMode ('ESCROW_POD'|'CARRIER_COD'),
  legs: ShipmentLeg[]        // exactly 1 today; reserved for chain delivery
}
ShipmentLeg  { index, carrierId, fromHub?, toHub?, trackingNumber?, status }   // reserved
CarrierPolicy {
  returnTariff, claimsWindowHours, liabilityCap ('declared'|amount),
  prohibitedItems[], settlementModels[], maxWeightKg, codSupported, ...
}
CustomsInfo  { contents, hsCodes[], dutiesPaidBy ('sender'|'recipient'), ... }  // reserved
```

---

## 4. Provider contract

Every carrier is a self-contained module under `server/providers/<name>/` that
implements **four responsibilities**:

1. **Capabilities & coverage** — `canHandle(req): boolean`
   Countries/regions served, weight/dimension limits, COD support, label
   generation, tracking webhooks, insurance. The orchestrator filters on this.
2. **Pricing source** — `quote(req): Quote[]`
   *How* it prices is private: GIG uses our static rate-card + zone matrix;
   Sendbox/Shippo call live APIs. Output is normalized to `Quote` (returns
   **cost**; the platform applies retail/discount on top — see §6).
3. **Policy descriptor** — `policy: CarrierPolicy`
   Return tariff, claims window, liability cap, prohibited items, supported
   settlement models. Drives surfaced terms + settlement behavior.
4. **Fulfillment** — `book()`, `track()`, `parseWebhook()`, `cancel()`.

```ts
interface IShippingProvider {
  readonly id: string                 // 'gig' | 'sendbox' | 'shippo' | …
  readonly name: string
  readonly policy: CarrierPolicy
  canHandle(req: ShipmentRequest): boolean
  quote(req: ShipmentRequest): Promise<Quote[]>
  book(req: BookRequest): Promise<ShipmentResult>
  track(trackingNumber: string): Promise<TrackingResult>
  parseWebhook(payload: unknown): TrackingUpdate | null
  cancel?(shipmentId: string): Promise<void>
}
```

**Adding a carrier:** drop a module under `providers/<name>/`, implement the
interface, register it in `providers/registry.ts`. Nothing else changes.

---

## 5. Orchestrator pipeline

`orchestrator.service.ts` runs:

```
filter(canHandle)
  → quote fan-out (parallel, per-provider timeout, graceful degradation)
  → normalize to Quote[]
  → apply platform pricing policy (cost → buyerPrice)
  → rank (pluggable strategy)
  → present options
```

- **Graceful degradation:** a carrier whose live API times out drops out of the
  set (or uses its cached/static fallback). Checkout never blocks on one carrier.
- **Ranking strategies:** `cheapest | fastest | best-value | seller-preference`.
  Default: present buyers a ranked set; sellers may set a default preference.
  "Optimal for buyer + seller" is a weighting function, not hardcoded selection.

---

## 6. Pricing engine

Margin is a **provider-agnostic dial**, not hardcoded and not per-carrier.

- **`costMinor`** — what we pay the carrier. This is the **only** number we trust
  at runtime: GIG's live `/price` returns a single price for our ecommerce account
  (`Discount: 0`, no live Class/Basic split), so we treat it as cost. We do **not**
  derive retail from the Annexure — that static card can change any time.
- **Retail is computed centrally** as `cost × (1 + SHIPPING_MARKUP_PCT)` (+ optional
  `SHIPPING_HANDLING_FEE`). One env dial covers **every** carrier we onboard (GIG
  now, Sendbox/Shippo later) — not a per-carrier variable.
- **Seller-priced BYOS (`self`) is passed through untouched** — the seller sets
  their own delivery/pickup price; the platform adds no markup to it.
- **`customerDiscountPct`** — admin relief that hands part of the spread back:

```
list           = cost × (1 + SHIPPING_MARKUP_PCT) + handlingFee   (carriers only)
buyerPrice     = list − customerDiscountPct × (list − cost)
platformMargin = buyerPrice − cost
```

- `discount = 0%` → buyer pays the marked-up list, platform keeps the full margin (default).
- `discount = 100%` → buyer pays cost — cheapest in market, zero margin.
- Rates are **VAT-inclusive** (GIG Annexure 2) — never re-add VAT.

The cost→retail transform lives **once** in `pricing.service.ts` (`computePrice` +
`shippingMarkupPct`/`shippingHandlingFeeMinor`); the orchestrator applies it to
every carrier quote and skips `self`. Env: `SHIPPING_MARKUP_PCT` (default 0.25),
`SHIPPING_HANDLING_FEE` (default 0). Later movable to per-carrier/zone config.

> ⚠️ **Known gap — legacy carrier path is NOT marked up yet.** `rates.post.ts`
> has a second branch (§2, "Live carrier rates") that calls the old Sendbox/Shippo
> providers via `getShippingProvider().getRates()` **directly**, bypassing the
> orchestrator — so those rates do **not** get `SHIPPING_MARKUP_PCT`. This is
> deferred on purpose: those providers are slated to be lifted into the
> `layers/shipping` orchestrator (see §13 ⬜ "Lift Sendbox + Shippo"), at which
> point they inherit the central markup automatically. Until then, only
> **orchestrated** carriers (GIG + `self`) flow through `computePrice`. If Sendbox/
> Shippo are re-enabled before that migration, route their branch through
> `computePrice` (markup, skip `self`) or they'll be sold at raw carrier cost.

---

## 7. Local zoning (Nigeria)

GIG zones are **proximity-relative to the pickup/processing station**, not fixed
state lists. We approximate with a DB-backed **state × state → zone** matrix over
Nigeria's 6 geopolitical zones + intra-state:

| Relationship | Zone | GIG ETA |
|---|---|---|
| Same city / state | **Zone 1** | 24h |
| Adjacent state / same geopolitical zone | **Zone 2** | 48h |
| Cross-region to a major hub | **Zone 3** | 3–4 working days |
| Remote / long-distance | **Zone 4** | 3–5 working days |

- **GoFaster Express** (48h–5d, premium) offered only when **both** origin and
  destination touch the 8 covered cities: Lagos, Abuja, Port Harcourt, Kano, Jos,
  Benin, Ilorin, Sokoto.
- Working day = 08:00–17:00 Mon–Fri, excl. Nigerian public holidays (GIG §1.15).
- The matrix is data, effective-dated; refine against GIG's API/station list later.

---

## 8. Weight (hybrid)

The GIG rate card is **100% weight-driven**, but products currently have **no
shipping weight** (the only `weight` in schema is a fashion body-measurement field).

- **Category default weights** table applies automatically (e.g. dress 0.5kg,
  shoes 1.2kg) — sellers do nothing.
- **Per-product/variant override** when a seller sets it.
- Quote weight = Σ(item weights) + packaging buffer.
- Existing products use the category default until edited — no blocking backfill.

---

## 9. Settlement models

Two clearly-separated models, surfaced explicitly to the seller:

1. **MarketX Escrow POD (default).** Buyer's payment (incl. shipping) is held by
   MarketX and released to the seller's wallet on **confirmed receipt**.
   Platform-controlled, fast, buyer-protected. (Existing `confirm-receipt` /
   `refuse-delivery` wallet-hold flow.)
2. **Carrier Cash Collection (opt-in by seller).** The seller elects the carrier to
   physically collect cash on delivery. Settlement then follows the **carrier's**
   cycle — GIG remits **weekly** (SLA §4.6) — and the seller's payout is timed to
   that remittance, **disclosed up front**: *"Funds settle on the carrier's weekly
   cycle, not on delivery."* We reconcile the carrier's weekly remittance to orders.

**Treasury:** we keep the **GIG e-wallet** funded; each booking debits the Class
cost (SLA §5.1), reconciled per order.

---

## 10. Returns & claims

- **Return tariff** (GIG §1.10/§9) on failed/refused/wrong-address deliveries,
  allocated **by fault**: buyer refusal w/o cause or bad address → buyer (deducted
  from refund); wrong item → seller. Wired into `refuse-delivery`.
- **Claims/liability:** carrier liability = **declared value** (GIG §10.2). Declare
  order value at booking. **24h claims window** with photos (§10.3) surfaced at
  delivery confirmation.
- **Prohibited/dangerous goods** (§5.5): policy clause; seller-liable.
- **Address accuracy** (§5.6): wrong address → cost of retrieval/redelivery borne
  by the at-fault party.

---

## 11. International (Shippo) — scaffolded, deferred

- Shippo stays behind the same `IShippingProvider` interface as the **international**
  carrier. Orchestrator routes by coverage: domestic NG → GIG/Sendbox; cross-border
  → Shippo.
- Domain types reserve **customs** fields (HS codes, declared value, duties payer)
  and multi-currency now, so cross-border doesn't force a rewrite.
- Shippo `canHandle` (international) + interface conformance are implemented;
  `book()` is stubbed pending full international rollout.

---

## 12. Chain delivery — reserved model

- **Not implemented now** (multi-leg routing brings handoff tracking, cost-split,
  liability-handoff complexity not yet earning its keep).
- **Reserved in the model:** `Shipment` is atomic; today every shipment has exactly
  one implicit leg. Chain delivery later = populate `ShipmentLeg[]` (carrier A
  first-mile → hub → carrier B last-mile).
- **Distinct from multi-vendor split:** *one order → many shipments* (one per seller
  origin) is needed **now** regardless of chain delivery.

---

## 13. GIG SLA reference (executed 10 June 2026, 2-year term)

- **Zones & ETAs** — Annexure 1 (see §7). **GoFaster Express** for 8 cities.
- **Rate plans** — Annexure 2, weight × zone, **VAT-inclusive**, 0.5–200kg:
  - **CLASS** ≈ 17–21% cheaper than **BASIC** at every tier → Class = our cost,
    Basic = retail anchor (the §6 spread).
- **Settlement** — pre-funded GIG e-wallet, per-delivery debit (§5.1); COD collected
  by GIG, remitted **weekly** (§4.6).
- **Returns** — Return Tariff on failed/refused/redirected (§1.10, §9).
- **Liability** — declared value; claims within **24h** with photos (§10.2–§10.3).
- **Price review** — 14 days' notice; indices = distance, naira devaluation, diesel
  (§7.2) → rate cards must be config, not code.
- **API** — GIG provides a freight/delivery API (§11) for booking/tracking.
- **Address accuracy / dangerous goods** — Company/seller liability (§5.5–§5.6).

---

## 14. Data model (owned by the shipping layer)

All effective-dated and admin-editable.

- **`Shipment`** — atomic shipment (+ reserved `ShipmentLeg`).
- **`CarrierConfig`** — per-carrier enable flag, credentials ref, default markup,
  `customerDiscountPct` (global/per-zone overrides), ranking weights.
- **`CarrierRate`** — weight × zone → `{ costMinor, listMinor }` per carrier/service
  (GIG Class + Basic seeded from Annexure 2), `effectiveFrom`/`effectiveTo`.
- **`ShippingZone`** — state × state → zoneCode + express-eligibility (NG matrix).
- **`CategoryWeight`** — categoryId → default weightKg.
- (Migrate/retain `GlobalShippingZone` as the international flat fallback.)

---

## 15. API surface — single namespace `/api/shipping/*`

All shipping endpoints live under `/api/shipping/*` (consolidated June 2026 — see §16):
- `POST /api/shipping/quote` — orchestrated multi-carrier quotes (self + GIG). ✅
- `POST /api/shipping/rates` — checkout options: merges BYOS + GIG + legacy carriers. ✅
- `POST /api/shipping/calculate` — `GlobalShippingZone` flat fallback (intl). ✅
- `GET  /api/shipping/zones` — public zones. ✅
- `POST /api/shipping/create` — book a shipment (legacy carriers). ✅
- `GET  /api/shipping/track/[trackingNumber]` — tracking. ✅
- `POST /api/shipping/seed` — seed global zones (admin). ✅
- `POST /api/shipping/book` — (planned) book via the new orchestrator/providers.

**Exception — webhooks stay in commerce:** `POST /api/commerce/shipping/webhook/{sendbox,shippo}`
remain under `layers/commerce` because they **credit the seller wallet / settle escrow** on
delivery (a commerce concern) and depend on `walletService`. Keeping them out of the shipping
layer preserves its upward-dependency-free, independently-extractable property.

---

## 16. Layer structure (actual)

All shipping logic + routes consolidated under `layers/shipping` (the old root-level
`server/utils/shipping/*` and `layers/commerce/.../shipping/*` routes were moved here).

```
layers/shipping/
  nuxt.config.ts
  server/
    api/shipping/   quote.post · rates.post · calculate.post · zones.get ·
                    create.post · seed.post · track/[trackingNumber].get · __tests__/
    services/       orchestrator.service · pricing.service · zone.service
    providers/      registry · self/ · gig/{index,client,stations,rates,policy}
    legacy/         router · sendbox · shippo · types
                    (Sendbox/Shippo on the older IShippingProvider interface —
                     not yet lifted to the orchestrator; explicitly imported, not auto-imported)
    utils/          types.ts   (canonical domain model + new IShippingProvider)
```

Still planned (not yet built): `app/` client (composables + `ShippingOptions.vue`),
`repositories/` + DB models, `settlement.service`, and lifting `legacy/` into `providers/`.

---

## 17. Migration plan (lift from `commerce`)

1. Move `server/utils/shipping/*` (types, sendbox, shippo, index/router) into
   `layers/shipping/server/providers` + `utils/types.ts`, generalizing the
   provider interface (string `id`, add `canHandle`/`policy`/`quote`).
2. Move `commerce/server/api/commerce/shipping/*` routes to
   `layers/shipping/server/api/shipping/*`; keep old paths as thin re-export proxies.
3. Introduce the new DB tables; seed GIG Class+Basic rate cards + NG zone matrix +
   category weights.
4. Point checkout/order flows at the orchestrated `POST /api/shipping/quote`.
5. Retire the country-only quoting path once the domestic engine is live (keep
   `GlobalShippingZone` as international flat fallback).

---

## Progress

Legend: ✅ done · 🟡 in progress · ⬜ not started

- ✅ **Foundation** — layer scaffold (`layers/shipping`), domain types + `IShippingProvider`, registry; registered in root nuxt.config (between `profile` and `commerce`)
- ✅ Orchestrator service — filter → parallel fan-out (per-provider timeout, graceful) → pricing dial → rank (`cheapest|fastest|best-value`)
- ✅ Pricing service — cost/list/discount dial (`buyer = list − discountPct×(list−cost)`); verified dial @100% collapses to cost
- ✅ Zone service + NG matrix — 6 geopolitical zones + intra-state → Z1–Z4, express-city gate (in-code reference; DB `ShippingZone` table overrides later)
- ✅ GIG provider — zone-driven Class(cost)/Basic(list) rate-card quoting (verified vs Annexure 2: 1kg Z1 = ₦5,101.40/₦6,184.70); conditional GoFaster express.
- ✅ **GIG live API (sandbox verified)** — client (`gig/client.ts`): `POST /login` (JWT cached in `access-token` header), `GET /localstations/get` (cached, 46 stations), `POST /price`, `POST /capture/preshipment`, `GET /track/mobileShipment`. Provider `quote/book/track` call the live API with **automatic fallback to the rate card**. **Verified (July 2026, weight-correct):** Enugu→Lagos 0.5kg → live GrandTotal ₦7,997, scaling with weight (1kg ₦8,998 · 2kg ₦11,398 · 5kg ₦16,646); Basic anchor = cost/0.8; shows in checkout alongside BYOS.
  - **CustomerCode/CustomerType auto-derive from the login response** (`UserChannelCode`/`CustomerType`); env is optional and placeholder values (`<...>`) are ignored. Sandbox account `ECO038082` returns `Discount: 0` — GIG gives a single price, no live Class/Basic split.
  - **Weight-based pricing (fixed July 2026):** quote items with `ShipmentType: 1` + `ItemName` + `IsVolumetric: false` → priced by the actual `Weight`. **Do NOT use `ShipmentType: 0` / `SpecialPackageId`** — those select *predefined special packages* whose fixed weight overrides yours (id 1 = 12.5kg), which had silently billed **every** parcel as 12.5kg (0.5kg was quoting ₦12,318 instead of ₦7,997). `/capture` mirrors the same item shape so the booked weight matches the quote.
  - **Station notes:** StateName alias **Abuja→FCT**, first-public-station per state (Anambra/Delta/Edo/etc. have several), Kebbi/Yobe have no station → rate-card fallback.
  - Env: `GIG_BASE_URL` (default sandbox), `GIG_EMAIL`, `GIG_PASSWORD` (only these two required).
  - **Still to tune:** scan-status code map for `/track` (needs a real tracked shipment); only-on-401-auth re-login guard added.
- ✅ **Consolidation (June 2026)** — all shipping moved under `layers/shipping`: root `server/utils/shipping/*` → `legacy/`; `commerce/.../shipping/*` routes → `api/shipping/*` (single `/api/shipping/*` namespace). Webhooks kept in commerce (wallet-coupled). Removed the duplicate-`IShippingProvider` auto-import collision. Imports/URLs/tests updated; **20/20 shipping tests pass**.
- ✅ API routes — `quote · rates · calculate · zones · create · seed · track` all live at `/api/shipping/*`; `book` (new orchestrator path) ⬜
- ✅ **Self-shipping / BYOS provider** — seller-defined flat / free-over / pickup / per-zone, stored in `SellerProfile.shippingConfig` (JSON); decoupled (config travels in the request); escrow-POD only, no carrier wallet/return-tariff; orchestrator `only` filter added (holds GIG back until its API is live)
- ✅ **Checkout integration** — `/api/shipping/rates` merges BYOS + GIG (live) + legacy carriers; client passes `subtotalMinor` for free-over; rendered as selectable options in `CheckoutShipping.vue` (which now supports an `embedded` prop so it can render without its own card chrome inside a seller package). GIG gated on `isGigConfigured()` + a resolvable origin. Verified live: Pickup (free) · Seller delivery (₦1,500) · GIG (₦12,299).
- ✅ **Signed quote token (July 2026)** — `/api/shipping/rates` signs each rate's `(storeSlug, amountMinor)` into a `token` ([`quoteToken.ts`](../layers/shipping/server/utils/quoteToken.ts), HMAC via `SHIPPING_QUOTE_SECRET`/`JWT_SECRET`, 45-min TTL). Checkout echoes the chosen token in `shippingBreakdown`; `orderService.placeOrder` **re-derives the shipping charge from the verified token**, so a tampered client amount (e.g. ₦0) can't stick — while a legitimately free rate still verifies. Falls back to the client amount (logged) when no token is present; flip to strict reject once the token-sending checkout is fully deployed. See PAYMENTS.md #3.
- ✅ **Multi-seller checkout (Phase 1)** — checkout groups the cart by seller and quotes **each seller independently**, pre-selecting the cheapest, summing the total, and emitting a per-seller `shippingBreakdown`. Sellers with config show their options; others fall back to the flat zone. Fixes the "providers not showing" case (every seller is quoted, not just one primary). Verified: per-seller `/api/shipping/rates` returns each store's options.
- ✅ **Checkout UI restructure (June 2026)** — each seller now renders as a single `CheckoutSellerPackage.vue` card combining **its products + its delivery options + an Items/Shipping cost line**, so the buyer sees that store's total in one place instead of scrolling between a global order summary and separate "Ships from {store}" shipping cards. The delivery address moved to the top of the page (rates depend on it). Pure presentation change — `sellerGroups`, `shipBySeller`, `groupShippingMajor`, `shippingBreakdown`, and `isFormValid` are unchanged, so totals and the order payload are identical. (`CheckoutOrderSummary.vue` is now unused.)
- ✅ **Multi-seller orders (Phase 2)** — `placeOrder` now splits the cart into **one order per seller** under a shared `purchaseGroupId`, each carrying its own items + shipping (from the breakdown) + `affiliateCut`. Schema: `purchaseGroupId` + `shippingBreakdown` on `Orders`; `paymentRef` is shared across the group (no longer unique). **Payment** (Paystack `initialize`/`verify`, `pod-initialize`/`pod-verify`, PayPal `create`/`capture`, and the Paystack `webhook`) charges the group's summed total in one transaction and runs the existing per-order side-effects in a loop. **Escrow + affiliate need no rewrite** — `creditSellersOnPayment`/`releaseFundsOnDelivery`/`reverseOrderCredit`/`affiliateCut` are keyed per order, so with one seller per order they become per-seller automatically (confirming receipt on one seller's order releases only that seller's escrow). Verified: a 2-seller cart → 2 orders, shared group, per-seller shipping (₦1,500 + ₦3,200); all payment routes compile + behave (4xx on bogus refs, not 500).
- ⬜ **Polish** — buyer "My Orders" visual grouping (one purchase shown as N shipments); full pay→ship→confirm→release run pending a working Paystack test key.
- ✅ **Seller settings UI for BYOS** — "Self / Own Delivery" section in seller store settings: toggle, flat fee, free-over threshold, pickup + note, ETA. Persists to `SellerProfile.shippingConfig` via `PATCH /api/seller/:id` (schema + repo + ₦→kobo conversion). Verified: save → checkout shows the configured options. (Ship-from origin section already existed — required for GIG to quote.)
- ⬜ Category weights (hybrid default + override)
- ⬜ Lift Sendbox + Shippo providers into the layer (conform to new interface)
- ⬜ DB models (`Shipment`, `CarrierRate`, `ShippingZone`, `CategoryWeight`, `CarrierConfig`) + seed Annexure-2 exact rows
- ⬜ Settlement service (Escrow POD vs Carrier COD; GIG wallet reconciliation)
- ⬜ Returns & claims wiring (return-tariff allocation, 24h claims window)
- ⬜ Client layer (`app/` composables, `ShippingOptions.vue`, tracking timeline) — checkout currently uses commerce's `useShipping`
- ⬜ Tests (zone matrix, pricing dial, orchestrator ranking, provider quoting)
- ⬜ Shippo international scaffold (canHandle + customs types; book stubbed)
