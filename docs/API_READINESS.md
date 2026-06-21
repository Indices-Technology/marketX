# MarketX — API Readiness Matrix (Mobile MVP)

> Maps the proposed **4-milestone mobile build** to the actual API surface, with
> honest status per feature. Purpose: agree deliverables, dependencies, and
> acceptance criteria **before** each milestone starts, and surface anything the
> mobile app needs that the backend does not yet provide.
>
> Derived from `layers/*/server/api/` on 2026-06-21. Base URL: `…/api`.

## Legend

| | Meaning |
|---|---|
| ✅ | **Ready** — endpoint exists and is usable as-is |
| 🟡 | **Partial / Verify** — exists but incomplete, web-shaped, or depth unconfirmed |
| 🔴 | **Missing** — no backend; must be built or de-scoped before the milestone |

> 🟡/🔴 items are the ones to put on the table with Samuel. Everything ✅ he can
> build against today.

---

## Cross-cutting (applies to all milestones — fix before M1 where noted)

| Item | Status | Impact | Action |
|---|---|---|---|
| **API versioning (`/v1`)** | 🔴 | No version prefix. Once his binary ships, any response change breaks installed apps. | Decide a scheme **before M1**. |
| **Push notifications (FCM/APNs)** | 🔴 | Web uses SSE/Soketi; mobile needs device-token registration + a server-side push sender. None exists. Spans M1 (setup) + M4 (delivery). | Build device-token endpoints + FCM send, or de-scope to in-app-only. |
| **OpenAPI annotations** | 🟡 | Only Auth + 1 seller route fully specced; rest are bare paths. | Annotate per-milestone ahead of each phase. |
| **`{id}` vs slug inconsistency** | 🟡 | Seller routes: some `{id}` mean store slug, some mean UUID. Contract hazard. | Document per route (in progress); rename later. |
| **Native OAuth (PKCE)** | 🟡 | Social-login flow is browser/cookie based (`/auth/session` bridge). Native needs PKCE + deep link. | Confirm provider SDKs; treat as M1 spike. |
| **Device-session management** | 🟡 | `Session` table tracks device/IP, but there's no "list my sessions / sign out device" endpoint. | Add if "sessions" in M1 means user-visible device management. |

---

## Milestone 1 — Foundation, auth & app architecture (₦500k)

| Feature | Endpoint(s) | Status |
|---|---|---|
| Register / login | `POST /auth/register`, `POST /auth/login` | ✅ |
| Email verification | `POST /auth/verify-email`, `POST /auth/send-verification-email` | ✅ |
| Password reset | `POST /auth/forgot-password`, `POST /auth/reset-password` | ✅ |
| Checkout OTP | `POST /auth/checkout-otp/send`, `…/verify` | ✅ |
| Sessions / token refresh | `…/auth/refresh-token` (mobile transport added — header/body) | ✅ |
| OAuth (where available) | `GET /auth/oauth/{provider}` | 🟡 web-flow; needs native PKCE |
| Device-session list/revoke | — | 🟡 no endpoint |
| Profile foundation | `GET/PATCH /profile`, `…/email`, `…/password` | ✅ |
| Settings foundation | `GET/PATCH /profile/settings` | ✅ |
| Loading / empty / error states | error envelope is documented (MOBILE_INTEGRATION §3) | ✅ client-side |

**M1 verdict:** ~90% ready. Open: native OAuth approach, optional device-session UI,
and the **versioning + push-token decisions belong here** since they shape the architecture.

---

## Milestone 2 — Marketplace, discovery & seller storefronts (₦500k)

| Feature | Endpoint(s) | Status |
|---|---|---|
| Home / discovery | `GET /feed/home`, `/feed/discover` | ✅ |
| Product catalog + detail | `/commerce/products`, `…/{id}`, `…/by-slug/{slug}`, `…/variants/{id}` | ✅ |
| Category browse | `/commerce/categories`, `/tags`, `/tags/{id}/products` | ✅ |
| Search (products/stores/posts/tags) | `GET /search` | ✅ |
| Seller storefront | `/seller/by-slug/{slug}`, `/seller/{id}` (slug), `/seller/{id}/products` | ✅ ⚠️ slug naming |
| Curated rails (deals/fresh-drops/featured/pre-loved) | `/feed/deals`, `/feed/fresh-drops`, `/seller/featured`, `/feed/pre-loved` | ✅ |
| Store creation / profile | `POST /seller/register`, `PATCH /seller/{id}` | ✅ ⚠️ `{id}`=UUID here |
| Product CRUD / inventory | `POST/PATCH/DELETE /commerce/products…` | ✅ |
| Seller order management | `GET /commerce/orders/seller`, `PATCH /commerce/orders/{id}/status` | ✅ |
| Analytics summary | `GET /seller/analytics/{storeSlug}` | 🟡 exists; confirm fields meet "summary" need |
| Seller dashboard | composed of analytics + orders (no single endpoint) | 🟡 client composes |
| Store wall + shoutouts | `GET/POST/DELETE /wall/{type}/{slug}` | ✅ |

**M2 verdict:** strong. Open: confirm seller-analytics payload depth; agree the
seller `{id}` slug-vs-UUID convention so the storefront vs management screens don't trip.

---

## Milestone 3 — Commerce, checkout, shipping & money (₦500k)

| Feature | Endpoint(s) | Status |
|---|---|---|
| Cart | `/commerce/cart` (get/post), `…/{variantId}` (patch/delete), `…/validate` | ✅ |
| Checkout / place order | `POST /commerce/orders` | ✅ |
| Saved addresses | `/profile/addresses` (get/post), `…/{id}` (delete), `…/default` | ✅ |
| Paystack | `POST /commerce/payments/initialize`, `…/verify` | ✅ |
| PayPal | `POST /commerce/payments/paypal/create`, `…/capture` | 🟡 ARCHITECTURE calls it a **stub** — verify it's live |
| Pay-on-Delivery / escrow | `…/payments/pod-initialize`, `…/pod-verify`, order `confirm-receipt`/`confirm-cash`/`refuse-delivery` | ✅ |
| Orders + detail | `GET /commerce/orders`, `…/{id}`, `…/{id}/cancel` | ✅ |
| Order tracking / timeline | `GET /shipping/track/{trackingNumber}` | 🟡 tracking exists; "timeline" richness depends on provider data |
| Reviews | `/products/{id}/reviews` (+eligibility), `/seller/{id}/reviews` | ✅ |
| Shipping quotes | `/shipping/rates`, `/shipping/quote`, `/shipping/calculate`, `/shipping/zones` | ✅ |
| Buyer / seller wallet views | `/commerce/buyer-wallet`, `/commerce/wallet`, `…/store/{storeSlug}` | ✅ |
| Transactions | `/commerce/wallet/transactions`, `/commerce/buyer-wallet/transactions` | ✅ |
| Withdrawals / payouts | `/commerce/wallet/withdraw`, `…/payout-preview`, `…/add-funds` | ✅ |
| Bank accounts | `/seller/bank-accounts` (+ set-default, delete) | ✅ |
| Affiliate (enroll/referrals/commissions/promote) | `/commerce/affiliate` (+ enroll, referrals, promoters, seller-products, available-products) | ✅ |

**M3 verdict:** the deepest milestone, and mostly ✅. Open: **confirm PayPal is
production-functional** (or de-scope to Paystack + POD), and align on what "tracking
timeline" data the shipping provider actually returns.

---

## Milestone 4 — Social, community, messaging, AI, maps, QA (₦500k)

| Feature | Endpoint(s) | Status |
|---|---|---|
| Social + following feed | `/feed/home`, `/feed/following`, `/posts` | ✅ |
| Posts (text/image/video, likes, comments, shares) | `/posts…`, `…/{id}/like`, `…/comments`, `…/share` | ✅ |
| Mentions / hashtags | `GET /mentions/search`, caption parsing | ✅ |
| Visibility rules | enforced server-side (PRIVATE/FOLLOWERS never leak) | ✅ |
| Reels (vertical video) | `GET /feed/reels` | ✅ |
| Stories (24h) | `/stories` (get/post), `…/{id}` (get/delete), `…/{id}/view` | ✅ |
| Follow/unfollow, followers/following, suggestions | `/profile/{username}/follow…`, `/profile/suggestions` | ✅ |
| Saved / liked items | `/posts/save…`, `/posts/liked`, `/commerce/products/liked` | ✅ |
| Squares (browse, feed, join, announcements) | `/squares…`, `/feed/squares/{slug}`, `…/join`, `…/announcements` | ✅ |
| Buyer-request → seller-offer flow | `/squares/{slug}/requests…`, `…/offers`, `…/offers/{offerId}` | ✅ |
| Real-time messaging (buyer↔buyer, buyer↔store) | `/chat/conversations…`, `/chat/ws` (WebSocket) | ✅ |
| Inbox / unread states | conversations list; notification `…/notifications/unread` | 🟡 confirm chat-unread source |
| **In-app** notifications (orders/mentions/follows/squares/messages) | `/shared/notifications` (index, unread, read-all, `{id}` patch/delete) + SSE `…/notifications/stream` | ✅ |
| **Push** notifications (FCM/APNs) | — | 🔴 **no device-token registration, no push sender** |
| Dasah AI assistant (buyer/seller modes) | AI infra: `/ai/context…`, `/ai/embeddings…`, `/ai/profile/{userId}`, `/ai/logs/{turn,guard}`, `/user/ai-config` | 🟡 infra present; **confirm the conversational completion endpoint** the app calls |
| Map seller discovery (location/category/distance) | `/map/sellers` (lat/lng/radius), `/map/squares`, `/map/sellers/{slug}/preview` | ✅ |
| Final QA / closed testing | process — not backend | ✅ |

**M4 verdict:** social/squares/chat/maps are ✅. **Two real gaps:** (1) **push
notifications** have no backend — this is the biggest single item in the whole build;
(2) **Dasah's chat endpoint** needs confirming — lots of AI *context/RAG* plumbing
exists, but the actual "user sends a message, assistant replies" route for the in-app
assistant isn't clearly exposed. Pin both down before M4 scope is locked.

---

## Summary of what to resolve (ranked)

1. **🔴 Push notifications** — decide now: build FCM device-registration + sender, or
   ship M1–M4 with in-app/SSE notifications only and add push later. Affects M1 architecture
   and M4 delivery; do **not** let it sit unscoped.
2. **🔴 API versioning** — lock a scheme before M1 so his app survives backend changes.
3. **🟡 Dasah AI assistant** — confirm/identify the conversational endpoint, or scope it.
4. **🟡 PayPal** — verify it works in production or reduce M3 to Paystack + POD.
5. **🟡 Native OAuth (PKCE)** — confirm approach during M1.
6. **🟡 Seller analytics depth, order-tracking timeline, chat-unread** — confirm payloads meet UI needs.
7. **⚠️ Seller `{id}`/slug convention** — document per route (underway).

> Recommended: attach this matrix to each milestone's acceptance criteria. For any
> 🟡/🔴 row, agree in writing whether it's **in scope (you build the backend first)**,
> **de-scoped**, or **deferred** — so a missing endpoint never becomes a milestone dispute.

---

## Does completing the 4 milestones make v1 "complete"?

**Short answer:** the milestones complete the feature *vision* (feature-complete,
closed-testing depth — Samuel's own framing). They do **not**, by themselves,
produce a **store-launchable** app. Three things sit between "milestones done" and
"v1 you can ship":

1. **It only *functions* if the backend gaps are filled.** The milestones *consume*
   push, versioning, PayPal and the Dasah endpoint — they don't *build* them. A
   milestone can pass on the mobile side while the feature still doesn't work because
   the server side isn't there. These are MarketX's track, not the contractor's.
2. **"Closed-testing depth" ≠ launch-grade.** Even at 100% completion the output is a
   beta build for internal/closed testers, not a polished, compliant public release.
3. **Launch-readiness is unscoped on both sides** — see the checklist below. Most of
   it is neither a backend feature nor in the milestone list, so it has no owner yet.

### Two parallel tracks

| Track | Owner | Items |
|---|---|---|
| **Mobile build** | Contractor | The 4 milestones (this contract). |
| **Backend readiness** | MarketX | 🔴 push/FCM device-registration + sender · 🔴 API versioning · 🔴 **block-user endpoint** · 🟡 confirm PayPal · 🟡 confirm Dasah conversational endpoint · 🟡 native-OAuth (PKCE) support. Must land **before/alongside** the milestone that needs them. |

### Launch-readiness checklist (needs an owner before public release)

| Item | Status | Notes |
|---|---|---|
| **User blocking** | 🔴 missing | Only **reporting** exists (`POST /api/reports`). Apple Guideline 1.2 / Google UGC policy **require both report *and* block** for UGC apps → **store rejection** without it. Backend + UI. |
| Content reporting | ✅ | `POST /api/reports` exists. |
| Account deletion | ✅ | `DELETE /profile` exists (store requirement met). |
| Store assets & compliance | 🔴 | Privacy-policy URL, app-privacy "nutrition label", age rating, screenshots, listings. |
| Data privacy (NDPR / GDPR) | 🟡 | Consent, data export/delete flows — confirm coverage. |
| Crash reporting / observability | 🔴 | Crashlytics/Sentry — cannot run closed testing blind. |
| Deep links / share-to-app | 🔴 | Universal/App links for shared posts & products. |
| Permission priming | 🔴 | Location (maps), notifications (push), camera (media) onboarding. |
| Localization (i18n) | 🟡 | Web supports 7 languages — decide if mobile v1 is English-only. |

### Recommended definition of v1 (for the contract)

- **This contract's finish line = feature-complete app passing closed testing**, with
  the backend-readiness track delivered for every in-scope feature.
- **Public store launch = a separate phase 2** (blocking UI, store compliance, crash
  reporting, NDPR, store assets). Matches Samuel's "closed testing" framing and keeps
  this scope clean.
- For every 🔴/🟡 above, record in writing: **in scope · de-scoped · deferred to phase 2.**
