# MarketX — Discover Page Review & Implementation

> Governed by [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) (*Place → Traders → Goods*).
> Companion to the homepage [DESIGN_REVIEW.md](./DESIGN_REVIEW.md). Every change below
> was checked against one question: *does this make MarketX look more like Amazon, or
> more like a digital African market?* — and reframed toward the latter.
>
> Grounded in the real page: [discover.vue](../layers/commerce/app/pages/discover.vue),
> [Trending.vue](../layers/commerce/app/components/discover/Trending.vue) (browse landing),
> [RightSideNavDiscoverFilter.vue](../layers/commerce/app/components/RightSideNavDiscoverFilter.vue),
> [ProductCardMini.vue](../layers/commerce/app/components/ProductCardMini.vue).

## Executive summary

The Discover page was **well-engineered but generically framed** — a tabbed catalog with
"Fresh Drops / Hot Deals / Top Stores" headers, markets demoted to one tab of nine, and
products that never named their market. The redesign was **evolutionary**: same tab
architecture, filters, cards, and fetch logic; re-framed copy, markets woven into the
landing, market context on the card, and the dead "Time range" sidebar turned into
discovery.

## Scores (pre-redesign baseline)

| Dimension | Score | Note |
|---|---:|---|
| UX | 6.5 | Solid tabs/filters; cramped hero, buried markets, generic sections. |
| UI | 6.5 | Clean; uppercase `tracking-wider` catalog headers read generic. |
| Accessibility | 5.0 | `gray-400` meta, tab targets ~28px, `text-[10px]` labels. |
| Mobile | 6.5 | Sticky search good; small targets. |
| Conversion | 6.0 | Good surface; no market/trust weaving. |
| Trust | 5.5 | Card had a trader but no market context; generic framing. |

## What shipped (all 11 items)

1. **Copy sweep** — "Fresh Drops → Fresh from the markets", "Hot Deals → Deals across the
   markets", "Hot Right Now → Trending with traders", "Top Stores → Traders to discover",
   "Trending Tags → Popular in the markets"; search placeholder → **"Search products,
   traders or markets"**; "Sellers" tab → **"Traders"**; empty state → market invitation.
2. **Category heading** — "What are you looking for today?" above the category grid.
3. **Contrast + touch targets** — `gray-400 → gray-500` meta sweep; tabs `py-2 min-h-[38px]`.
4. **Typography** — retired uppercase `tracking-wider` catalog headers for a cleaner,
   darker title style (better contrast, matches home tone).
5. **Hero** — lightweight non-sticky intro ("Discover" + "Search products, traders or
   markets across Nigeria") with the search promoted full-width in the sticky bar.
6. **Markets-near-you strip** — the Browse landing now **leads with markets** (`SquareCard`
   spotlight cards) before any product rail.
7. **Sidebar discovery** — replaced the low-value "Time range" filter with **Markets by
   category + Popular traders** (verified ticks), reusing `useRightSidebarData`.
8. **Trader trust** — verified tick + ★ rating on featured-trader cards (`averageRating`
   added to the trending seller select).
9. **Market on the product card** — `square{name,slug}` added to the deals/fresh/trending
   product selects + a tappable **market chip** on `ProductCardMini`.
10. **Search suggestions panel** — on focus: Recent · Trending · Popular markets · Popular
    traders · Categories ([SearchSuggestions.vue](../layers/commerce/app/components/discover/SearchSuggestions.vue),
    [useRecentSearches.ts](../layers/commerce/app/composables/useRecentSearches.ts)).
    *(Nearby deferred — needs geolocation.)*
11. **"Fresh from {Market}"** — a context-aware, market-specific product section featuring
    the top geographic market, powered by a new `squareSlug` product filter.
    *(Live/presence cues deferred — needs a real "open now" signal.)*

## New reusable backend capability

`GET /api/commerce/products` now accepts **`?squareSlug=<slug>`** — fetches products in a
given market (real `ProductCardMini` shape). Plumbed:
[endpoint](../layers/commerce/server/api/commerce/products/index.get.ts) →
[product.service](../layers/commerce/server/services/product.service.ts) →
[product.repository](../layers/commerce/server/repositories/product.repository.ts)
(`where.square = { slug }`).

## How to access / see it

- Navigate to **`/discover`** (Browse tab is the landing).
- Market-specific bits (**"Fresh from {Market}"**, the market chip) appear only when
  **products are assigned to a square** (`squareId`). If dev seed data doesn't link
  products to markets, those sections stay hidden (guarded — no dangling headers).
- Verify the filter directly:
  `GET /api/commerce/products?squareSlug=<geographic-square-slug>&sortBy=newest`.

## Deferred (need data/signal, not quick edits)

- **Nearby searches** (search panel) — geolocation permission + `/map/sellers`.
- **Live/presence cues** — a per-market "open now / selling live" signal.
- **Full per-market feed grouping** — the current version features *one* market; grouping
  every rail by market ("Trending in Computer Village") is a larger feed-algorithm change.

## Preserved unchanged

The 9-tab architecture, `useDiscoverFilters`, the per-tab filter system (price/sort/
discount), the sticky header + backdrop-blur, the bundled `getTrending` fetch, skeletons,
`CategoryGrid`, and `ProductCardMini`'s core layout. Vision, palette, Tailwind system,
routing, and responsive behaviour are unchanged.
