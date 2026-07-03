# MarketX — Design Philosophy (North Star)

> This document governs **every** design and UI decision in MarketX. When a tactical
> choice (see [DESIGN_REVIEW.md](./DESIGN_REVIEW.md)) conflicts with this document,
> **this document wins.** Product, design, web, and mobile all build to this identity.

---

## 1. The category thesis

MarketX is **not** a marketplace app. It is the **digitization of Africa's physical
market squares** — Balogun, Computer Village, Wuse, Ariaria, Kurmi, Onitsha — into
living, searchable, trusted, community-driven places.

Every marketplace answers one question:

> ❌ "What do you want to buy?"

MarketX answers a different one:

> ✅ **"Which market do you want to visit?"**

That single reframe is the moat. Products are the **result** of visiting a market —
never the entry point. If a screen leads with an un-attributed product grid, we have
become Temu/Jumia/Amazon and lost the reason to exist.

---

## 2. The organizing principle: Place → Traders → Goods

A physical market is **entered**, not queried. The whole product is a journey:

1. **Place** — you enter a *market* (a Square: a real, named, located destination).
2. **Traders** — you meet the *people* (stalls/merchants, with faces and reputation).
3. **Goods** — you browse their *goods*, always attributed to a trader in that market.

Every screen must answer **"which market am I in, and who am I buying from?"** before
it answers "what's the price."

---

## 3. What MarketX is NOT (the genericization guardrail)

Reject these patterns even when they would lift short-term conversion:

- ❌ **Products as the top-level unit.** A homepage product grid = Temu.
- ❌ **A faceless "Continue shopping / Recommended for you" catalog rail.** = Amazon.
- ❌ **Anonymous sellers / SKUs.** = Jumia. Our trader is a *person* you build a
  relationship with.
- ❌ **Impulse-purchase pressure** (giant −70% badges, countdown-everything). Nigerian
  commerce is *considered*: compare → chat → trust → buy.
- ❌ **Sterile uniform gray UI.** A real market is colorful, alive, local.

## 4. Guardrails (apply to every decision)

- **Spine, not turnstile.** The market metaphor organizes the experience; it must never
  *gate* it. A real market lets you wander in without choosing. Always keep a
  low-friction "just show me what's fresh" path beneath the market framing.
- **Authentic ≠ literal.** Do **not** skeuomorph market stalls, wooden textures, or
  market-noise — that reads cheap and fails design review. Identity comes through
  **structure, language, color, and presence** on top of a clean, premium base.
  **Premium frame, local soul.**
- **Considered, not impulse.** The primary action on a good is *view the stall / meet
  the trader*, not "buy now."

---

## 5. Identity assets we already own (surface these, don't add generic ones)

These exist in the codebase today and are under-used. Promoting them **is** the redesign:

| Asset | Where | Use it for |
|---|---|---|
| Per-square `accentColor` | [SquareCard.vue](../layers/square/app/components/SquareCard.vue) | Give every market its own color identity — entering Balogun *feels* different from Wuse. **Highest-impact untapped lever.** |
| `GEOGRAPHIC` vs `CATEGORY` square types | SquareCard props | Lead with geographic, real, named markets. Show a **map of squares**. |
| Buyer-request → seller-offer flow | Squares API (requests/offers) | **"Ask the market"** — digital haggling. Culturally authentic; no Western marketplace has it. |
| Store wall + shoutouts | Squares/wall API | The market's chatter — "Traders are saying…". |
| "Selling now / Live" online sellers + `/map/sellers` distance | [MarketHome.vue](../layers/feed/app/components/MarketHome.vue), map layer | **Presence** — a real market's value is that it's *busy right now*. |
| Real-time chat | chat API | **"Message the trader"** — the true pre-purchase action here. |

---

## 6. The card interaction model (considered, not impulse)

On a good (product card), action priority is:

1. **Primary — View the stall / good.** The whole card is the tap target; it opens the
   good *in the context of its trader and market*.
2. **Secondary — "Message trader."** Chat exists; surfacing it is pure identity and
   matches real buying behavior. No global marketplace leads with talk-to-seller. We do.
3. **Tertiary — quiet Add to cart.** The existing subtle cart icon is *correct* for this
   model. Only fix required: give it a ≥44px touch target for accessibility.

> Note: this reverses the earlier audit's "full-width Add to Cart" recommendation, which
> imported an impulse-commerce pattern into a considered-purchase culture. See the
> corrections log in [DESIGN_REVIEW.md](./DESIGN_REVIEW.md).

---

## 7. The Market Passport (retention & moat)

As a user visits markets, follows traders, buys, and reviews, they build a **Market
Passport** — a record of *belonging*, not a points game.

- **It is reputation, not XP.** Frame it as being a "regular," a known face in a market —
  emotional payoff is *recognition*, never a score to grind. The moment it becomes
  coins/points, we are Temu again.
- **It is two-sided and trust-bearing.** The magic is **portable trust**: "Trusted by 23
  traders," "Regular of Computer Village since 2024" travels with the user and *lowers
  friction* with new traders. Reputation is a graph competitors can't clone.
- **Design the first stamp, not the dashboard.** On day one the passport is empty. The
  rewarding moment is the **stamp** when you first enter a market — earn-the-moment first,
  aggregate stats second.

Example profile surface:

```
Market Passport
📍 Markets visited: 8      ⭐ Favourite: Computer Village
🤝 Trusted by traders: 23  🛍️ Completed purchases: 41
```

---

## 8. Cold-start, location & guest rules (so the spine doesn't become a turnstile)

- **Guests get the magic too.** The personalized greeting is auth-only; guests must still
  see a compelling market-first hero. Never gate wonder behind login.
- **Personalize by place.** Markets are geographic. Lead with markets *near the user*
  (`/map/sellers` distance). Pre-permission, fall back to famous + busy markets
  nationally, then "markets near you" once granted. A Kano user must not lead with Lagos.
- **Curate for liveness.** Only promote markets above a liveness threshold; route sparse
  ones to "up-and-coming markets." An empty named market feels worse than a generic grid.

---

## 9. Vocabulary & copy map (cheap, huge identity gain)

Replace generic e-commerce words with market language everywhere:

| Generic (avoid) | MarketX (use) |
|---|---|
| Sellers / Stores | **Traders / Merchants** |
| Store / Shop | **Stall / Shop** |
| Products / Catalog / Results | **Goods** |
| Browse products | **Walk the market · Explore stalls** |
| Online now | **Open now · Selling now** |
| "Browse by market" | **Explore Nigeria's Digital Markets** |
| "Selling Now" | **Markets Open Right Now** |
| Search placeholder "Search MarketX…" | **Search markets, traders or goods** |
| Empty square: "No squares yet" | **"This market is just opening — be one of the first traders."** |

---

## 10. Homepage information architecture (the crystallized order)

```
Search markets, traders or goods            ← persistent, hero
🏪 Explore Markets (near you)               ← HERO: large, accent-colored, live
👥 Traders Selling Live                     ← presence / bustle
🔥 Fresh from the Market                    ← goods, ALWAYS attributed to trader + market
📣 Ask the Market                           ← buyer-request → offers (haggling)
🗣️ Traders are saying                       ← wall shoutouts
📍 Market Map                               ← keep the dark CTA
```

Logged-in enhancement (guests see a market-first hero instead):

```
Good afternoon, {name} 👋
Which market are you visiting today?
📍 Balogun   📍 Computer Village   📍 Wuse   📍 Ariaria
🟢 1,248 traders selling live
Trending inside {their market} →
```

---

## 11. How to use this document

- Before designing/altering any screen, confirm it satisfies **Place → Traders → Goods**
  and the §4 guardrails.
- The tactical backlog in [DESIGN_REVIEW.md](./DESIGN_REVIEW.md) is scored and sequenced,
  but each item must serve this philosophy — if it doesn't, cut or reshape it.
- New features get one test: **does this make the user feel they're visiting a real
  Nigerian market, or does it make us look like a generic shopping app?**
