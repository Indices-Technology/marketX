# MarketX — Design Review & Tactical Backlog

> The **what/how**. Governed by [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) (the
> **why/identity**). Every item below must reinforce *Place → Traders → Goods*; where an
> item once optimized for generic marketplace conversion, it has been corrected (see §2).
>
> Grounded in a read of the real screens: [MarketHome.vue](../layers/feed/app/components/MarketHome.vue),
> [ProductCardMini.vue](../layers/commerce/app/components/ProductCardMini.vue),
> [SquareCard.vue](../layers/square/app/components/SquareCard.vue),
> [HomeLayout.vue](../layers/feed/app/layouts/HomeLayout.vue),
> [SideNav.vue](../layers/core/app/layouts/children/SideNav.vue),
> [RightSideNav.vue](../layers/core/app/layouts/children/RightSideNav.vue),
> [BottomNavMobile.vue](../layers/core/app/layouts/children/BottomNavMobile.vue),
> [HeaderNavMobile.vue](../layers/core/app/layouts/children/HeaderNavMobile.vue).

## 1. Scores (pre-redesign baseline)

| Dimension | Score | Note |
|---|---:|---|
| UX | 6.0 / 10 | Good bones; buried search, hidden differentiator, no single primary action. |
| UI | 6.5 / 10 | Clean but timid; inconsistent H2 sizing; accent-color drift. |
| Conversion | 5.0 / 10 | Weak trust signals; empty sections vanish; but *impulse* CTA is the wrong fix (see §2). |
| Trust | 4.0 / 10 | Almost no trust surface on cards. Critical for NG. |
| Accessibility | 4.5 / 10 | `gray-400` contrast fails AA; sub-44px targets; icon-only controls. |
| Mobile | 5.5 / 10 | No persistent search; cart absent from bottom nav; center CTA is "Create"; mislabeled tabs. |
| **Overall** | **≈ 5.3 / 10** | Launchable beta; not yet editorial-grade. |

## 2. Corrections log (changes from the first audit)

- **RETRACTED: "Full-width Add to Cart."** Imported impulse-commerce into a
  considered-purchase culture. Corrected model: **View stall (primary) → Message trader
  (secondary) → quiet cart (tertiary, +44px hit area).** The existing ghost cart icon is
  *defensible* under our philosophy. See DESIGN_PHILOSOPHY §6.
- **RESHAPED: "Right rail → Continue shopping / Recently viewed."** That was the Amazon
  reflex. Corrected: a **markets & community rail** (Markets near you · Traders you follow
  who are open · Ask the market · Trader shoutouts). See item C6.
- **RESHAPED: "Squares hero / product rails."** Reframed as **destination-first**: markets
  are the hero; goods appear only *attributed to a trader + market*. See C3, C4.
- **ADDED:** market **vocabulary sweep**, per-square **accent activation**, and the
  **Market Passport** as first-class identity work (Q-items and M-items below).

---

## 3. Critical (identity + launch-blocking)

**C1 — Persistent, market-first search.**
Search is a 24px header icon on mobile ([HeaderNavMobile.vue:18](../layers/core/app/layouts/children/HeaderNavMobile.vue#L18)) and right-rail-only on desktop. Make it row 1 of the home column on all breakpoints. Placeholder: **"Search markets, traders or goods."** *Priority: Critical.*

**C2 — Fix the placeholder & brand QA.**
`"Search MarketX…"` → `"Search markets, traders or goods"` ([RightSideNav.vue:22](../layers/core/app/layouts/children/RightSideNav.vue#L22)). Fix the literal **`'styleX'`** fallback → `'MarketX'` ([HomeLayout.vue:166](../layers/feed/app/layouts/HomeLayout.vue#L166)). *Priority: Critical (trivial).*

**C3 — Promote Market Squares to the hero destination.**
Today they're 144px `compact` chips showing only name + seller count ([MarketHome.vue:76](../layers/feed/app/components/MarketHome.vue#L76)). Make markets position #1 (below search) using the richer `full` variant: banner, **live dot**, "N traders · M goods," location, 3 featured-merchant avatars, **per-square accent color**. Section title: **"Explore Nigeria's Digital Markets."** *Priority: Critical.*

**C4 — Goods are always attributed to a trader + market.**
Product cards currently show title/store/price with **no rating, location, verified badge, or market context** ([ProductCardMini.vue](../layers/commerce/app/components/ProductCardMini.vue)). Add: ★ rating (count) · trader ✓ · market/locality. Never render an un-attributed good. *Priority: Critical.*

**C5 — Correct the card action model (not a louder buy button).**
Primary = view stall; secondary = **Message trader** (chat API); tertiary = quiet cart with a ≥44px hit area (`h-6 w-6` → wrap in `h-11 w-11`). *Priority: Critical.*

**C6 — Replace the Twitter right rail with a markets & community rail.**
"Who to follow / What's happening / trending hashtags / black follow pills" ([RightSideNav.vue:195](../layers/core/app/layouts/children/RightSideNav.vue#L195)) → **Markets near you · Traders you follow (open now) · Ask the market · Trader shoutouts.** *Priority: Critical.*

**C7 — Never let a section vanish; convert with an on-identity empty state.**
Deals `v-if` removes itself when empty ([MarketHome.vue:6](../layers/feed/app/components/MarketHome.vue#L6)); Squares shows bare "No squares yet" ([:73](../layers/feed/app/components/MarketHome.vue#L73)); "What people are saying" has no empty fallback. Swap to populated fallbacks and designed empty states, e.g. **"This market is just opening — be one of the first traders."** *Priority: Critical.*

**C8 — Accessibility sweep.**
`text-gray-400` (#9ca3af ≈ 2.8:1) on white fails AA — promote meta text to `gray-500/600`, min 12px. Enforce 44px touch targets (like `h-7 w-7`, cart `h-6 w-6`, follow pills). Fix icon-only controls / hover-only reveals for keyboard + screen readers. *Priority: Critical (a11y).*

## 4. Quick Wins (< 1 day)

- **Q1 — Market vocabulary sweep** (DESIGN_PHILOSOPHY §9): Stores→Traders, "Browse by market"→"Explore Nigeria's Digital Markets", "Selling Now"→"Markets Open Right Now", placeholder, empty-state copy. *Highest identity-per-effort.*
- **Q2 — Activate per-square `accentColor`** on the home Squares section (borders → real color identity).
- **Q3 — `styleX` → `MarketX` fallback** (C2).
- **Q4 — Fix nav taxonomy:** bottom-nav storefront tab is `aria-label="Near Me"` but routes to `/squares`; left nav "Near Me" routes to `/map`. Pick one model, fix the label ([BottomNavMobile.vue:18](../layers/core/app/layouts/children/BottomNavMobile.vue#L18)). 
- **Q5 — Add Cart to the mobile bottom nav** (currently header-only, which auto-hides). Center slot → Search; "Create" → seller-only FAB.
- **Q6 — Meta contrast + 12px minimum + section H2/eyebrow typography tokens** (unify `text-xl` vs `text-base` header drift).
- **Q7 — Add ★ rating to product cards** (data already available).

## 5. Medium (< 1 week)

- **M1 — Redesign ProductCard** to the corrected model (attribution + rating + Message trader + 44px quiet cart).
- **M2 — Squares hero section** with `full` variant + live dot + goods count + featured merchants + accent (C3). The `full` variant already renders most of this — mostly wiring + product count + live dot.
- **M3 — Persistent search field** on home + center bottom-nav slot (C1).
- **M4 — Reorder homepage** to the §10 IA (Search → Explore Markets → Traders Live → Fresh from the Market → Ask the Market → Shoutouts → Map).
- **M5 — Regroup left nav** into **Markets · Your stall (sell) · You** (currently one flat ungrouped list, [SideNav.vue](../layers/core/app/layouts/children/SideNav.vue)).
- **M6 — Trader trust strip** on trader cards/rows (Verified · Regular since · Orders · Responds in · Delivery success).

## 6. Major

- **MA1 — "Enter the market" experience.** Tapping a square adopts its accent, shows a market header ("Balogun · Lagos · 42 traders open"), then **stalls** (traders), then goods. Place → Traders → Goods made literal.
- **MA2 — "Ask the market" (haggling).** Surface buyer-request → seller-offer prominently (home + inside squares). Culturally unique.
- **MA3 — Market Passport** (DESIGN_PHILOSOPHY §7): reputation & portable trust, first-stamp moment, two-sided.
- **MA4 — Trader relationships / "your traders"** — the repeat-relationship layer a real market runs on.
- **MA5 — Unified accent/color token system** (brand primary vs per-square accent vs neutral action) documented in `layers/ui/` + the `/style` skill. Fixes the rose/amber/black drift.
- **MA6 — Micro-interaction pass:** skeleton→content fade, optimistic cart + toast, passport stamp animation, sticky "N in cart · Checkout," market-presence pulse.

## 7. Components to redesign vs keep

**Redesign:** ProductCardMini (attribution + action model), RightSideNav (markets/community rail), MarketHome (destination-first IA), BottomNavMobile (Cart in, Search center, Create→FAB, labels), SideNav (grouped taxonomy), SquareCard *compact* (enrich or retire in favor of `full` on home), HeaderNavMobile (inline search).

**Keep (largely unchanged):** SquareCard **`full` variant** (genuinely good — add live dot + goods count), the dark **Map CTA**, **skeleton loaders**, the grouped **search-results dropdown** (add pre-query suggestions: recent, trending, popular markets, nearby), the **brand wordmark**, and the overall clean Tailwind / dark-mode / safe-area substrate. **Premium frame, local soul.**

## 8. Suggested sequence

**Quick Wins (1 day)** → **ProductCard + Squares hero + persistent search (week 1)** →
**Markets/community rail + trader trust (week 2)** → **Enter-the-market + Ask-the-market + Passport (major)** → **polish.**

Done in this order, MarketX moves from ≈5.3 to a credible 8+ **without** touching the
architecture or brand — and every step deepens the market-square identity rather than
diluting it into a generic marketplace.
