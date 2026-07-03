# MarketX — Product Detail Page Review & Implementation

> Governed by [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) (*Place → Traders → Goods*).
> Companion to [DESIGN_REVIEW.md](./DESIGN_REVIEW.md) (home) and
> [DISCOVER_REVIEW.md](./DISCOVER_REVIEW.md). Evolutionary — same architecture, cards, and
> fetch; reuses the Discover work (market chip, `squareSlug`/`storeSlug` filters,
> `ProductCardMini`).
>
> Grounded in [product/\[slug\].vue](../layers/commerce/app/pages/product/[slug].vue).

## Executive summary

The PDP was well-built (gallery with thumbnails/LQIP/eager loading, a rich seller trust
block, POD/delivery card, reviews) but had **two identity/discovery gaps**: it never
showed **which market** the good belonged to, and it had **no related-discovery sections**.
Both are now fixed by reusing what we built for Discover.

## What shipped

1. **Market chip** — `square{name,slug}` added to the product-detail fetch (`productInclude`);
   a **"📍 {Market}"** chip above the title links to `/squares/{slug}`. Guarded — independent
   traders (not in a square) correctly show none.
2. **"More from this trader"** rail — new **`?storeSlug=`** product filter (repo already
   supported it; exposed through service + endpoint), rendered with `ProductCardMini`.
3. **"More from this market"** rail — reuses the **`?squareSlug=`** filter.
4. **Recently viewed** rail — [useRecentlyViewed.ts](../layers/commerce/app/composables/useRecentlyViewed.ts)
   (localStorage, slim product shape, no extra fetch; snapshots the list before adding the
   current product).
5. **Social proof near the title** — product **★ rating (N reviews)** linking to a new
   `#reviews` anchor (distinct from the seller rating in the trader block).
6. **Trust chips** — Buyer protection · Secure payments · Easy returns · Inspect on delivery.
7. **Description → accordion** — native `<details>` for **Description · Specifications ·
   Delivery & Returns** (accessible, zero-JS); consolidates the previously-stacked cards.
8. **Accessibility** — `aria-label`s on gallery arrows + dots; `gray-400 → gray-500` meta.
9. **Mobile sticky buy bar** — fixed price + Add-to-cart, `md:hidden`, above the bottom nav.

Verified badge, seller rating, location, member-since, and POD were **already present** in
the seller block — left as-is.

## New reusable backend capability

`GET /api/commerce/products?storeSlug=<slug>` — a trader's goods (alongside `?squareSlug=`).
Plumbed endpoint → service → repository (`where.store_slug`). See
[API_STRUCTURE.md](./API_STRUCTURE.md).

## Needs a visual pass (I verified logic + lint, not render)

- **Sticky buy bar** positioning vs. the **auto-hiding bottom nav** and the **AI FAB** —
  positioned at `bottom-16`; confirm no overlap/gap and tweak the offset if needed.
- **Search/related rails + market chip** only appear when data exists (products assigned to
  a square / other goods in the store) — expected graceful degradation.

## Deferred

- **Gallery zoom lightbox** — a new component; worth doing but should be built with a visual
  pass (focus trap + Esc + pinch/zoom).
- **Orders completed / response time / live viewers** — need backend fields / realtime.
- **Reviews inside the accordion** — kept as a standalone anchored section (rich component).

## Preserved unchanged

Gallery structure, variant/quantity controls, the POD/delivery card, `ProductReviews`,
affiliate tools, SEO, and routing. Palette, typography, Tailwind system unchanged.
