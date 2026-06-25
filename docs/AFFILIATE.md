# Affiliate / Referral System

How MarketX's affiliate program works end to end — enrollment, link sharing, attribution, checkout, commission, and payout — plus the known brittle points. Last reviewed 2026-06.

> **Model in one line:** any user can become an affiliate, share a `?ref=CODE` link to a product that has a seller-set **flat ₦ commission**, and earn that commission (per unit) when a buyer they referred completes an order. Attribution is **last-click, 30-day, client-side (localStorage)**.

---

## 1. Lifecycle (start → checkout → payout)

1. **Enroll** — `AffiliateTab` → `useAffiliate.enroll()` → `POST /api/commerce/affiliate/enroll`. The user's profile gets an `affiliateCode`. Tapping "Copy link" while not enrolled **auto-enrolls** first.
2. **Seller sets a commission** — a product gets `affiliateCommission` (a flat **₦ amount per unit**, set by the seller at create/edit; e.g. the QuickProductModal "Affiliate Commission" field). Only products with `affiliateCommission > 0` from **other** sellers appear in an affiliate's "available products" list.
3. **Affiliate shares a link:**
   - **Product link:** `${origin}/product/${slug}?ref=${affiliateCode}` (copied from the available list or the product page).
   - **Generic link:** `${origin}/?ref=${affiliateCode}` (the dashboard's "Your Link").
4. **Buyer clicks** → lands with `?ref=CODE`. `captureAffiliateRef()` reads `route.query.ref`, validates it (`/^[a-z0-9_-]{1,64}$/`), and stores it in **localStorage** (`mx_affiliate_ref`, + `mx_affiliate_ref_exp`) with a **30-day TTL**. Captured **globally** on every page (see plugin in §5) — last ref wins (last-click).
5. **Buyer checks out** — `checkout.vue` calls `getStoredRef()` and includes `affiliateCode` in the order payload. Payment-init endpoints all accept it: `payments/initialize`, `payments/paypal/create`, `payments/pod-initialize`.
6. **Order placement** — `order.service.placeOrder`:
   - Resolves `affiliateCode` → `affiliateUserId` via `affiliateRepository.findByCode`.
   - **Ignores self-referral** (affiliate === buyer → no commission).
   - Per line item: `affiliateCut = round(product.affiliateCommission × quantity × 100)` **kobo** (so `affiliateCommission` is stored in **naira**). Sums to `totalAffiliateCut`; the attribution is persisted on the order.
   - `clearStoredRef()` clears the stored ref after a successful order.
7. **Commission & payout** — the conversion appears in the affiliate's "Your Conversions" with a status. Earnings move from **pending → paid** as the order progresses; status labels: `PENDING`="Awaiting payment", `CONFIRMED`="Seller confirmed", `SHIPPED`="In transit", **`DELIVERED`="Paid out"**, `CANCELLED`/`RETURNED`/`FAILED`. Stats (`totalEarnings`, `pendingEarnings`, `totalConversions`) come from the affiliate status endpoint.

---

## 2. Commission model
- **Flat ₦ per unit**, not a percentage. `affiliateCommission` is a naira amount on the product, set by the seller.
- Computed **at checkout from the product's current value** — if the seller changes the rate after a link is shared, the buyer's order uses the **current** rate (the UI warns "rate set by seller · may change").
- Recorded referral `commission` is in **kobo** (÷100 for ₦); the product field is in **naira**. (UI: `formatPrice` for the product rate, `formatKobo` for recorded commissions.)

## 3. Attribution mechanics
- **Last-click, 30-day**, persisted in **three durability tiers** (all keyed off the same `?ref`):
  1. **Client `localStorage`** (`mx_affiliate_ref` + `_exp`) — captured globally by `affiliate-ref.client.ts`, sent in the checkout body.
  2. **Server HTTP-only cookie** (`mx_affiliate_ref`) — set by `server/middleware/affiliate-ref.ts` on any request with a valid `?ref`. XSS-safe, JS-independent, survives cleared localStorage (**same browser**).
  3. **Redis account binding** (`affiliate:ref:<userId>`) — if the visitor is **logged in** when they click, the same middleware binds the ref to their userId. This follows them **across devices** on the same account. (The middleware verifies the JWT itself because `auth.global` only populates `event.context.user` for `/api` routes, while `?ref` lands on page routes.)
- At order time the endpoints call **`await resolveAffiliateCode(event, body.affiliateCode)`**, resolving most-specific first: **body code → cookie → account-bound Redis ref**.
- Codes validated against `/^[a-z0-9_-]{1,64}$/`; localStorage expiry enforced on read; client ref cleared after a successful order.
- Self-referrals are ignored at order time.

---

## 4. API surface
| Endpoint | Purpose |
|---|---|
| `POST /api/commerce/affiliate/enroll` | Become an affiliate (issues `affiliateCode`) |
| `GET /api/commerce/affiliate` | Status: `isEnrolled`, `affiliateCode`, `stats` |
| `GET /api/commerce/affiliate/available-products` | Other sellers' products with `affiliateCommission > 0` (returns `bannerImageUrl` + media `type` for thumbnails) |
| `GET /api/commerce/affiliate/referrals` | The affiliate's conversions (paged) |
| `GET /api/commerce/affiliate/promoters` | (Seller) people promoting my products |
| `GET /api/commerce/affiliate/seller-products` | (Seller) my products being affiliated + revenue |
| `payments/{initialize,paypal/create,pod-initialize}` | Accept `affiliateCode` to attribute the order |

## 5. Key files
```
layers/commerce/app/composables/useAffiliate.ts          enroll, captureAffiliateRef, getStoredRef, clearStoredRef (localStorage attribution)
layers/commerce/app/plugins/affiliate-ref.client.ts      GLOBAL ?ref capture on every route (so the generic /?ref link attributes)
layers/commerce/app/stores/affiliate.store.ts            affiliate state
layers/commerce/app/services/affiliate.api.ts            client API
layers/profile/app/components/profile/tabs/AffiliateTab.vue   the dashboard UI (enroll, link, conversions, available products)
layers/commerce/server/api/commerce/affiliate/*          enroll / status / available-products / referrals / promoters / seller-products
layers/commerce/server/services/affiliate.service.ts     server logic
layers/commerce/server/repositories/affiliate.repository.ts  findByCode, etc.
layers/commerce/server/services/order.service.ts         placeOrder → resolves affiliateCode, computes per-line affiliateCut
server/middleware/affiliate-ref.ts                       sets ?ref cookie + binds ref to userId in Redis (cross-device)
server/utils/affiliate-ref.ts                            resolveAffiliateCode() — body → cookie → Redis account ref
layers/core/app/utils/cloudinary.ts                      productThumb() — video-safe product thumbnail resolver
```

---

## 6. Known brittle points / limitations
1. **Cross-device works only for logged-in clicks.** If the buyer is **logged in when they click**, the ref is bound to their account in Redis and follows them to any device (*fixed 2026-06*). The remaining gap: an **anonymous** click followed by a purchase on a **different** device — there's no identity at click time to bind to, so it falls back to the per-browser cookie/localStorage and is lost across devices. (Unavoidable without identifying the visitor at click; acceptable since the highest-intent buyers are usually logged in.)
2. **Commission snapshot is at checkout, not at share** — sellers can lower the rate after an affiliate has promoted (mitigated only by the "may change" notice). *Future:* snapshot the rate into the referral at click time if fairness matters.
3. **Generic `/?ref=` link didn't attribute** — *fixed (2026-06):* `affiliate-ref.client.ts` now captures `?ref` on every page, not just product/checkout/seller-profile.
4. **Video covers showed broken thumbnails** in the affiliate list — *fixed (2026-06):* `available-products` now returns `bannerImageUrl` + media `type`, and the UI uses `productThumb()` (still poster → `videoThumb` for video covers → image), instead of putting a `.mp4` URL into an `<img>`.

## 7. Recent fixes (2026-06)
- **Video thumbnail** in the affiliate marketplace (`productThumb` resolver + server now returns `type`/`bannerImageUrl`).
- **Global `?ref` capture** so the dashboard's generic link actually attributes.
- **Server-side HTTP-only `?ref` cookie** (`server/middleware/affiliate-ref.ts` + `server/utils/affiliate-ref.ts`) with a checkout fallback (`resolveAffiliateCode`) wired into all four order/payment endpoints (direct order, card, POD, PayPal) — attribution now survives cleared/blocked localStorage.
- **Cross-device account binding** — the same middleware verifies a logged-in visitor's token and stores the ref in **Redis** under their `userId` (`affiliate:ref:<userId>`, 30-day TTL); `resolveAffiliateCode` now reads body → cookie → account ref (async). A referral placed on a different device, same account, is now credited.
