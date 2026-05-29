# Commerce Audit Tasks — June 2026

> **Pillar:** Commerce — Money, orders, payments, shipping, seller ops
> **Theme:** Every penny counts. Audit all money-touching flows first.
> **Goal:** A buyer can discover products, add to cart, check out (card or POD), receive confirmation, and a seller can fulfil. Every failure mode is handled, logged, and surfaced correctly.
> **Deadline:** June 30, 2026
> **Owner:** Mapida Ishaya (execution) · Joshua Akibu (review + Paystack/PayPal keys)

---

## P0 — Cart & Checkout

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Guest adds to cart | P0 | Mapida | API + E2E | Cart ID collision | passed with evidence | June 30 | 20/20 tests pass. Fixed: NaN variantId→400, validate try-catch, syncGuestCart double-sync |
| Authenticated user adds to cart | P0 | Mapida | API | Merge on login | passed with evidence | June 30 | Same route — covered by CRUD suite. Upsert increments quantity correctly |
| Update cart quantity | P0 | Mapida | API | Stock race condition | passed with evidence | June 30 | Auth guard, PATCH quantity bounds, stock-race test (qty > stock → 400) all pass. 21 tests total |
| Remove item from cart | P0 | Mapida | API | Stale UI | passed with evidence | June 30 | Auth guard + CRUD suite: delete → 200, follow-up GET confirms item absent |
| Guest cart merges on login | P0 | Mapida | API | Item duplication | passed with evidence | June 30 | No /merge endpoint — syncGuestCartToServer reuses POST /api/commerce/cart per item (upsert). Idempotency test covers double-add. Fixed double-sync bug in composable |
| Checkout email field pre-fill | P0 | Mapida | Manual UI | Fake TLD bypass | not started | June 30 | Client-only check |
| Shipping rate selection | P0 | Mapida | API | Zone mismatch | not started | June 30 | `POST /api/commerce/shipping/calculate` |
| Initialize card payment | P0 | Joshua | API + E2E | Paystack email, duplicate ref | not started | June 30 | `POST /api/commerce/payments/initialize` |
| Initialize POD payment | P0 | Mapida | API | POD zone eligibility | not started | June 30 | `POST /api/commerce/payments/pod-initialize` |
| Verify card payment return | P0 | Joshua | API | Replay, ref mismatch | not started | June 30 | `POST /api/commerce/payments/verify` |
| Verify POD payment return | P0 | Joshua | API | Shipping-only amount | not started | June 30 | `POST /api/commerce/payments/pod-verify` |
| Paystack webhook | P0 | Joshua | API | Signature, duplicate event | not started | June 30 | Needs Paystack CLI / ngrok — DEFERRED |
| PayPal create order | P0 | Joshua | API | Sandbox config | not started | June 30 | `POST /api/commerce/payments/paypal/create` — DEFERRED |
| PayPal capture | P0 | Joshua | API | Duplicate capture | not started | June 30 | `POST /api/commerce/payments/paypal/capture` — DEFERRED |
| Order confirmation email | P0 | Mapida | API + Manual | Template, delivery | not started | June 30 | Queue / Resend |

---

## P0 — Orders

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Buyer views own orders | P0 | Mapida | API | Other buyer's orders (IDOR) | not started | June 30 | `GET /api/commerce/orders` |
| Buyer views order detail | P0 | Mapida | API | IDOR | not started | June 30 | `GET /api/commerce/orders/:id` |
| Buyer cancels order | P0 | Mapida | API | Post-paid cancel | not started | June 30 | `POST /api/commerce/orders/:id/cancel` |
| Buyer confirms receipt | P0 | Mapida | API | Premature confirm | not started | June 30 | `POST /api/commerce/orders/:id/confirm-receipt` |
| Buyer refuses delivery (POD) | P0 | Mapida | API | State transition integrity | not started | June 30 | `POST /api/commerce/orders/:id/refuse-delivery` |
| Seller views store orders | P0 | Mapida | API | Other seller's orders | not started | June 30 | `GET /api/seller/orders` |
| Seller updates order status | P0 | Mapida | API | Invalid transition | not started | June 30 | `PATCH /api/commerce/orders/:id/status` |
| Seller marks order shipped | P0 | Mapida | API + Manual | Tracking number | not started | June 30 | Via shipping provider |

---

## P1 — Products & Inventory

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Seller creates product | P1 | Mapida | API + E2E | Media upload, variants | not started | June 30 | `POST /api/commerce/products` |
| Seller edits product | P1 | Mapida | API | Ownership check | not started | June 30 | `PATCH /api/commerce/products/:id` |
| Seller deletes/archives product | P1 | Mapida | API | Soft vs hard delete | not started | June 30 | `DELETE /api/commerce/products/:id` |
| Product variant management | P1 | Mapida | API | Stock integrity | not started | June 30 | `POST/PATCH/DELETE /api/commerce/products/:id/variants` |
| Product goes out of stock at checkout | P1 | Mapida | API | Oversell race condition | not started | June 30 | Inventory check at order creation |
| Buyer leaves product review | P1 | Mapida | API | Not-purchased check | passed with evidence | June 30 | `eligibility.get.ts` fixed — `profileId` → `userId` |
| Rating aggregation | P1 | Mapida | API | Stale after edit/delete | not started | June 30 | `GET /api/commerce/products/:id` |

---

## P1 — Shipping

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Calculate shipping rates | P1 | Mapida | API | Zone not found | passed with evidence | June 30 | `shipping.spec.ts` passing |
| List shipping zones | P1 | Mapida | API | Stale zones | not started | June 30 | `GET /api/commerce/shipping/zones` |
| Create shipment | P1 | Mapida | API | Shippo/Sendbox failure | not started | June 30 | `POST /api/commerce/shipping/shipments` |
| Track shipment | P1 | Mapida | API | Provider down | not started | June 30 | `GET /api/commerce/shipping/track/:id` |
| Shipping webhook | P1 | Mapida | API | Signature verification | not started | June 30 | `POST /api/webhooks/shipping` |

---

## P1 — Wallet & Payouts

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Seller views wallet | P1 | Mapida | API | Other seller's wallet (IDOR) | not started | June 30 | `GET /api/commerce/wallet/store/:storeSlug` |
| Payout preview | P1 | Mapida | API | Fee calculation accuracy | not started | June 30 | `GET /api/commerce/wallet/payout-preview` |
| Withdraw request | P1 | Joshua | API | Double-withdraw, KYC | not started | June 30 | `POST /api/commerce/wallet/withdraw` |
| Buyer wallet state | P1 | Mapida | API | N/A | not started | June 30 | `GET /api/commerce/wallet` |

---

## P1 — Affiliate

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Seller enrolls in affiliate | P1 | Mapida | API | Idempotency | not started | June 30 | `POST /api/commerce/affiliate/enroll` |
| Affiliate link applied at checkout | P1 | Mapida | API | Code validation, expiry | not started | June 30 | `affiliateCode` query param |
| Affiliate stats | P1 | Mapida | API | Other seller's stats (IDOR) | not started | June 30 | `GET /api/commerce/affiliate` |

---

## UI/UX Checklist — Checkout Page

`layers/commerce/app/pages/checkout.vue`

- [ ] Email field pre-fills for real account emails, blank for fake TLDs
- [ ] Shipping zone selector loads and updates cost correctly
- [ ] Card payment button redirects to Paystack URL
- [ ] POD button only appears when seller supports POD for buyer's zone
- [ ] POD summary shows shipping cost + product amount separately
- [ ] Loading states on all async actions (no double-submit possible)
- [ ] Error toast on Paystack/POD failure shows real message
- [ ] Responsive: mobile, tablet, desktop

## UI/UX Checklist — Cart Drawer

- [ ] Quantity +/- updates persist
- [ ] Remove item leaves no ghost row
- [ ] Empty cart shows empty state
- [ ] Cart badge count syncs after add/remove
- [ ] Guest cart survives page refresh (localStorage)

## UI/UX Checklist — Product Pages

- [ ] Variant selector updates price and stock
- [ ] "Add to Cart" disables when out of stock
- [ ] Image gallery keyboard-navigable
- [ ] Reviews section shows correct aggregate rating
- [ ] "Write a review" only visible to buyers with a confirmed order

## UI/UX Checklist — Seller Dashboard (Orders)

- [ ] Order list filtered correctly to own store only
- [ ] Status update transitions: pending → processing → shipped → delivered
- [ ] Cannot transition to invalid states (e.g. delivered → pending)
- [ ] Bulk actions (if any) respect ownership

## UI/UX Checklist — Seller Dashboard (Products)

- [ ] Create product wizard complete (media, variants, pricing, description)
- [ ] AI listing enhancement usable from create/edit flow
- [ ] Edit persists all field changes
- [ ] Archive/delete confirmation required
- [ ] Product visible in store immediately after publish

---

## E2E Test Targets (Playwright) — Priority Order

1. Guest adds product to cart → logs in → cart merges → checks out with Paystack → returns to confirmation page
2. Authenticated buyer completes POD checkout → confirmation page shows shipping + product totals
3. Seller creates a product with variants → product appears on store page
4. Seller updates order status: pending → processing → shipped
5. Buyer confirms receipt → order closes → review prompt appears

---

## Security Focus (June)

| Check | Route / Area | Risk |
|-------|-------------|------|
| Paystack webhook HMAC-SHA512 signature | `POST /api/webhooks/paystack` | Unsigned webhooks accepted |
| PayPal capture amount verification | PayPal capture route | Amount mismatch before capture |
| Order IDOR | `GET /orders/:id` | `order.userId !== user.id` |
| Seller IDOR | All `/api/seller/*` routes | `seller.profileId !== user.id` |
| Affiliate code validation | Checkout | Invalid/expired code applying discount |
| Cart merge integrity | `POST /api/commerce/cart/merge` | Item duplication or silent drops |

---

## Definition of Done — June 30, 2026

- [ ] Every P0 commerce flow has API integration test coverage
- [ ] Every P0 commerce flow has been manually tested end-to-end
- [ ] Paystack card + POD flows tested in Paystack test mode
- [ ] Paystack webhook tested via Paystack CLI or ngrok
- [ ] PayPal sandbox flows tested
- [ ] Checkout UI passes mobile + desktop manual review
- [ ] All known bugs logged with reproduction steps
- [ ] No P0 flows with "not started" audit status
