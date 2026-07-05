# MarketX — Feature Catalog

A reference inventory of the current MarketX platform surface. Doubles as the
**scope reference for the mobile (Android/iOS) build** and as onboarding docs.

**Architecture:** Nuxt 3/4 layered monorepo. Dependency order:
`ui → ai → core → feed → seller → profile → shipping → commerce → social → map → square → admin → support`.

**Availability key:** 🌐 web · 📱 mobile-target · 🛠️ admin-only (web).

---

## North Star

> **MarketX is building Africa's digital market infrastructure** — the physical
> market (Computer Village, Balogun, Bodija) rebuilt as software.

Every feature in this catalog is *supporting evidence* for that one sentence — not
a standalone product. Describe them in the language of the market, not the app:

| Not this | This |
|---|---|
| "Squares" | Buyers broadcast a request; every trader in the market offers; the buyer picks one → checkout. The part Amazon/Jumia structurally **can't** copy. |
| "Dasah AI" | An AI commerce operating system — finds the right product for buyers, helps merchants sell, tracks orders, recommends stores and markets. |
| "Escrow / POD" | *"I paid and they vanished"* — solved. Funds are held until delivery is confirmed. |
| "Messaging" | Buyers negotiate directly with trusted traders ("last price?", "collect tomorrow?"). |
| "Wall" | A living storefront that makes each trader feel present. |
| "Reels" | Traders promote products with short-form video. |
| "Stories" | Merchants update followers in real time. |

**Read the moat in this order:** the market itself (**Squares**, §10), the operating
system that runs it (**Dasah AI**, §14), and the trust layer that makes it safe
(**Escrow / POD**, §5). Everything else is distribution (feed, reels, stories, wall,
maps), retention (messaging, notifications, wallet), and rails (payments, shipping,
affiliate) — growth *inside* the market, not separate products.

---

## 1. Identity & Authentication 🌐📱
- Email/password registration & login; session + refresh-token rotation.
- Email verification (single-use, expiring tokens) + resend verification.
- Forgot/reset password (single-use, expiring, atomic claim).
- Social OAuth — Google, Facebook, TikTok (state-CSRF protected).
- Checkout OTP (send/verify, single-use, expiry).
- Seller registration (duplicate store/email/username guards, reserved slugs).

## 2. Social Feed & Content 🌐📱
- Home feed (public) and following feed (public + followers).
- Discover feed; per-square feeds; per-user feeds.
- **Reels** — vertical video, infinite scroll, persistent mute.
- **Stories** — 24h expiry, create/view/delete.
- Posts — text / image / reel; create, edit, delete (ownership-enforced).
- Likes, comments (+ replies), shares.
- **@mentions** (notify) and **#hashtags** (linkified, XSS-safe).
- Post visibility: PUBLIC / FOLLOWERS / PRIVATE (never leaks across boundaries).
- Post detail view; caption link interception → smooth navigation.

## 3. Marketplace & Discovery 🌐📱
- Product catalog (`/market`), product detail with variants.
- Category browse; curated rails: **deals**, **fresh drops**, **pre-loved / thrift**.
- Featured sellers; seller directory.
- Unified search — products, users, stores, posts, tags (PII-safe, visibility-scoped).
- Product views/impressions tracking.

## 4. Commerce, Checkout & Orders 🌐📱
- Cart (add/update/remove, validate).
- Checkout flow → order placement (server-side price authority).
- Buyer orders + order detail; **order tracking**.
- Order lifecycle: confirm-receipt, refuse-delivery, cancel, confirm-cash (POD).
- Product reviews + seller reviews (eligibility-gated).
- Saved addresses (CRUD, default).

## 5. Payments 🌐📱
- **Paystack** (card/transfer) — init + verify, replay/double-credit protected.
- **PayPal** — create + capture (international).
- **Pay-on-Delivery (POD) / escrow** — platform holds funds until receipt confirmed.
- Webhooks HMAC-verified, fail-closed, terminal-state-immutable.

## 6. Wallet & Payouts 🌐📱
- Seller wallet — balance, transactions, payout preview, **withdraw** (atomic, race-safe).
- Buyer wallet — balance, transactions.
- Bank accounts — CRUD, set-default.

## 6a. Affiliate / Referral Program 🌐📱
A two-sided promote-and-earn program layered on the catalog.

**Promoter / affiliate side**
- **Enrol** to become an affiliate → receive a unique, shareable **affiliate code**
  (`username_xxxxxx`; idempotent — re-enrolling returns the same code).
- **Browse promotable products** (`available-products`) and a seller's
  affiliate-enabled catalog (`seller-products`).
- Share referral links carrying the affiliate code; conversions are attributed on purchase.
- **Dashboard / stats** (`index`) — total earnings, **pending vs released** earnings,
  total conversions; **referrals** list of attributed orders.
- Earnings (the `affiliateCut`) are **credited to the affiliate's wallet**, released
  in line with order completion (held pending until the order settles).

**Seller side**
- Expose products to the affiliate program (commission per product).
- **Promoters** view (`promoters`) — who is promoting the seller's products.

**Integrity rules** (enforced server-side)
- Commission is **net of the platform cut** and **scales by quantity**.
- **Per-seller isolated** — an affiliate's cut is computed per seller, not pooled.
- **Self-referral blocked** — you can't earn commission on your own purchase.
- Conversions attributed once; pending → released on settlement (no double-credit).

## 7. Shipping 📱🌐 *(isolated `layers/shipping` — see [SHIPPING.md](SHIPPING.md))*
- Carrier-agnostic orchestration; multi-carrier quotes at checkout.
- Providers: **GIG** (rate-card + zones), Sendbox (NG), Shippo (international, scaffolded).
- NG domestic zoning (Z1–Z4) + GoFaster express; hybrid product weights.
- Settlement: MarketX Escrow POD (default) vs Carrier Cash-Collection (opt-in).
- Tracking timeline; returns & 24h claims; seller self-shipping option.
- Admin: rate cards, discount dial, category weights.

## 8. Profile & Social Graph 🌐📱
- View profile; edit profile (URL-scheme-guarded links).
- Follow / unfollow (self-follow + duplicate blocked).
- Followers / following lists; follow-suggestions.
- Saved items, likes; account settings.

## 9. Seller Suite 🌐📱
- Store creation & public store profile/page.
- **Seller dashboard** + **analytics** (sales/revenue/orders, 7–90d).
- Product management — list, create, edit, delete; inventory & variants; drafts.
- Order management + status updates (seller-scoped).
- Store **messages/inbox** (customer chat).
- Store settings; activate/deactivate; online status (ping/lastActiveAt).
- **Store wall** + shoutouts (see Wall).

## 10. Squares — Community Commerce 🌐📱
- Browse squares; square profile + feed.
- Membership: join, approve/reject (chairman), roles.
- Announcements (typed notifications).
- **Buyer requests → seller offers** — buyers post structured requests; member
  sellers respond with owned products (existing or quick-add); buyer
  accepts → on-platform checkout. Anti-leakage content guard (masks contact info).
- "Buyers looking for" demand strip on the All tab.
- Square admin tools.

## 11. Wall (Seller/User Timeline) 🌐📱
- Unified wall timeline (own posts + shoutouts), guest & authenticated views.
- Post a shoutout on a store/user wall (auth, self-wall blocked, 1–1000 chars).
- Delete shoutout (author or wall owner); typed `WALL_SHOUTOUT` notification.

## 12. Messaging (Real-time) 🌐📱
- Conversations — buyer↔buyer and buyer↔store.
- Real-time delivery via Pusher/Soketi (private per-user channels).
- Inbox, start new conversation, send/delete message; participant/owner IDOR-guarded.

## 13. Notifications (Real-time) 🌐📱
- SSE real-time stream + DB-backed history.
- Types: orders, mentions, follows, post likes/comments, squares
  (request/offer/membership/announcement), wall shoutouts, messages, products.
- Mark-read / mark-all-read / delete (ownership-enforced).
- Delivery via BullMQ (Redis) with inline fallback.

## 14. Dasah AI — In-App Assistant 🌐📱 *(agent brain in the standalone Dasah app)*
- Conversational AI embedded in the app (buyer & seller modes), with rich result cards.
- **Semantic (vector) discovery** — `semantic_search` matches **products, stores AND
  markets** by *meaning*, not just keywords (e.g. "modest wear" → abaya/kaftan sellers),
  backed by a pgvector index (OpenAI embeddings) kept in sync with MarketX data.
- **Keyword / raw search** — exact product titles & price filters via the commerce APIs.
- **Deep entity detail** — `product_detail` (full description, every variant/size + stock,
  categories, tags, rating), `view_store` (a store + its products), `view_market`
  (a market/square + its products).
- Add-to-cart, payment links, order tracking, disputes, and seller tools via chat.
- Context/embeddings over the user's session + persisted user AI profile; output guardrails.
- Surfaces: Dasah chat widget + mobile AI chat; product / store / **market** cards.
- *Architecture:* the agent runs in a **standalone Dasah app** (independent MarketX-API
  consumer). MarketX exposes internal AI endpoints — embeddings write + `/api/ai/search`
  (semantic read) — with two clearly-separated retrieval paths: **embeddings** (meaning) vs
  **raw query** (exact). See [ARCHITECTURE.md](ARCHITECTURE.md) §21.

## 15. Map / Location 🌐📱
- Seller pins on map; location-based discovery.
- Filter by category / distance (radius).
- **Ghost mode** (`hideLocation`) — sellers excluded from map & precise location
  never exposed.

## 16. Customer Support & Disputes 🌐📱
- **Support tickets** — users (and guests, via email) open categorised tickets;
  threaded messages; close. Ticket refs `MX-<n>`.
- **Order disputes** — buyers raise a dispute on a paid order (buyer ↔ seller,
  MarketX mediates); anti-leakage guard on shared contact info.
- **Agent console** (`/support/agent`) — queue with filters (open / unassigned /
  mine / disputes), assign, reply (public **or** internal note), set status /
  priority, and **resolve** with an outcome. Dispute outcomes: **REFUND_BUYER**
  (reverses the seller credit; card refunds actioned manually), **PARTIAL_REFUND**,
  **RELEASE_SELLER**, **REJECTED**.
- Real-time + email notifications on ticket create / reply / resolve.
- **Access:** tickets & disputes are user-facing; the agent console is gated to the
  **`support_agent`** (or admin) role — assigned from Admin (§17).

## 17. Admin 🛠️ *(web-only — out of mobile scope)*
- Users, sellers, reports, audit logs management.
- **Assign the `support_agent` role** (promote / demote users) + support-queue link.
- Legal/team-chart, moderation surfaces.

---

## Cross-cutting capabilities (apply across mobile)
- **Real-time:** SSE (notifications), Pusher/Soketi (chat).
- **Media:** image + video upload; reels/stories video pipeline; bg music.
- **Push notifications** (mobile target), deep links, offline handling.
- **Security:** Bearer-token auth, server-side authorization (IDOR-guarded),
  XSS-safe rendering, rate limiting (see [SECURITY.md](SECURITY.md)).
- **i18n:** Zod error translation (client); localization-ready.
- **Design system:** shared `layers/ui` components (BaseButton/Card/Modal/etc.),
  Sora + Manrope fonts, dark-native (see the `style` design guide).
- **Payments/KYC:** Paystack/PayPal/POD; seller verification status.

---

## Mobile build scope notes
- Target both **Android + iOS** from one Flutter codebase (native modules where needed).
- Consume the **existing MarketX REST APIs** — no new backend.
- **In mobile scope:** §1–§16. **Out:** §17 (admin, web-only). Within §16, buyer
  **tickets & disputes** are in scope; the **agent console** is agent-only (web).
- v1 vs later phases to be agreed — a sensible v1 = identity + feed + marketplace +
  checkout/payments + orders + seller basics + messaging + notifications; with
  squares, Dasah, affiliate, wallet, support, and map following in phase 2.
