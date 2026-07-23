# Bulk Listing & Social Distribution — Engineering Plan

**Status:** Proposed · **Owner:** TBD · **Last updated:** 2026-07-17

Two related capabilities:

1. **Bulk listing** — let a seller create many products in one session instead of one-by-one through
   [`products/create.vue`](../layers/seller/app/pages/seller/[storeSlug]/products/create.vue).
2. **Social distribution** — generate MarketX product cards at scale and get them onto the seller's
   Instagram and Facebook pages.

---

## 1. Strategic context (read this first)

### 1.1 Meta Shops is not available in Nigeria

Meta's [supported countries for Shops](https://help.instagram.com/321000045119159) covers North America,
most of Western Europe, and parts of APAC. **No African country is on the list.**

This closes off the entire **Commerce Platform** product family for our sellers:

| Capability | Available to our sellers? |
| --- | --- |
| Catalog sync → Meta catalog | ❌ Blocked (country) |
| Shops / IG Shopping product tags | ❌ Blocked (country) |
| Commerce Manager OBO seller onboarding | ❌ Blocked (country) |
| IG/FB checkout (onsite or offsite) | ❌ Blocked (country) |
| **Content Publishing API** (post to feed) | ✅ Available |
| **IG media read** (import posts) | ✅ Available |
| **FB Page posting** | ✅ Available |

> **Do not build toward the Commerce Platform.** The last two rows are the *Instagram Platform /
> Graph API*, a different product family that is **not** country-gated the same way. Everything in
> this plan targets that family only.

**Confidence:** High, but confirm with a Meta representative before committing budget to anything
Meta-dependent. Country eligibility is the single largest external risk in this plan (see §7).

### 1.2 Why this makes the product card strategically central

Two constraints compound:

- Meta Shops is unavailable here → our sellers have **no native way to make an IG post shoppable**.
  No product tags, no shop tab, no checkout.
- **Instagram feed captions do not render clickable links.** A URL in a caption is inert text. The
  API cannot work around this — link stickers are not settable via the Content Publishing API either.

The MarketX card already bakes a **QR code** and the **`MX-STATE-code` public Seller ID** into the
*image itself* (see [`ProductShareCard.vue`](../layers/commerce/app/components/product-card/ProductShareCard.vue)).
That is the one link format Instagram cannot strip, de-link, or gate by country.

**The card is not a nice-to-have. For a Nigerian IG seller it is the only path from post → transaction.**
Design decisions downstream should protect the QR's scannability above all else.

### 1.3 Media is the whole problem

Text bulk-imports are trivial. The real question is always *"how do N image files associate with M
product rows?"* Our existing pipeline is already shaped correctly for this:

- [`media/upload.post.ts`](../layers/core/server/api/media/upload.post.ts) is a **pure Cloudinary
  proxy with no DB write** — returns `{ url, public_id, type }`.
- [`products/index.post.ts`](../layers/commerce/server/api/commerce/products/index.post.ts) creates
  `Media` rows atomically from a `mediaItems[]` array at product-create time.

Upload and create are already decoupled. **No restructuring is required to enable bulk.**

---

## 2. Architecture: adapters → staging → review grid → commit

Every ingest medium normalises into one staging shape. The review grid is the single funnel.

```
photos-first  │  CSV/ZIP  │  IG import  │  FB import
      └────────────┴────────────┴─────────────┘
                        ↓  adapter (the only part that differs)
        BulkImportRow[]  { media[], title?, price?, …, errors[] }
                        ↓
              review grid  ← AI drafts fill blanks; seller bulk-edits
                        ↓
              commit → Products (DRAFT → PUBLISHED)
```

Adding a medium later = writing one adapter that emits staged rows. Not a second import system.

### 2.1 Staging schema (new)

Neither model exists today. Persist staging so a seller can close the tab mid-import and resume —
with 200 photos on Nigerian mobile data, **they will**.

```prisma
model BulkImportJob {
  id         String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId   String            @db.Uuid
  source     BulkImportSource  // PHOTOS | CSV | ZIP | INSTAGRAM | FACEBOOK
  status     BulkImportStatus  // DRAFTING | REVIEWING | COMMITTING | DONE | FAILED
  created_at DateTime          @default(now()) @db.Timestamptz(6)
  updated_at DateTime          @updatedAt @db.Timestamptz(6)
  rows       BulkImportRow[]
  seller     SellerProfile     @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId, status])
}

model BulkImportRow {
  id         String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  jobId      String        @db.Uuid
  /// Cloudinary results: [{ url, public_id, type }] — uploaded before staging
  media      Json
  /// Draft product fields (AI- or adapter-populated, seller-editable)
  draft      Json
  /// Row-level validation errors — partial success, never all-or-nothing
  errors     Json?
  /// Set once committed, for idempotent re-runs
  productId  Int?
  job        BulkImportJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId])
}
```

### 2.2 Commit path

**Do not build a queue in v1.** [`useMediaUpload`](../layers/core/app/composables/useMediaUpload.ts)
already compresses phone photos ~5 MB → 150–300 KB client-side before upload, so 200 images is
~50 MB total. Committing 200 rows as throttled parallel calls to the existing
`POST /api/commerce/products` gives per-row errors for free and needs **zero new server infra**.

Reach for BullMQ (pattern exists in [`server/queues/`](../server/queues/)) only on evidence of need.

---

## 3. Footguns in the current single-product path

All harmless at N=1. All detonate at N=200. **Fix these before shipping bulk commit.**

| # | Issue | Location | Impact at N=200 | Fix |
| --- | --- | --- | --- | --- |
| 1 | Follower fan-out notifies every follower per `PUBLISHED` product | [`product.service.ts:110-128`](../layers/commerce/server/services/product.service.ts#L110-L128) | 500 followers × 200 products = **100k notifications** | Suppress per-product; one digest per import. Import as `DRAFT`. |
| 2 | Cache bust per product (4 patterns in endpoint + 1 in service) | `index.post.ts:54-60`, `product.service.ts` | ~1,000 Redis calls | One bust after commit completes |
| 3 | `generateUniqueSlug` probes DB in a loop per title | `product.service.ts` | 200+ round trips, race-prone | Batch pre-resolve |
| 4 | `entityEmbedder.embedProduct` fires per product | `product.service.ts` | 200 embed calls inline | Batch/queue |
| 5 | `SKU` is `@@unique` **globally**, not per seller | `schema.prisma:252` | Collisions across sellers | Pre-flight collision check; SKU as natural key for upsert-on-reimport |

**Variants note:** `ProductVariant` is size-only (`size`/`stock`/`price`, `@@unique([productId, size])`).
This *simplifies* the grid — one row per product with an encoded stock column (`S:10, M:5, L:2`) beats
Shopify's multi-row-per-variant format, and the schema cannot express anything richer anyway.

---

## 4. Phased delivery

### Phase 0 — Foundation *(no external dependency)*

1. Staging schema + migration (§2.1). Run over the **direct, non-pooler** `DATABASE_URL` — Neon's
   pooler hangs on migrate advisory locks.
2. Adapter interface + `BulkImportRow` normaliser.
3. **Photos-first adapter** — folder/multi-select, group by filename convention
   (`ankara-dress_1.jpg`, `ankara-dress_2.jpg` → one product, two images).
4. **Review grid** — editable table, media picker column, paste-from-Excel (covers spreadsheet
   sellers with no CSV parser).
5. Throttled commit via existing `POST /api/commerce/products`.
6. **Fix all five footguns in §3.**

**Exit:** seller uploads 200 photos → 200 reviewed drafts → published. Zero Meta dependency.

### Phase 1 — AI drafting

Batch [`generate-listing.post.ts`](../layers/ai/server/api/ai/generate-listing.post.ts) over each
row's cover image. Rate-limit and **cost-cap** — 200 GPT-4o vision calls per import is a real line
item; measure before enabling broadly. Bulk-edit affordances in the grid (fill-down, multi-select).

**Exit:** 200 photos → 200 *drafted* listings. This is the step where Magic Lister stops being a
novelty button and becomes the product.

### Phase 2 — Card generation at scale *(no Meta dependency)*

1. Batch-generate cards client-side in a hidden loop reusing `ProductShareCard` +
   [`useCardCapture`](../layers/seller/app/composables/useCardCapture.ts). ~200 ms/card → under a
   minute for 200, with pixel-perfect parity to what sellers already see. **No server renderer.**
2. Upload each to Cloudinary; store `public_id` on the product. Every card now has a stable public
   URL — exactly what any future Meta posting needs (Meta cURLs the URL).
3. **Serve `f_jpg`.** `html-to-image` emits PNG; IG content publishing is **JPEG-only**.
4. Distribution without any API: ZIP of cards + `captions.txt`, and one-tap
   `navigator.share({ files })` into IG per card.

> **Upgrade path:** if cards are ever needed without a browser (scheduled jobs), move to **Satori**
> (~50 ms/card, real flexbox, Manrope/Sora already available as font files). **Not Puppeteer** —
> won't fit the deploy target.

**Exit:** bulk cards + captions in sellers' hands. Ships without App Review.

### Phase 3 — Meta integration *(gated on App Review — start early, it is the long pole)*

1. Meta App + **Business Verification**. Privacy policy, screencast, use-case justification. Weeks.
2. Per-seller OAuth via Facebook Login for Business.
   - Read: `instagram_business_basic`
   - Publish: `instagram_business_content_publish`
   - FB Page: `pages_manage_posts`, `pages_read_engagement`
   - Note: `ads_management`/`ads_read` may be required if the user holds their Page role via
     Business Manager. Page Publishing Authorization may also apply.
3. Token storage + refresh (long-lived Page tokens; expiry is an ongoing ops burden).
4. **Facebook Pages first** — no equivalent daily cap, and **FB posts render clickable links**. If
   auto-posting proves itself anywhere, it proves itself here.
5. **IG drip scheduler** — 100 posts/rolling 24 h, carousels count as one. Poll the
   `content_publishing_limit` endpoint rather than counting locally. Spread a 200-card import over
   days. BullMQ pattern already exists.

> **Blasting 200 cards onto a seller's feed is spam.** It tanks their engagement and can get the app
> flagged. The 100/day cap is Meta signalling intent. The feature's honest shape is a *scheduler*.

### Phase 4 — IG/FB post import *(lowest priority — see §5)*

`GET /me/media` → carousel `children` map cleanly to a product's images. Caption → GPT-4o structured
parse (`"Ankara dress 👗 sizes 8-16 ₦15,000 DM to order 📩"` → title/price/sizes/description).
Handle `₦15,000` / `15k` / `N15000` / `DM for price` (→ no price). Emits `BulkImportRow` — same grid,
same commit, nothing new downstream.

---

## 5. Why IG import is sequenced last

It reads as the headline feature. It is not.

**Photos-first already captures most of its value.** The seller's images are on their phone either
way — same media, no Meta dependency. What import genuinely adds is their *curation* (which photos
group into one product) and their existing captions — and we regenerate captions with AI anyway,
marketplace-optimised rather than DM-to-order-optimised.

IG import is a **convenience upgrade over photos-first, not a new capability.** It costs App Review
and carries the §7 funnel risk. Sequence accordingly.

---

## 6. Explicitly out of scope

- **Commerce Platform / catalog sync / Shops / IG Shopping tags** — sellers ineligible (§1.1).
- **Meta Business Partner badge** — a marketing-partnership program requiring substantial ad-spend
  history and a months-long review. Unrelated to the technical integration here. Not a prerequisite.
- **Server-side card rendering** — deferred until Phase 2's client-side approach demonstrably fails.
- **Scraping IG** — against ToS, technically blocked, no.

---

## 7. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **Nigeria ineligible for Shops** | High — kills Commerce Platform | Already planned around (§1.1). Confirm with Meta rep. |
| **Seller account funnel drop-off** — Meta requires IG **Professional** + linked FB Page + Business Portfolio. Many sellers run **personal** IG accounts and must convert. | **High — biggest risk to every Meta feature** | **Measure first.** Survey/instrument what % of active sellers already have Professional + Page *before* investing in Phase 3. If low, Phase 2 (ZIP + share-sheet) may be the terminal state — and that is an acceptable outcome. |
| App Review timeline (weeks) | Medium | Start at Phase 0. Parallel to all other work. |
| Meta API churn — Basic Display was killed in 2024; limits move (we already found 50→100) | Medium | Pin API version. Re-verify against live docs at Phase 3 start. Never plan from recollection. |
| AI cost at scale (200 vision calls/import) | Medium | Cost-cap + rate-limit in Phase 1. Measure per-import cost. |
| Account health / spam flagging | Medium | Drip scheduler, never blast. Respect `content_publishing_limit`. |
| JPEG-only + PNG capture mismatch | Low | Cloudinary `f_jpg`. Documented in Phase 2.3. |
| Token expiry | Low–Medium | Refresh job; alert on failure. |

---

## 8. Open questions

1. What % of active sellers have an IG **Professional** account linked to a FB Page today?
   **This gates the entire Phase 3/4 business case and should be answered before Phase 1 finishes.**
2. Is upsert-on-reimport (SKU as natural key) required for v1, or is create-only acceptable?
3. Should imported rows default to `DRAFT` always, or may trusted/verified sellers publish directly?
4. Card QR: does it deep-link to the product, or to the affiliate-attributed share URL?
5. Filename grouping convention — is `name_1.jpg` sufficient, or do we need an in-grid manual
   grouping affordance for sellers whose camera rolls are named `IMG_4471.jpg`?

> Q5 is likely a real problem — most phone camera rolls have no meaningful filenames. The review
> grid may need drag-to-group as a Phase 0 requirement rather than a nice-to-have.

---

## 9. Sources

- [Content Publishing — Instagram Platform](https://developers.facebook.com/docs/instagram-platform/content-publishing/) — 100/24 h limit, JPEG-only, scopes, public-URL requirement
- [Supported countries for Shops](https://help.instagram.com/321000045119159)
- [Commerce Platform — Onboarding](https://developers.facebook.com/docs/commerce-platform/platforms/onboarding/) — MBE / Commerce Manager Redirect / OBO (not applicable, see §1.1)
- [Become a Commerce Partner](https://www.facebook.com/business/marketing-partners/become-a-partner/commerce)
