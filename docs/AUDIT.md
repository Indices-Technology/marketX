# MarketX Pre-Production Audit Playbook

**Testing window:** June 1 – August 31, 2026  
**Current baseline:** 385/385 API tests passing · 5/5 E2E smoke passing  
**Goal:** Production confidence across all three pillars — Commerce, Social, AI

---

## Pillars

| Month | Pillar | Priority |
|-------|--------|----------|
| June | Commerce | Money, orders, payments, shipping, seller ops |
| July | Social | Identity, feed, messaging, discovery, community |
| August | AI + Admin + Pre-Prod | Intelligence, guard rails, security, performance |

Each pillar covers: API correctness · UI/UX polish · E2E flows · Security · Performance

---

## Audit Principles

- Audit by flow, not by file.
- Prioritize money, auth, permissions, and state transitions before UI polish.
- Verify both happy paths and failure paths.
- Prefer evidence over confidence. A flow is not "done" until it has reproducible checks.
- Add tests around existing behavior before large refactors in risky areas.
- Treat AI-generated code as untrusted until validated by tests and ownership checks.

---

## What Counts As A Flow

A flow is one end-to-end behavior with a clear business outcome spanning:

1. Page or component
2. Client composable/store/service
3. API route
4. Server service/repository
5. Prisma writes/reads
6. Queue, email, webhook, or third-party side effect

---

## Per-Flow Audit Checklist

Run this for every P0 and P1 flow.

### Entry Point
- Route/page is discoverable and linked correctly
- Protected UI is not client-gated only
- Flow cannot be double-submitted by refresh or double-click
- Loading, disabled, error, and retry states are present

### Client Behavior
- Composable/store calls the correct endpoint
- Auth headers and tokens are used correctly
- Optimistic updates are reversible on failure
- Stale client state does not persist after login/logout
- Query params, redirect params, and route params are validated

### API Contract
- Input is validated server-side with Zod
- H3 error passthrough is present in every catch block
- ZodError is caught and returns 400
- UserError is caught and returns the correct status
- Method and route semantics are correct
- Unsafe defaults are not accepted silently

### Authorization
- Cannot access another user's resource by changing an ID or slug
- Buyer cannot perform seller-only actions
- Seller cannot mutate another seller's product or order
- Admin/internal endpoints are not accidentally public

### Business Logic
- Totals, fees, currency, stock, and status transitions are correct
- Duplicate requests are idempotent or safely rejected
- Order and payment states cannot be corrupted by retries
- Deletes are soft/hard as intended
- Partial failures are handled explicitly

### Persistence
- Prisma writes happen exactly once
- Transactions are used where needed
- Relations are loaded and updated consistently
- Race conditions are handled

### Background Work
- Audit, notification, and email jobs are enqueued correctly
- Redis unavailability does not break correctness
- Queue failure does not corrupt the main request
- Job retry is safe for duplicate delivery

### External Integrations
- Provider input is validated before sending
- Secrets are used safely via runtimeConfig only
- Webhook authenticity is verified
- Timeout, 4xx, 5xx, and duplicate callbacks are handled
- Provider IDs are stored for reconciliation

### Security
- CSRF protections are correct for cookie-based flows
- Tokens are not leaked into logs or URLs
- User-controlled strings are sanitized before render or persistence
- Rate limits exist for auth and abuse-prone endpoints
- Sensitive actions are recorded in audit logs

### Observability
- Failures are visible in production logs
- Structured logging with correlation IDs is present
- Audit logs record who did what, to which resource, and when
- External provider failures are actionable

---

## Evidence Standard

A flow is audited when it has at least one of:

- Automated test coverage with meaningful assertions
- Documented manual test with exact steps and observed result
- Code references proving auth, validation, and side effects were checked
- Recorded bug with reproduction and impact

Do not mark a flow complete from reading code alone.

---

## Test Pyramid

Use the cheapest reliable layer first.

### Unit
Fee calculations, formatting helpers, auth utilities, pure validation, state transition helpers.

Good targets: `server/utils/fees.ts`, `server/utils/auth/passwordValidator.ts`, `server/utils/security/*`

### Service / Integration
Business logic exercised without the browser. Order creation rules, ownership enforcement, inventory checks, shipment selection, audit trigger expectations.

### API Integration (main investment for P0/P1)
Each critical endpoint needs: success · invalid input · unauthenticated · unauthorized · not found · duplicate/replay · third-party failure · DB side effects.

### Browser E2E
Focused on the critical user journeys only. Do not e2e-test everything — pick the 8–10 flows that must not break in production.

---

## Failure Modes To Hunt Aggressively

- Endpoint missing `requireAuth(event)`
- Ownership check done in UI but not in API
- Duplicate order/payment creation from retry or refresh
- Webhook accepted without signature verification
- Cart merge that drops or duplicates items
- Status transitions that skip required states
- Race conditions around stock/order confirmation
- Inconsistent currency handling between client and server
- Silent catch blocks hiding real failures
- Queue fallback behavior changing semantics
- Optimistic UI that never rolls back
- Stale auth store after refresh/logout
- AI/user content rendered without sanitization
- H3 error swallowed — `requireAuth()` 401 becoming 500

---

---

# Month 1 — June: Commerce

**Theme:** Every penny counts. Audit all money-touching flows first.

**Goal:** A buyer can discover products, add to cart, check out (card or POD), receive confirmation, and a seller can fulfill. Every failure mode is handled, logged, and surfaced correctly.

---

## Commerce Flows

### P0 — Cart & Checkout

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Guest adds to cart | `/` product page | `POST /api/commerce/cart` | cart ID collision | passed with evidence |
| Authenticated adds to cart | product page | `POST /api/commerce/cart` | merge on login | passed with evidence |
| Update cart quantity | cart drawer | `PATCH /api/commerce/cart/:id` | stock race | passed with evidence |
| Remove from cart | cart drawer | `DELETE /api/commerce/cart/:id` | stale UI | passed with evidence |
| Guest cart merges on login | login flow | client-side `syncGuestCartToServer()` → `POST /api/commerce/cart` per item | item duplication | passed with evidence |
| Checkout email field pre-fill | checkout.vue | client only | fake TLD bypass | passed with evidence |
| Shipping rate selection | checkout.vue | `POST /api/commerce/shipping/calculate` | zone mismatch | passed with evidence |
| Initialize card payment | checkout.vue | `POST /api/commerce/payments/initialize` | Paystack email, duplicate ref | passed with evidence |
| Initialize POD payment | checkout.vue | `POST /api/commerce/payments/pod-initialize` | POD zone eligibility | passed with evidence |
| Verify card payment return | `/checkout/return` | `POST /api/commerce/payments/verify` | replay, ref mismatch | passed with evidence |
| Verify POD payment return | `/checkout/return` | `POST /api/commerce/payments/pod-verify` | shipping-only amount | passed with evidence |
| Paystack webhook | internal | `POST /api/webhooks/paystack` | signature, duplicate | passed with evidence |
| PayPal create | checkout.vue | `POST /api/commerce/payments/paypal/create` | sandbox config | passed with evidence |
| PayPal capture | return page | `POST /api/commerce/payments/paypal/capture` | duplicate capture | blocked by environment |
| Order confirmation email | post-payment | queue / Resend | template, delivery | passed with evidence |

### P0 — Orders

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Buyer views own orders | `/orders` | `GET /api/commerce/orders` | other buyer's orders | passed with evidence |
| Buyer views order detail | `/orders/:id` | `GET /api/commerce/orders/:id` | IDOR | passed with evidence |
| Buyer cancels order | order detail | `POST /api/commerce/orders/:id/cancel` | post-paid cancel | passed with evidence |
| Buyer confirms receipt | order detail | `POST /api/commerce/orders/:id/confirm-receipt` | premature confirm | passed with evidence |
| Buyer refuses delivery (POD) | order detail | `POST /api/commerce/orders/:id/refuse-delivery` | state transition | passed with evidence |
| Seller views store orders | seller dashboard | `GET /api/commerce/orders/seller` | other seller's orders | passed with evidence |
| Seller updates order status | seller dashboard | `PATCH /api/commerce/orders/:id/status` | invalid transition | passed with evidence |
| Seller marks order shipped | seller dashboard | `PATCH /api/commerce/orders/:id/status` (status: SHIPPED) | tracking number | passed with evidence |

### P1 — Products & Inventory

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Seller creates product | seller dashboard | `POST /api/commerce/products` | media upload, variants | not started |
| Seller edits product | seller dashboard | `PATCH /api/commerce/products/:id` | ownership check | not started |
| Seller deletes/archives product | seller dashboard | `DELETE /api/commerce/products/:id` | soft vs hard delete | not started |
| Product variant management | product edit | `POST/PATCH/DELETE /api/commerce/products/:id/variants` | stock integrity | not started |
| Product goes out of stock | checkout | inventory check at order creation | oversell | not started |
| Buyer leaves product review | post-confirmed order | `POST /api/commerce/products/:id/reviews` | not purchased check | not started |
| Rating aggregation | product page | `GET /api/commerce/products/:id` | stale after edit/delete | not started |

### P1 — Shipping

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Calculate shipping rates | checkout | `POST /api/commerce/shipping/calculate` | zone not found | not started |
| List shipping zones | checkout | `GET /api/commerce/shipping/zones` | stale zones | not started |
| Create shipment | seller fulfils | `POST /api/commerce/shipping/shipments` | Shippo/Sendbox failure | not started |
| Track shipment | order detail | `GET /api/commerce/shipping/track/:id` | provider down | not started |
| Shipping webhook | internal | `POST /api/webhooks/shipping` | signature | not started |

### P1 — Wallet & Payouts

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Seller views wallet | seller dashboard | `GET /api/commerce/wallet/store/:storeSlug` | other seller's wallet | not started |
| Payout preview | seller dashboard | `GET /api/commerce/wallet/payout-preview` | fee calculation | not started |
| Withdraw request | seller dashboard | `POST /api/commerce/wallet/withdraw` | double-withdraw, KYC | not started |
| Seller wallet balance (aggregate) | account | `GET /api/commerce/wallet` | N/A | not started |
| Buyer wallet balance | account | `GET /api/commerce/buyer-wallet` | auth guard | passed with evidence |
| Buyer wallet transactions | account | `GET /api/commerce/buyer-wallet/transactions` | pagination, auth | passed with evidence |
| POD seller wallet pre-check | cart / checkout | `GET /api/commerce/cart` → `cart.service` | POD offered when seller broke | passed with evidence |
| POD platform fee debit | pod-initialize | `POST /api/commerce/payments/pod-initialize` | double debit, Paystack failure | passed with evidence |
| POD platform fee refund | refuse-delivery | `POST /api/commerce/orders/:id/refuse-delivery` | fee not returned on refusal | passed with evidence |

### P1 — Affiliate

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Seller enrolls | seller dashboard | `POST /api/commerce/affiliate/enroll` | idempotency | not started |
| Affiliate link applied at checkout | checkout | affiliateCode param | code validation | not started |
| Affiliate stats | seller dashboard | `GET /api/commerce/affiliate` | other seller's stats | not started |
| Affiliate cut × quantity | order creation | `POST /api/commerce/orders` | commission not scaled by qty | passed with evidence |
| Seller net credit after affiliate | payment confirmed | `wallet.service.creditSellersOnPayment` | seller credited gross (ignoring cut) | passed with evidence |
| Per-seller promoter cut isolation | seller affiliate tab | `GET /api/commerce/affiliate/promoters` | cross-seller cut inflation | passed with evidence |
| Non-seller affiliate BuyerWallet credit | order delivered | `wallet.service.releaseFundsOnDelivery` | commission logged but not credited | passed with evidence |

---

## Commerce — UI/UX Checklist

### Checkout Page (`layers/commerce/app/pages/checkout.vue`)
- [ ] Email field pre-fills for real account emails, blank for fake TLDs
- [ ] Shipping zone selector loads and updates cost correctly
- [ ] Card payment button redirects to Paystack URL
- [ ] POD button only appears when seller supports POD for buyer's zone
- [ ] POD summary shows shipping cost + product amount separately
- [ ] Loading states on all async actions (no double-submit possible)
- [ ] Error toast on Paystack/POD failure shows real message
- [ ] Responsive: mobile, tablet, desktop

### Cart Drawer
- [ ] Quantity +/- updates persist
- [ ] Remove item leaves no ghost row
- [ ] Empty cart shows empty state
- [ ] Cart badge count syncs after add/remove
- [ ] Guest cart survives page refresh (localStorage)

### Product Pages
- [ ] Variant selector updates price and stock
- [ ] "Add to Cart" disables when out of stock
- [ ] Image gallery keyboard-navigable
- [ ] Reviews section shows correct aggregate rating
- [ ] "Write a review" only visible to buyers with a confirmed order

### Seller Dashboard — Orders
- [ ] Order list filtered correctly to own store only
- [ ] Status update transitions (pending → processing → shipped → delivered)
- [ ] Cannot transition to invalid states (e.g., delivered → pending)
- [ ] Bulk actions (if any) respect ownership

### Seller Dashboard — Products
- [ ] Create product wizard complete (media, variants, pricing, description)
- [ ] AI listing enhancement usable from create/edit flow
- [ ] Edit persists all field changes
- [ ] Archive/delete confirmation required
- [ ] Product visible in store immediately after publish

---

## Commerce — E2E Test Targets (Playwright)

Priority order:

1. Guest adds product to cart → logs in → cart merges → checks out with Paystack → returns to confirmation page
2. Authenticated buyer completes POD checkout → confirmation page shows shipping + product totals
3. Seller creates a product with variants → product appears on store page
4. Seller updates order status: pending → processing → shipped
5. Buyer confirms receipt → order closes → review prompt appears

---

## Commerce — Security Focus (June)

- Paystack webhook: HMAC-SHA512 signature must be verified before processing
- PayPal capture: verify amount matches order before capture
- Order IDOR: `GET /orders/:id` must assert `order.userId === user.id`
- Seller IDOR: all `/api/seller/*` routes must assert `seller.profileId === user.id`
- Affiliate code: validate existence and expiry before applying discount
- Cart merge: no item duplication or silent drops

---

## Commerce — Definition of Done (June 30)

- [ ] Every P0 commerce flow has API integration test coverage
- [ ] Every P0 commerce flow has been manually tested end-to-end
- [ ] Paystack card + POD flows tested in Paystack test mode
- [ ] Paystack webhook tested via Paystack CLI or ngrok
- [ ] PayPal sandbox flows tested
- [ ] Checkout UI passes mobile + desktop manual review
- [ ] All known bugs logged with reproduction steps
- [ ] No P0 flows with "not started" audit status

---

---

# Month 2 — July: Social

**Theme:** Community and identity. Audit the flows that make the platform feel alive and trustworthy.

**Goal:** A user can register, build a profile, post content, interact with others, send messages, discover stores and squares, and see a relevant feed. All permissions are enforced. No content leaks across privacy boundaries.

---

## Social Flows

### P0 — Auth & Identity

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Register new user | `/register` | `POST /api/auth/register` | duplicate email, weak password | not started |
| Login email/password | `/login` | `POST /api/auth/login` | brute force, token handling | not started |
| Logout | nav | `POST /api/auth/logout` | token not cleared | not started |
| Refresh/restore session | app init | plugin + `GET /api/auth/session` | stale token | not started |
| Verify email | email link | `GET /api/auth/verify-email` | replay, expired token | not started |
| Resend verification | account | `POST /api/auth/resend-verification` | rate limit | not started |
| Forgot password | `/forgot-password` | `POST /api/auth/forgot-password` | user enumeration | not started |
| Reset password | email link | `POST /api/auth/reset-password` | expired/replayed token | not started |
| Social OAuth redirect | `/login` | `GET /api/auth/oauth/:provider` | state param CSRF | not started |
| Social OAuth callback | provider redirect | `GET /api/auth/oauth/:provider/callback` | account linking | not started |
| Checkout OTP send | checkout | `POST /api/auth/checkout-otp/send` | rate limit | not started |
| Checkout OTP verify | checkout | `POST /api/auth/checkout-otp/verify` | expiry, replay | not started |
| Seller registration | `/sellers/create` | `POST /api/auth/register-seller` | duplicate store, ownership | not started |

### P0 — Posts & Feed

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Create post (text/image/reel) | feed | `POST /api/posts` | media upload, content type | not started |
| Edit own post | post menu | `PATCH /api/posts/:id` | ownership check | not started |
| Delete own post | post menu | `DELETE /api/posts/:id` | ownership check | not started |
| Like / unlike post | feed | `POST/DELETE /api/posts/:id/like` | duplicate like | not started |
| Comment on post | post detail | `POST /api/posts/:id/comments` | auth required | not started |
| @mention in post | post create | mentions API | notification triggered | not started |
| View home feed (guest) | `/` | `GET /api/feed` | public only | not started |
| View following feed (auth) | `/` | `GET /api/feed/following` | own content | not started |
| View profile posts | `/u/:username` | `GET /api/profile/:username/posts` | private profile | not started |
| Stories create/view/delete | feed | stories API | 24h expiry | not started |

### P1 — Messaging

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Start conversation with seller | seller profile | `POST /api/chat/conversations` | creates duplicate | not started |
| List conversations | messages page | `GET /api/chat/conversations` | other user's convos | not started |
| View conversation messages | messages/:id | `GET /api/chat/conversations/:id/messages` | IDOR | not started |
| Send message | messages/:id | `POST /api/chat/conversations/:id/messages` | Pusher/Soketi delivery | not started |
| Delete conversation | messages | `DELETE /api/chat/conversations/:id` | ownership | not started |
| Real-time message delivery | messages | Pusher channel | channel auth, fallback | not started |
| Unread badge count | nav | SSE notifications | stale count | not started |

### P1 — Notifications

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Receive real-time notification | any | SSE `/api/notifications/stream` | auth, SSE disconnect | not started |
| Mark notification read | notifications | `PATCH /api/notifications/:id` | other user's notification | not started |
| Mark all read | notifications | `PATCH /api/notifications/read-all` | bulk ownership | not started |
| Notification for order event | order update | queue | delivery guarantee | not started |
| Notification for @mention | post/comment | queue | delivery guarantee | not started |
| Notification for follow | follow action | queue | dedup | not started |

### P1 — Profile & Discovery

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| View own profile | `/u/:username` | `GET /api/profile/:username` | own vs other | not started |
| Edit profile | account settings | `PATCH /api/profile` | media upload | not started |
| Follow / unfollow user | profile | `POST/DELETE /api/profile/:username/follow` | self-follow | not started |
| View followers/following | profile | stats endpoints | private accounts | not started |
| Search users/products/stores | search bar | `GET /api/search` | ordering, type filter | not started |
| Seller profile page | `/sellers/:storeSlug` | seller profile APIs | data exposure | not started |
| Map — view seller pins | `/map` | `GET /api/map/sellers` | location privacy | not started |
| Map — filter by category/distance | `/map` | query params | radius performance | not started |

### P1 — Wall

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| View wall timeline (guest) | `/sellers/:storeSlug` | `GET /api/wall/store/:slug` | public posts visible, own posts not duplicated | not started |
| View wall timeline (auth) | `/sellers/:storeSlug` | `GET /api/wall/store/:slug` | optionalAuth returns viewer context | not started |
| Post shoutout on store wall | store profile | `POST /api/wall/store/:slug` | auth required, own wall blocked for users, 1000-char limit | not started |
| Post shoutout on user wall | `/u/:username` | `POST /api/wall/user/:slug` | cannot post on own user wall | not started |
| Delete shoutout (author) | wall post menu | `DELETE /api/wall/:type/:slug/:postId` | ownership: author only | not started |
| Delete shoutout (wall owner) | wall post menu | `DELETE /api/wall/:type/:slug/:postId` | ownership: wall owner can remove any shoutout | not started |
| Wall shoutout notification | post action | notification queue | `WALL_SHOUTOUT` type delivered to wall owner | not started |
| Wall filter pill — Products | store profile | client-side filter | products tab still calls correct API | not started |

### P1 — Squares

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Browse squares | `/squares` | `GET /api/squares` | public | not started |
| View square profile + feed | `/squares/:slug` | square APIs | member-only content leak | not started |
| Join square (seller/buyer) | square page | `POST /api/squares/:slug/join` | eligibility | not started |
| Leave square | square page | `POST /api/squares/:slug/leave` | chairman cannot leave | not started |
| Square admin posts announcement | square admin | announcements API | role check | not started |
| Square officer management | square admin | officers API | chairman-only | not started |

---

## Social — UI/UX Checklist

### Auth Pages
- [ ] Register: password strength indicator, email already taken error
- [ ] Login: wrong password shows correct error (not 500), redirect after login works
- [ ] Forgot/Reset: expired link shows clear error, not generic 500
- [ ] Social OAuth: redirect URI shows correct provider branding

### Feed & Posts
- [ ] Post composer: image/video upload progress visible
- [ ] Post card: like animation, comment count updates without full reload
- [ ] @mention autocomplete works in post composer and comments
- [ ] Story bar scrolls horizontally on mobile
- [ ] Reel (video post) auto-plays in viewport, pauses on scroll-out
- [ ] Following feed visible only to logged-in users
- [ ] Feed skeleton loads correctly before data arrives

### Messaging
- [ ] Conversation list shows last message preview and timestamp
- [ ] Unread count badge appears and clears correctly
- [ ] Message input supports multiline, sends on Enter (desktop) / button (mobile)
- [ ] New message appears instantly via Pusher without page reload
- [ ] Fallback: if Pusher is unavailable, send still works (just not real-time)

### Seller Profile (`/sellers/:storeSlug`)
- [ ] Wall timeline loads on page mount (infinite scroll, 20-post pages)
- [ ] Filter pills (All · Products · Reviews · About) switch content without full reload
- [ ] Shoutout composer visible only to logged-in non-owners
- [ ] Posting a shoutout prepends it to the wall feed immediately (optimistic)
- [ ] Deleting a shoutout removes it from the wall feed immediately (optimistic)
- [ ] Message Store button creates conversation and navigates
- [ ] Follow button updates count immediately (optimistic)
- [ ] Products tab paginates correctly
- [ ] About, Reviews tabs load independently
- [ ] Profile banner shows Picsum fallback when `store_banner` is null
- [ ] Wall posts do NOT appear in the home feed or following feed

### Map
- [ ] Location permission prompt on first visit
- [ ] Seller pins cluster correctly at low zoom
- [ ] Bottom sheet / side panel opens on pin click
- [ ] Filter controls (category, open-now, distance) update pins without full reload
- [ ] "Selling now" inline feed syncs with map viewport

### Squares
- [ ] Square list page shows banner (Picsum fallback when bannerUrl is null)
- [ ] Square detail feed mixes seller posts and products
- [ ] Join button disabled for ineligible users
- [ ] Member-only content not visible to guests

---

## Social — E2E Test Targets (Playwright)

Priority order:

1. Register → verify email → login → view feed → create post → post appears in feed
2. Buyer messages seller → conversation created → navigates to messages/:id
3. User follows seller → feed updates to include seller's posts
4. Search for product → result links to product detail page
5. Square: guest views public square → member logs in → sees member-only content

---

## Social — Security Focus (July)

- Auth: verify email tokens are single-use and expire
- Auth: password reset tokens are single-use, expire, and invalidated after use
- OAuth: state parameter is validated to prevent CSRF
- Posts: edit and delete ownership enforced server-side
- Notifications: mark-read and fetch scoped to `user.id` only
- Messaging: conversation access requires participant membership
- Map: seller location data must not expose precise coordinates to unauthenticated requests
- @mentions: no XSS vector through unsanitized mention rendering
- Squares: member-only content API must check membership server-side

---

## Social — Definition of Done (July 31)

- [ ] Auth P0 flows all have API test coverage and manual test evidence
- [ ] Feed, post, and profile flows have API test coverage
- [ ] Messaging flow tested with Soketi running
- [ ] SSE notification stream tested end-to-end
- [ ] Seller profile page passes manual UI/UX review on mobile + desktop
- [ ] Map renders correctly with real location data
- [ ] All P0/P1 social flows have audit status updated
- [ ] No P0 social flows with "not started" audit status

---

---

# Month 3 — August: AI + Admin + Pre-Production

**Theme:** Intelligence, governance, and production readiness. Audit the AI layer, close security gaps, and verify the system can handle real load.

**Goal:** Dasah AI works reliably for buyers and sellers. Admin tooling is safe. The app passes a security audit. Infrastructure is ready for production traffic.

---

## AI Flows

### P0 — Dasah Chat (Buyer & Seller)

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Buyer starts Dasah conversation | any page | `POST /api/ai/chat/turn` | prompt injection, cost | not started |
| Chat maintains context (multi-turn) | chat UI | embeddings + context API | stale context, hallucination | not started |
| AI recommends products | chat response | internal query | wrong seller's products | not started |
| AI adds item to cart | chat response | `POST /api/commerce/cart` | auth required, quantity | not started |
| Seller uses Dasah in seller mode | seller dashboard | seller chat variant | seller context leak | not started |
| Guard rail triggered | any turn | `POST /api/ai/logs/guard-rail` | log persistence | not started |
| Conversation turn logged | any turn | `POST /api/ai/logs/turn` | PII in logs | not started |

### P1 — Listing Generation & Enhancement

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Generate listing from prompt | product create | `POST /api/ai/generate-listing` | prompt injection, cost | not started |
| Enhance product description | product edit | `POST /api/ai/enhance-description` | output not sanitized | not started |
| AI output applied to product form | product form | client only | unsanitized HTML | not started |
| Rate limit on AI endpoints | any | middleware | cost runaway | not started |

### P1 — AI Context & Embeddings

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Fetch AI context for session | chat init | `GET /api/ai/context` | auth required | not started |
| Embeddings generated for product | product create/edit | internal | async failure | not started |
| Search uses embeddings | search | vector query | relevance, latency | not started |

---

## AI — UI/UX Checklist

### Dasah Chat Widget (`layers/ai/app/components/dassa/Chat.vue`)
- [ ] Welcome message shows "Dasah" (not "DassaAI" or "Dassa AI")
- [ ] Input placeholder is "Ask Dasah…"
- [ ] Typing indicator (animated dots) appears while AI is generating
- [ ] Message bubbles use brand color `#e52033` for user messages
- [ ] Product cards in AI response link to correct product pages
- [ ] "Add to cart" in product card works and shows feedback
- [ ] Chat window scrolls to bottom on new message
- [ ] Error state shown when AI API fails (not blank/infinite spinner)
- [ ] Chat persists across page navigation (or resets cleanly)

### Mobile AI Chat (`layers/ai/app/components/MobileAIChat.vue`)
- [ ] Tab label shows "Dasah"
- [ ] Sign-in fallback CTA shows "Chat with Dasah"
- [ ] Keyboard does not obscure input on iOS/Android

### Seller Chat (`layers/seller/pages/seller/chat.vue` — Dassah repo)
- [ ] Avatar uses brand red background
- [ ] Send button uses brand red
- [ ] Seller context (own products) is surfaced in responses

### Listing Generation
- [ ] Generate button shows loading state during generation
- [ ] Generated content is applied to form fields (not raw HTML)
- [ ] Error message shown if generation fails
- [ ] User can edit AI-generated content before saving

---

## Admin Flows

### P0 — Admin Access Control

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Admin login | admin layer | admin auth | escalation | not started |
| Admin views users | admin dashboard | user management APIs | PII exposure | not started |
| Admin moderates content | admin dashboard | moderation APIs | false positive | not started |
| Admin views audit log | admin dashboard | audit log APIs | log integrity | not started |
| Non-admin blocked from admin routes | any | middleware | privilege escalation | not started |

---

## Pre-Production Checklist

### Security Hardening

- [ ] All environment variables in `.env.example` are documented
- [ ] No secrets in code, git history, or logs
- [ ] Rate limiting on: login, register, forgot-password, OTP send, AI endpoints
- [ ] CORS configured correctly for production domain only
- [ ] Paystack webhook: HMAC-SHA512 signature verified before processing
- [ ] PayPal webhook: signature verified before processing
- [ ] Shipping webhook: signature verified before processing
- [ ] All `requireAuth()` usages verified — no unintended public endpoints
- [ ] SQL injection: all DB access via Prisma (no raw queries with user input)
- [ ] XSS: all user-generated content sanitized before render
- [ ] Admin routes protected by admin-role middleware
- [ ] Session tokens: HttpOnly, Secure, SameSite=Strict in production

### Performance & Reliability

- [ ] Database indexes verified for common query patterns (orders by userId, products by storeSlug, etc.)
- [ ] Prisma N+1 queries identified and fixed in feed/order list endpoints
- [ ] Redis connection pool configured for production load
- [ ] Background queue (notifications, email, audit) handles Redis unavailability gracefully
- [ ] Paystack/PayPal/Shippo/Sendbox API calls have timeout limits
- [ ] Image uploads: file size limit enforced, file type validated server-side
- [ ] CDN (Cloudinary) URLs used for all media in production
- [ ] Picsum fallbacks acceptable for production or replaced with real assets

### Infrastructure

- [ ] Neon/Postgres connection string is production (not dev) database
- [ ] Resend API key is production key (not test)
- [ ] Paystack secret key is live key
- [ ] PayPal is switched from sandbox to live
- [ ] Pusher/Soketi is production cluster
- [ ] Redis is production instance (not localhost)
- [ ] All `NUXT_PUBLIC_*` vars are correct for production domain
- [ ] Callback URLs in Paystack dashboard point to production domain
- [ ] Webhook URLs in Paystack/PayPal/shipping dashboards point to production
- [ ] SSL certificate is valid and auto-renewing
- [ ] `nuxt.config.ts` has no dev-only settings leaking to production

### Observability

- [ ] Server error logs are going to a persistent sink (file or external service)
- [ ] Audit log table is populated for P0 actions (payments, order status, auth events)
- [ ] AI guard rail logs are persisted correctly
- [ ] Failed webhook calls are logged with enough context to replay
- [ ] Health check endpoint exists and returns 200

### Final E2E Regression Suite

Run the full suite before deployment:

1. Guest home loads (feed + featured products visible)
2. Register → verify email → login → profile visible
3. Product detail loads (gallery, variants, reviews)
4. Add to cart (guest) → login → cart merges → checkout → Paystack test redirect
5. Seller logs in → creates product → product visible on store page
6. Seller updates order status
7. Buyer messages seller → conversation created
8. Dasah chat: user sends message → AI responds with product card
9. Search: query returns products and stores
10. Map: seller pins visible, filter updates pins

---

## August — Definition of Done (August 31)

- [ ] All AI flows have API test coverage or documented manual test
- [ ] Dasah chat UI passes manual review on mobile + desktop
- [ ] Listing generation + enhancement tested with real Claude API key
- [ ] All guard rail and turn logs verified to persist correctly
- [ ] Admin access control verified: non-admin blocked from all admin routes
- [ ] Security checklist above is 100% checked
- [ ] Performance checklist is complete or risks documented
- [ ] Infrastructure checklist is complete for production environment
- [ ] Final E2E regression suite passes 10/10
- [ ] No P0 or P1 flows with "not started" or "bug found (unresolved)" status

---

---

# Audit Tracker

Track individual flows here. Update status as work progresses.

**Status values:** `not started` · `in progress` · `passed with evidence` · `bug found` · `blocked by environment` · `needs refactor before trust`

## Commerce Tracker

| Flow | Risk | Test Type | Status | Notes |
|------|------|-----------|--------|-------|
| Guest adds to cart | cart ID collision | API + unit | passed with evidence | 21 Playwright tests (auth guards, input validation, quantity bounds, CRUD, idempotency). Fixed: NaN variantId → 400, `validate.get.ts` missing try-catch, `syncGuestCartToServer` double-sync bug |
| Update cart quantity | stock race | API | passed with evidence | PATCH stock race test added: qty > stock → 400 + `/stock/i` message. Covers auth guard, quantity bounds, stock enforcement |
| Remove from cart | stale UI | API | passed with evidence | DELETE + follow-up GET confirms item absent. Covered in CRUD suite |
| Cart merge on login | item duplication | API + unit | passed with evidence | No `/merge` endpoint — `syncGuestCartToServer()` reuses `POST /api/commerce/cart` per item (upsert). Idempotency test covers double-add. `setItems` dedup fix prevents multi-tab localStorage collision (8 Vitest store tests) |
| Cart type safety | `any` / manual casts | code review | passed with evidence | `cart.api.ts`: all 5 methods now typed via `request<T>`. `GuestCartVariant` type added. `useCart.ts`: all `any` and manual casts removed. `getVariant()` added to `CartApiClient` to avoid Nuxt `TypedInternalResponse` stack-depth error on dynamic `$fetch` URLs |
| Checkout email pre-fill | fake TLD bypass | manual UI + API | passed with evidence | Server: FAKE_TLDS set in `initialize.post.ts` strips test/demo/local TLDs, falls back to `user_{id}@checkout.marketx.app`. UI: same FAKE_TLDS filter in `checkout.vue` `onMounted` |
| Initialize card payment | duplicate ref | API | passed with evidence | Reference is `stylex_{orderId}_{Date.now()}` — orderId + timestamp guarantees uniqueness. Auth guard, empty items, missing items covered in `payments.spec.ts` |
| Initialize POD payment | zone eligibility | API | passed with evidence | Seller `pod_enabled` + `pod_zones` check in `pod-initialize.post.ts`. Zero shippingCost → 400. Tests in `payments.spec.ts` |
| Verify card payment | replay, IDOR | API | passed with evidence | Atomic `updateMany` with `paymentStatus NOT IN (PAID, FAILED)` prevents double-credit. IDOR test added (403). Ref-not-found → 404. `payments.spec.ts` |
| POD verify — wrong endpoint bug | `verifyPayment` called for POD | bug fix | passed with evidence | Fixed `buyer/orders.vue`: `?payment=pod` now calls `verifyPOD()`, not `verifyPayment()`. Success banner shows for both `payment=success` and `payment=pod` with different copy |
| Paystack webhook | signature, duplicate | API | passed with evidence | HMAC-SHA512 verified. Missing sig → 400. Wrong sig → 401. Valid sig + unknown ref → 200 (graceful). Idempotent concurrent delivery tested. `payments.spec.ts` |
| Checkout UI — full visual flow | guest auth → delivery → shipping → payment | Playwright visual | passed with evidence | All 5 stages render correctly. Flat-rate fallback (West Africa ₦1,750) shows cleanly when seller has no ship-from address. PayPal amount ($28.59 = ₦45,750 ÷ 1,600) correct. 15/15 E2E tests pass. **⚠️ Open:** hydration mismatch console warning; skeleton ~3s before cart loads; POD button requires seed seller with `pod_enabled=true` to verify visually |
| Commerce `any` type sweep | 46 files audited | code review | passed with evidence | All `catch (error: any)` → `catch (error: unknown)` across 25 routes. `wallet.store`, `product.store`, `affiliate.store` typed with proper interfaces. `wallet.api`, `review.api`, `product.api`, `order.api` return types added. `product.repository` dynamic query objects → `Record<string, unknown>`. `order.repository` Prisma enum cast typed as `DBOrderStatus`. `order.service` Prisma query fixed to select `profileId`+`store_name` (was silently missing, seller notifications never fired) |
| Buyer order confirmation email — missing | no email on payment success | bug fix | passed with evidence | `verify.post.ts`, `pod-verify.post.ts`, `webhook.post.ts`, `paypal/capture.post.ts` all now enqueue `ORDER_CONFIRMATION` email to buyer after successful payment. Skips `@checkout.marketx.app` placeholder addresses |
| Buyer views own orders | list scoped to userId | API | passed with evidence | `getUserOrders(user.id)` — list is always scoped. Pagination fields verified. Shape test confirms status/paymentStatus present on every row |
| Buyer views order (IDOR) | GET /orders/:id cross-user | API | passed with evidence | `getOrderById` checks `order.userId !== userId` → 403. IDOR test: TEST_SELLER accessing TEST_USER's order ID → 403 |
| Buyer cancels order | post-paid cancel, IDOR | API | passed with evidence | `cancelOrder`: FORBIDDEN for non-owner, only PENDING/CONFIRMED cancellable. **Bug fixed**: CONFIRMED+PAID orders now call `walletService.reverseOrderCredit` to zero the seller's pending balance. IDOR test (seller cancels buyer's order → 403) |
| Buyer confirms receipt — IDOR & state | seller confirms for buyer, premature confirm | API | passed with evidence | `confirm-receipt`: `order.userId !== user.id` → 403. State guard: only SHIPPED/CONFIRMED → DELIVERED. IDOR test added (seller → 403). State test: PENDING/CANCELLED orders → 400 |
| Buyer refuses delivery (POD) | non-POD order, wrong state | API | passed with evidence | `refuse-delivery`: rejects non-POD with 400, state guard CONFIRMED/SHIPPED only, idempotent (RETURNED → 200). IDOR test: cross-party access + POD-only test |
| Seller views store orders — IDOR | other seller's orders | API | passed with evidence | `seller.get.ts`: `seller.profileId !== user.id` → 403. Missing `storeSlug` → 400. `sellerBreakdown` (gross/net/affiliateCut) present on every order. IDOR test: TEST_USER accessing TEST_SELLER store → 403 |
| Seller updates order status — buyer IDOR | buyer calling status PATCH | bug fix | passed with evidence | **Bug fixed**: removed `isBuyer` from auth check — endpoint is now seller-only. Buyer calling PATCH → 403. Zod rejects unknown status → 400 |
| Seller updates order status — invalid transition | DELIVERED → CONFIRMED | bug fix | passed with evidence | **Bug fixed**: `VALID_TRANSITIONS` map enforces forward-only flow: PENDING→CONFIRMED/CANCELLED, CONFIRMED→SHIPPED/CANCELLED, SHIPPED→DELIVERED. Backward transition test (DELIVERED→CONFIRMED → 400) |
| Seller creates product | media, variants | E2E | not started | |
| Out of stock at checkout | oversell race | API | not started | |
| Product review eligibility | not purchased | API | passed with evidence | `eligibility.get.ts` fixed (userId field) |
| Shipping calculate | zone not found | API | passed with evidence | `shipping.spec.ts` passing |
| Wallet withdraw | double-withdraw | API | not started | |
| Affiliate code at checkout | code validation | API | not started | |
| POD seller wallet pre-check | POD shown when seller wallet insufficient | API + unit | passed with evidence | `cart.service.ts` groups items by seller, queries `SellerWallet`, sets `podAvailable=false` if any seller can't cover 5% fee. `CheckoutPaymentMethod.vue` gate restored: `country=NG && shippingCostMajor>0 && podAvailable` |
| POD platform fee — Paystack-first ordering | wallet debited before Paystack init (stuck orders if API down) | bug fix | passed with evidence | `pod-initialize.post.ts`: Paystack init now happens before wallet debit. If Paystack fails, no wallet is touched and buyer can safely retry |
| POD platform fee refund on refused delivery | fee not returned when buyer refuses delivery | bug fix | passed with evidence | `refuse-delivery.post.ts`: queries `PLATFORM_FEE_DEBIT` txns, creates `PLATFORM_FEE_REFUND`, increments seller balance atomically in `$transaction` |
| Affiliate cut × quantity | commission not scaled by qty (flat ×1 regardless) | bug fix | passed with evidence | `order.service.ts`: `affiliateCommission × item.quantity × 100`. Playwright test: qty=2 order has exactly 2× the cut of qty=1 |
| Seller net credit after affiliate | seller credited gross line total, ignoring affiliate cut | bug fix | passed with evidence | `wallet.service.ts creditSellersOnPayment`: `net = item.price - (item.affiliateCut ?? 0)`. Switched from recomputing price to reading stored `item.price` |
| Multi-seller release notification | only first seller notified on multi-seller order delivery | bug fix | passed with evidence | `wallet.service.ts releaseFundsOnDelivery`: replaced `take:1` query with `findMany` loop. Each seller gets individual notification + email with their own release amount |
| Per-seller promoter cut isolation | seller dashboard showed inflated cuts from other sellers' items | bug fix | passed with evidence | `affiliate.repository.ts getPromoters`: `orderItem` filtered `where: { variant: { product: { sellerId: { in: sellerIds } } } }`. Order-level `affiliateCut` no longer used |
| Buyer wallet — non-seller affiliate credit | non-seller affiliate commission logged but never credited | feature | passed with evidence | `BuyerWallet` + `BuyerTransaction` models added and migrated. `wallet.service releaseFundsOnDelivery` credits `BuyerWallet` for users without `SellerProfile`, with idempotency guard. `GET /api/commerce/buyer-wallet` + `/transactions` endpoints. `WalletTab.vue` buyer section shows real balance + history. 5 Vitest store tests + 7 Playwright API tests |
| Seller adds tracking to SHIPPED order | `saveTracking` blocked by state machine (regression) | bug fix | passed with evidence | **Bug fixed**: `status.patch.ts` introduced state machine; same-status PATCH (SHIPPED→SHIPPED) was rejected. Fix: `statusChanging = body.status !== order.status` guard skips transition check + notifications when status unchanged, only writes tracking fields. Regression test added |
| Seller PENDING order — no confirm UI | seller had no way to action PENDING orders from dashboard | UI bug fix | passed with evidence | `seller/[storeSlug]/orders.vue`: added PENDING action dropdown ("Confirm Order" / "Cancel") for all order types (POD and standard). Previously dropdowns only appeared for CONFIRMED status |

## Social Tracker

| Flow | Risk | Test Type | Status | Notes |
|------|------|-----------|--------|-------|
| Register user | duplicate email | API | passed with evidence | Phase 1 tests |
| Login | brute force | API | passed with evidence | Phase 1 tests |
| Logout | token not cleared | API | passed with evidence | Phase 1 tests |
| Verify email | replay, expiry | API | not started | |
| Forgot/Reset password | user enumeration | API | not started | |
| Checkout OTP send | rate limit | API | passed with evidence | `session.spec.ts` |
| Checkout OTP verify | expiry, replay | API | not started | |
| Seller registration | duplicate store | API | not started | |
| Create post | media upload | API + E2E | not started | |
| Like/unlike post | duplicate like | API | passed with evidence | Phase 5 gap-fill |
| Post IDOR (edit/delete) | ownership | API | not started | |
| Start conversation | duplicate conv | API | passed with evidence | `chat.spec.ts` |
| Message IDOR | other user's convo | API | passed with evidence | `chat-messages.spec.ts` |
| Delete conversation | ownership | API | passed with evidence | `chat-messages.spec.ts` gap-fill |
| SSE notification stream | auth | API | passed with evidence | `notifications.spec.ts` |
| Follow / unfollow | self-follow | API | passed with evidence | `profile-extended.spec.ts` |
| Search result ordering | type filter | API | passed with evidence | `search.spec.ts` (destructuring fixed) |
| Seller profile `$fetch` refactor | raw fetch | code review | passed with evidence | replaced with service clients |
| Square officer management | chairman-only | API | passed with evidence | `squares-extended.spec.ts` gap-fill |
| Map location privacy | coordinate exposure | manual | not started | |
| Wall shoutout create (store) | auth, body length | API | not started | `POST /api/wall/store/:slug` |
| Wall shoutout delete (author + owner) | ownership | API | not started | `DELETE /api/wall/:type/:slug/:postId` |
| Wall feed contamination fix | wall posts in home/following feed | code review | passed with evidence | `wallTargetType: null` filter added to all post.repository queries |
| Reviews eligibility `profileId` bug | Unknown argument | code review | passed with evidence | `eligibility.get.ts` — `profileId` → `userId` on `Orders.findFirst` |
| Embedding column `Unsupported()` fix | `db push` drops pgvector column | code review | passed with evidence | `embedding Unsupported("vector(1536)")?` added to schema; column restored via raw SQL |

## AI Tracker

| Flow | Risk | Test Type | Status | Notes |
|------|------|-----------|--------|-------|
| Chat turn | prompt injection, cost | API + manual | not started | |
| Multi-turn context | stale context | manual | not started | |
| Guard rail trigger | log persistence | API | not started | logs route was in .gitignore — fixed |
| Turn logging | PII in logs | manual | not started | |
| Generate listing | cost runaway | API + manual | not started | |
| Enhance description | output sanitization | manual | not started | |
| AI rate limiting | cost runaway | manual | not started | |
| Dasah brand name | "DassaAI" remnants | code review | passed with evidence | all components updated to "Dasah" |

---

---

# UI Design System Audit

**Audited:** June 2026  
**Scope:** All Vue components across all layers (~50+ components)  
**Goal:** Eliminate AI-signature visual patterns, establish a consistent design system without full Storybook overhead.

---

## Design System Health

| Aspect | Score | Notes |
|--------|-------|-------|
| Color system | 9/10 | Well-defined tokens in tailwind.config.ts — `brand`, `navy`, `violet`, `mint`, `slate`, semantic surfaces |
| Dark mode | 8/10 | Comprehensive light/dark pairs, ColorMode integration throughout |
| Shadows | 7/10 | Brand-colored halos defined in config, but inconsistently applied |
| Border radius | 7/10 | `rounded-2xl` / `rounded-xl` / `rounded-full` system works — some drift |
| Typography | 6/10 | Inter is good. Font sizes scattered: `text-[13px]`, `text-[11px]`, `text-[9px]` mixed with standard scale |
| Spacing | 6/10 | Mostly Tailwind scale but custom pixel values mixed in |
| Component consistency | 5/10 | No shared component layer — buttons, modals, cards reinvented per layer |
| Accessibility | 4/10 | No visible focus states, limited ARIA attributes |
| Documentation | 2/10 | No design token docs, no component contracts |

---

## AI Signature Patterns — Remove

These patterns cause the site to read as AI-generated. Fix in priority order.

| Pattern | Location | Fix |
|---------|----------|-----|
| `from-purple-500 to-pink-500` gradient | `MobileAIChat.vue`, `CreateModal.vue` | Replace with flat `bg-brand` |
| `shadow-brand/40` halo on multiple elements | `ReelItem.vue`, `ShopProductCard.vue` | Keep on primary CTA only |
| `backdrop-blur-xl` on static product cards | `ShopProductCard.vue` | Blur only on video overlays |
| `letter-spacing` on headings | Scattered | Remove tracking from headings |
| Equal 6-card feature grids | Landing/marketing pages | Not in component code — check marketing pages |

Patterns that are **fine to keep**:
- `backdrop-blur-md` on video reel overlays — functionally required for readability
- `bg-gradient-to-t from-black/90` overlays on media — same reason
- `rounded-2xl` cards — intentional and consistent
- `brand: #F43F5E` coral red — distinctive, not the AI-purple

---

## Inconsistencies To Fix

### 1. Button styles — 4 different implementations across layers
No `BaseButton.vue` exists. Each layer invents its own:
```
bg-brand text-white hover:bg-[#d81b36] shadow-md shadow-brand/20   (commerce)
border border-gray-200 text-gray-700 hover:bg-gray-50              (secondary)
text-brand hover:text-[#d81b36] transition-colors                  (ghost)
flex h-8 w-8 items-center justify-center rounded-full              (icon)
```
**Fix:** Create `layers/ui/app/components/BaseButton.vue` with `variant` prop.

### 2. Border color drift across cards
- `ShopProductCard.vue`: `border-gray-100 dark:border-neutral-800`
- `SellerProductCard.vue`: `border-gray-200 dark:border-neutral-700`
- Modal cards: `border-white/20`

**Fix:** Standardize to `border-gray-100 dark:border-neutral-800` for all content cards.

### 3. Font size inconsistency
Custom pixel values scattered everywhere — `text-[13px]`, `text-[12px]`, `text-[11px]`, `text-[10px]`, `text-[9px]` — bypass the Tailwind type scale entirely.

**Fix:** Define a complete type scale in `tailwind.config.ts`:
```ts
fontSize: {
  '2xs': ['10px', { lineHeight: '14px' }],
  'xs':  ['12px', { lineHeight: '16px' }],
  'sm':  ['13px', { lineHeight: '18px' }],
  'base':['14px', { lineHeight: '20px' }],
  'md':  ['15px', { lineHeight: '22px' }],
  'lg':  ['16px', { lineHeight: '24px' }],
  'xl':  ['20px', { lineHeight: '28px' }],
}
```

### 4. Modal z-index — no hierarchy documented
Multiple components use `z-50` with no layering strategy.

**Fix:** Create `layers/ui/app/utils/zIndex.ts`:
```ts
export const Z = { overlay: 40, modal: 50, toast: 60, tooltip: 70 }
```

### 5. Avatar colors hardcoded as inline hex values
`layers/profile/app/components/Avatar.vue` uses a hardcoded color array that bypasses the design system.

**Fix:** Map to Tailwind CSS variables or reference the color tokens from tailwind.config.

---

## Recommended Architecture — `layers/ui/` Component Layer

No Storybook. Instead, create a thin shared component layer that all other layers import from:

```
layers/ui/app/components/
  BaseButton.vue       — primary / secondary / ghost / danger / icon variants
  BaseCard.vue         — standard card wrapper (border, radius, bg, shadow)
  BaseBadge.vue        — status pills: success / warning / danger / muted / brand
  BaseModal.vue        — backdrop + container (replaces 8+ modal implementations)
  BaseInput.vue        — text / email / tel / select / textarea (replaces scattered input-field class)
  BaseAvatar.vue       — consolidates Avatar.vue across profile + core layers
layers/ui/app/utils/
  zIndex.ts            — z-index constants
```

**Rule:** If a pattern appears in 3+ components, it belongs in `layers/ui/`.

---

## Implementation Priority

### Week 1 — Kill AI signature (2 files, fast)
- [ ] Remove `from-purple-500 to-pink-500` from `MobileAIChat.vue` and `CreateModal.vue`
- [ ] Remove `shadow-brand/40` halos from non-CTA elements
- [ ] Add type scale to `tailwind.config.ts`

### Week 2 — Consistency foundation
- [ ] Create `BaseButton.vue` with 4 variants
- [ ] Create `BaseCard.vue`
- [ ] Standardize modal z-index via constants file
- [ ] Replace `border-gray-200 dark:border-neutral-700` drift → single token

### Week 3 — Component extraction
- [ ] Create `BaseModal.vue` — replace top 3 modal implementations
- [ ] Create `BaseInput.vue` — replace scattered `input-field` class
- [ ] Create `BaseBadge.vue` — replace scattered status pill classes
- [ ] Add global focus ring to `tailwind.config.ts`

---

## UI Design Tracker

| Item | Layer | Priority | Status |
|------|-------|----------|--------|
| Remove purple gradient from `MobileAIChat.vue` | AI | P0 | done — replaced `from-purple-500 to-pink-500` with `bg-neutral-900` (inactive state) |
| Remove purple gradient from `CreateModal.vue` | Core | P0 | done — Post→`bg-brand`, Story→`bg-amber-500`, Product→`bg-mint`; `rounded-full`→`rounded-2xl` for consistency |
| Remove `from-brand to-purple-600` gradient from RightSideNav AI tab | Core | P0 | done — replaced with flat `bg-brand` |
| Remove `from-brand to-pink-500` gradient from profile seller banner | Profile | P0 | done — flat `bg-brand` |
| Add font families to tailwind.config.ts | Global | P1 | done — `sans: Manrope`, `display: Sora` (both already loaded via head); added `2xs`, `3xs`, `md` font size tokens |
| Create `layers/ui/` component layer | UI layer | P1 | done — layer registered in nuxt.config.ts; `BaseButton`, `BaseCard`, `BaseModal`, `BaseInput`, `BaseBadge`, `zIndex.ts` all created |
| Create `BaseButton.vue` | UI layer | P1 | done — 5 variants (primary/secondary/ghost/danger/icon), 4 sizes, loading spinner, focus rings, disabled state |
| Create `BaseCard.vue` | UI layer | P1 | done — 3 variants (default/flat/elevated), header/footer slots, eyebrow, noPadding prop |
| Create `BaseModal.vue` | UI layer | P1 | done — mobile bottom-sheet slide-up, desktop scale-in; backdrop blur; persistent mode; drag handle |
| Create `BaseInput.vue` | UI layer | P1 | done — brand focus ring, error/hint text, leading/trailing icons, password toggle, 3 sizes |
| Create `BaseBadge.vue` | UI layer | P2 | done — all order statuses + generic (success/warning/danger/info/muted/brand), dot variant, 2 sizes |
| Z-index constants file | UI layer | P2 | done — `layers/ui/app/utils/zIndex.ts`: overlay:40, modal:50, toast:60, tooltip:70 |
| `BaseButton` success variant | UI layer | P1 | done — `bg-mint text-white shadow-sm shadow-mint/20` variant for confirm/receipt actions |
| Rollout: `seller/[storeSlug]/orders.vue` | Seller | P1 | done — BaseBadge for status+POD, BaseButton for cash/refuse/actions, BaseModal for tracking, BaseInput for tracking fields, BaseCard for order rows; removed statusColor fn + .input-field style |
| Rollout: `buyer/orders.vue` | Profile | P1 | done — BaseBadge for status+POD, BaseButton for Confirm Receipt; removed statusColor fn |
| Rollout: `buyer/orders/[id].vue` | Profile | P1 | done — BaseBadge for status, BaseCard for Status/Items/Delivery/Price sections, BaseButton for cancel; removed statusColor fn |
| Rollout: `user-register.vue` (step 1) | Core | P1 | done — BaseInput for username/email/password/confirmPassword, BaseButton for submit; removed manual icon wrappers and redundant showPassword refs |
| Rollout: `CheckoutDelivery.vue` | Commerce | P1 | done — BaseInput for 6 address fields, BaseButton for save/cancel address; removed .input-field style |
| Rollout: `CheckoutAuthStep.vue` | Commerce | P1 | done — BaseInput for email/name/phone fields, BaseButton for Continue and Verify & Continue; OTP input kept custom (tracking-[0.5em] special class); removed .input-field style |
| Rollout: `profile/modals/AddFundsModal.vue` | Profile | P1 | done — BaseModal replaces Teleport/Transition/backdrop; BaseButton for Add Funds in footer slot; preset amount + payment selector kept raw (dynamic toggled classes) |
| Rollout: `profile/modals/EditProfileModal.vue` | Profile | P1 | done — BaseModal; BaseInput for username/website/location; BaseButton for Save+Cancel in footer; bio textarea kept raw |
| Rollout: `profile/modals/FollowListModal.vue` | Profile | P1 | done — BaseModal; BaseInput for search; BaseButton for Follow/Following toggle |
| Rollout: `profile/modals/WithdrawModal.vue` | Profile | P1 | done — BaseModal; BaseInput for account number/name; BaseButton for Save Account, Cancel, Withdraw in footer; amount input + bank selector kept raw |
| Rollout: `modals/QuickProductModal.vue` | Commerce | P1 | done — BaseModal replaces Teleport/Transition; BaseInput for title/price/commission; BaseButton for Cancel+Submit in footer |
| Rollout: `sellers/create.vue` | Seller | P1 | done — BaseInput for name/location/phone/website + all shipping/map accordion inputs; BaseButton for submit; slug field kept raw (domain prefix overlay); lat/lon kept raw (v-model.number); removed .input-sm scoped style |
| Rollout: `profile/pages/profile/[username].vue` | Profile | P1 | done — BaseButton for "Try Again" error state; tab strip buttons kept raw (navigation) |
| Rollout: `seller/[storeSlug]/dashboard.vue` | Seller | P1 | done — BaseBadge for order status; removed orderStatusClass fn |
| Rollout: `product-form/ProductBasicInfo.vue` | Seller | P1 | done — BaseInput for title + SKU; price/discount/commission kept raw (v-model.number); description/status kept raw |
| Rollout: `commerce/pages/product/[slug].vue` | Commerce | P1 | done — BaseButton for Add to Cart (with loading), Copy link, Share, affiliate Copy |
| Rollout: `modals/ProductDetailModal.vue` | Commerce | P1 | done — BaseButton for Add to Cart (success/primary variant swap), Create Post, Add to Story; outer modal structure kept custom (2-col layout) |
| Rollout: `social/modals/PostUploadModal.vue` | Social | P1 | done — BaseButton for Share header button; toolbar icon buttons kept raw |
| Rollout: `social/modals/PostEditModal.vue` | Social | P1 | done — BaseButton for Save header button |
| Rollout: `feed/components/SocialFeed.vue` | Feed | P1 | done — BaseButton for "Try Again" retry error button |
| Standardize border color tokens | Global | P2 | not started |
| Fix Avatar inline color hardcoding | Profile | P2 | not started |
| Add global focus ring styles | Global | P2 | not started |

---

## Known Acceptable Patterns (Do Not Change)

- `backdrop-blur-md` / `bg-black/40` on video reel overlays — readability requirement
- `bg-gradient-to-t from-black/90` on media cards — readability requirement
- `rounded-2xl` as primary card radius — intentional, consistent
- `brand: #F43F5E` — distinctive color, keep as primary
- `Inter` font — fine, remove `tracking-*` from headings only
- Content-type color map in `PostCard.vue` (blue/amber/orange/pink/emerald per type) — intentional theming

---

## Known Deferred Items (from TEST_REPORT.md)

| Item | Blocker | Target Month |
|------|---------|-------------|
| Chat message send (returns 200) | Soketi service must be running | July |
| PayPal capture flow | PayPal sandbox config | June |
| Paystack webhook | Paystack CLI / ngrok | June |
| UI component tests (Vue) | Vitest + Vue Test Utils setup needed | August |
| Page-level integration tests | Playwright component testing setup | August |
| E2E add-to-cart button | UI element visibility issue on product page | June |

---

## Suggested Working Rhythm

For each audit slice:

1. Pick one flow from the tracker
2. Map: page → composable → API → service → repository → DB/queue/provider
3. Write down assumptions
4. Execute manual test or write automated test
5. Update tracker row with evidence
6. Log any bugs found
7. Only then refactor if needed

This keeps the audit grounded and stops cleanup from rewriting bugs into new shapes.
