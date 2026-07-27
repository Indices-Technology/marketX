# Growth Engine — Engineering Plan

**Status:** Building (Phase 1, free wedge) · **Owner:** joshbj360 · **Last updated:** 2026-07-26

> **The Growth Engine converts static business information into measurable Growth Assets that
> continuously acquire customers and route them into the MarketX commerce engine.**
>
> Input = product / service / offer. Output = **measurable customer acquisition.**
> Not "publish", not "social", not "marketing" — those are implementations.

This supersedes the framing in [`BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md`](./BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md);
that document's §3 footguns, §2.1 staging schema, and Meta constraints still apply and are referenced below.

---

## 1. The problem

A seller's Instagram/WhatsApp post gets likes and comments, then **dies**. No sale, no record, no
follow-up. Meta Shops is unavailable in Nigeria and IG captions strip links, so a Nigerian seller
has no native way to make a post shoppable. The value leaks every day.

The Growth Engine transforms:

```
dead post ──▶ Growth Asset ──▶ Lead ──▶ Commerce ──▶ Trust ──▶ repeat customer
```

The seller keeps using social exactly as they do. We make every post able to **sell** and to be
**measured**.

---

## 2. The atomic unit — the Growth Asset

A **Growth Asset** is a reusable, channel-agnostic template. Created once (AI-drafted, human-approved),
reused for months, publishable to many channels. It has four dimensions:

| Dimension | Contents |
| --- | --- |
| **Intent** | SELL (v1) / PROMOTE / ANNOUNCE — forward hook; v1 only branches on SELL |
| **Content** | card image (JPEG, w/ QR + Trust identity) + per-channel captions |
| **Commerce** | productRef, sellerPublicId (`MX-STATE-code`), canonical URL, QR |
| **Measurement** | **not stored on the asset — see §3** |

Reuses what already exists — almost no new generation code:

- Card + QR + Trust identity → [`ProductShareCard.vue`](../layers/commerce/app/components/product-card/ProductShareCard.vue)
  + [`useCardCapture`](../layers/seller/app/composables/useCardCapture.ts) (client capture, no server renderer).
- Per-channel captions → [`generate-listing.post.ts`](../layers/ai/server/api/ai/generate-listing.post.ts)
  already emits IG/FB/Pinterest copy.
- Image hosting → [`media/upload.post.ts`](../layers/core/server/api/media/upload.post.ts) (Cloudinary proxy).
- Serve the card as `f_jpg` — capture emits PNG; IG content publishing is JPEG-only.

---

## 3. Attribution lives on the *distribution*, not the asset

The critical data-model rule. One asset is shared to many channels, so a single `channel` field or
`scans` counter on the asset cannot attribute anything. Three tables:

```
GrowthAsset            reusable template (channel-agnostic)
   └─▶ AssetDistribution   one row per (asset × channel) share
          │                mints a PER-DISTRIBUTION short code — the unit of attribution
          └─▶ AttributionEvent   VIEW | SCAN | CLICK | LEAD | ORDER  (keyed to the short code)
```

- The **short link is minted per distribution**, not baked into the asset. That is what lets "one
  asset, ten channels" produce ten separate funnels.
- The **QR carries the asset's canonical link only** — a static image reused everywhere cannot
  self-attribute channel (physics). QR = coarse "scanned a card" bucket (screenshot / repost / print /
  offline). Precise per-channel attribution rides the per-distribution short link for digital shares.
- The seller's dashboard is `COUNT`/`SUM` rollups over these three tables:

  ```
  Assets created → Shared → Viewed → Scanned → Leads → Orders → Revenue
  ```

  A business funnel, not vanity metrics.

Answers the old open question: the QR points to the **attributed short URL**, not the bare product page.

---

## 4. Channel seam — abstract at the verb, not the platform

Shipping providers share a lifecycle (quote→book→track); social channels do **not** (IG imports, FB
doesn't; TikTok is video; WhatsApp is messaging). So the contract is action-oriented, with a keyed
union preserving type safety:

```ts
type ChannelActionKind = 'distribute' | 'import'   // more verbs later

interface IChannelProvider {
  readonly id: ChannelId
  readonly capabilities: ChannelCapabilities
  supports(kind: ChannelActionKind): boolean
  execute<K extends ChannelActionKind>(
    action: Extract<ChannelAction, { kind: K }>,
  ): Promise<ActionResultMap[K]>
}
```

**Division of labour:** the *orchestrator* owns attribution (mints the `AssetDistribution` + short
code, resolves the per-channel caption); the *channel* owns platform mechanics (organic → hand a
share payload to the client; `meta-fb` later → POST to Graph API). The channel never sees the DB.

Not every action is one-shot: `distribute` is fire-once, campaigns are state machines, conversations
are streams. So: **thin dispatcher + per-lifecycle orchestrators.** v1 ships the `distribute`
orchestrator only. Keep from shipping: registry as the single add-point, parallel fan-out with
graceful per-channel degradation, capability discovery. Do **not** build strategy/campaign/optimization
domains until transaction data exists to justify their shape.

Registered channels grow one folder at a time: `organic-share` (now) → `meta-fb` → `meta-ig` →
`whatsapp` → `email`.

---

## 5. Extractability — growth is a future independent app

Follows the **shipping-layer discipline** ([`layers/shipping/nuxt.config.ts`](../layers/shipping/nuxt.config.ts)):
depends only on `core`; **never imports `commerce` / `seller` / `product` / `order` models.** It takes
what it needs as plain value objects / opaque refs at the boundary (as `ShipmentRequest` carries a
`SellerShippingConfig` rather than importing `Seller`).

- Growth tables reference seller/product by **scalar id** (`sellerId String`, `productId Int?`) — **no
  Prisma relations across the boundary.** Relations exist only *within* the growth unit
  (asset→distribution→event).
- Same Postgres today; the scalar boundary is the clean cut line. Extractability is about the **import
  graph**, not the database.

API versioning is **deferred** — the whole app will be versioned at once via a repo fork when ready.
Build growth at `/api/growth/*`, consistent with the rest.

---

## 6. Build order (the gate line matters)

Two of these ship free to every seller today; two need Meta App Review and work only for tester
accounts until it clears. See [`project_meta_social_constraints`] / [`BULK_LISTING_AND_SOCIAL_DISTRIBUTION.md`] §1.1.

| # | Capability | Gated? |
| --- | --- | --- |
| 1 | Gallery import → product → **Growth Asset** → **Organic Share** (share-sheet / download / copy caption) | **Free now** |
| 2 | Make it **bulk** — throttle + import-as-DRAFT + fix the 5 footguns (BULK doc §3) | **Free now** |
| 3 | **Social import** — IG/FB posts → same review grid → products | Meta App Review |
| 4 | **Auto-publish + ads/campaigns** — channel providers behind the verb seam; drip scheduler, never blast (100/24h IG cap) | Meta App Review |

**Phase 1 (this build):** the free wedge — items 1's spine. Gallery/product → Growth Asset →
Organic Share, with the three-table attribution model. No Meta, no OAuth, ships to all sellers.

**Meta status:** FB Business Verification submitted **2026-07-26** (long pole, runs in parallel).
Verification ≠ App Review (a separate per-permission approval + screencast). Build gated paths (3, 4)
against **tester accounts** now; pin the Graph API version.

---

## 7. The smallest complete loop (Phase 1 exit)

```
Product → Generate Growth Asset → Organic Share → Attribution → Lead → MarketX Transaction → Trust
```

One-click "Generate Growth Asset": card + captions + trackable short link + QR, shareable anywhere.
No OAuth, no ad APIs, no Meta approval — yet the flywheel is already turning and every share emits
first-party data. That is the concept proven before the larger automation layers are built.
