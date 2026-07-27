# Store Trust Ratings — a guide for buyers and sellers

**Audience:** buyers reading a store's Trust Card, and sellers who want to understand
their rank. **Last updated:** 2026-07-25 · **Engine:** v1.0.0

> **One-line version:** a store's rating is computed from real money that moved on the
> MarketX escrow rail — completed orders, confirmed deliveries, and resolved disputes.
> Nothing here is seeded, bought, or self-reported. If a store hasn't done enough
> protected business yet, we say *"not enough data yet"* rather than guess.

Two things appear on a store's trust profile, and they mean different things:

1. **The Store Tier** — one overall rank: **Tier 1**, **Tier 2**, or **Tier 3**.
2. **The dimension bars** — a **High / Medium / Low** reading for each category
   (Commerce, Identity, …).

Both come from the same evidence; the tier is the headline, the bars are the detail.

---

## 1. Store Tier — the headline rank

Every store that has done enough protected business gets one tier. Higher is better
(**Tier 1** is the top). It's shown as a small chip on the Trust Card and profile.

| Tier | What it means | How it's earned |
| --- | --- | --- |
| **Tier 1** | Proven, high-volume, very clean record | **100+** protected sales **and** dispute rate **under 2%** |
| **Tier 2** | Established, reliable track record | **30+** protected sales **and** dispute rate **under 4%** |
| **Tier 3** | Real track record, still building | Passed the minimum (**3+** protected sales) but not yet Tier 2 |
| *No tier yet* | *"Not enough data yet"* | Fewer than **3** protected sales — the store is too new to rate honestly |

**Why a store can be Tier 3 (or unrated) and still be fine:** a brand-new honest seller
simply hasn't accumulated evidence. A low tier is *"not proven yet,"* not *"bad."* The
rating only ever moves up on the strength of real, settled transactions.

---

## 2. Dimension bars — the detail behind the tier

Each category shows a band. The bar height reflects the band; some categories show
*"not enough data yet"* or *"not provided"* instead of a bar.

| Band | Bar | Meaning |
| --- | --- | --- |
| **High** | ████████░ | Strong, well-evidenced |
| **Medium** | ██████░░░ | Solid, still building |
| **Low** | █████░░░░ | Early / limited evidence |
| **Not enough data yet** | — | Below the minimum evidence threshold; shown instead of a fake-precise score |
| **Not provided** | — | The seller hasn't shared this (e.g. bank data). This is **neutral — never a penalty** |

### Commerce — the spine of the rating

This is the category that matters most: it's built purely from money that moved.

| Band | Requirement |
| --- | --- |
| **High** | **50+** protected sales **and** dispute rate **under 2%** |
| **Medium** | **10+** protected sales **and** dispute rate **under 4%** |
| **Low** | Crossed the **3-sale** minimum but below Medium |
| **Not enough data yet** | Fewer than **3** protected sales |

### Identity — is this a real, registered business?

| Band | Requirement |
| --- | --- |
| **High** | Owner identity **verified** *and* **CAC** (business registration) verified |
| **Medium** | One of the two verified |
| **Low** | Neither verified yet |

> More categories — **Business History, Community (association/chairman attestation),
> Financial, and Social presence** — are part of the framework and roll out in later
> phases. Commerce and Identity are what the live v1 engine computes today.

---

## 3. What the numbers on the card actually mean

Every figure is defined precisely and computed from your real records:

| Term | Definition |
| --- | --- |
| **Protected sales** | Orders that were **paid on the escrow rail and completed** (`PAID` + `COMPLETED`/`DELIVERED`). Cash/off-platform deals don't count. |
| **Delivered** | Of those, the ones **carrier-scan-confirmed** as delivered — not just marked shipped. |
| **Dispute rate** | Disputes **resolved against the seller** (buyer refunded) ÷ protected sales, as a %. A dispute you *win* does not count against you. |
| **Repeat buyers** | Share of sales from customers who came back. |
| **Tenure** | Whole years since the store was created (*"New store"* under a year). |
| **Rating / reviews** | Average of verified product reviews — each gated on a completed order, one per buyer–seller pair. |

---

## 4. Why this rating is hard to fake (and worth trusting)

The rating is designed so that the most prominent signals are the ones you can least
game:

- **Volume can't be faked for free.** Sales only count when they're fee-paid, settled
  escrow transactions — self-buying costs real money and fees.
- **Followers and hype don't move the rating.** Social presence is *capped by design*:
  100k followers can never outrank 500 clean orders.
- **Bad evidence doesn't disappear.** The record is append-only — there's no
  "recompute until it looks good."
- **Reputation must be maintained, not banked.** Recent activity counts for more, so a
  store can't coast forever on an old burst of sales.
- **Attestations are revocable.** A chairman who vouches for a seller carries the
  revocation trail, which keeps vouching honest.

For the full design rationale, see [REPUTATION_FRAMEWORK.md](REPUTATION_FRAMEWORK.md).

---

## 5. Behind the scenes: Gold / Silver / Bronze *signals*

You may see the terms **Gold, Silver, Bronze** in the framework. These are **not** the
same as Store Tiers — they classify the *evidence*, by how hard it is to fake:

- **Gold** — money that actually moved (completed escrow orders, confirmed deliveries,
  resolved disputes, on-platform settlement).
- **Silver** — institutional proof (KYC identity match, CAC registration, verified
  physical location, association membership).
- **Bronze** — social proof (Instagram/Facebook/TikTok age and following).

Bronze is **capped** so it can never dominate a category. This is why a store's rating
tracks its *real trading record*, not its marketing.

---

## 6. For sellers — how to climb

1. **Do protected business.** Every completed escrow order is Gold evidence. Get past
   **3 sales** to be rated at all, **10** for Medium commerce, **30** for Tier 2,
   **50/100** for High/Tier 1.
2. **Keep your dispute rate down.** Under **4%** for Tier 2, under **2%** for Tier 1.
   Ship what you describe, ship it on time, and resolve issues before they become
   buyer-refund disputes.
3. **Verify your identity and register your business (CAC).** Both together push
   Identity to High.
4. **Stay active.** Recent sales are weighted more than old ones.
5. **Get real deliveries confirmed.** Use the carrier flow so deliveries are
   scan-confirmed, not just self-marked.

Your **public Store ID** (`MX-STATE-code`, e.g. `MX-PL-04KT`) is the same across your
Trust Card, QR, plaque and parcels — buyers can look up the exact same store anywhere
they see it.

---

*Thresholds in this document reflect engine v1.0.0
([reputation.registry.ts](../layers/reputation/server/reputation.registry.ts)). They are
versioned — when they change, the engine version bumps and this guide is updated.*
