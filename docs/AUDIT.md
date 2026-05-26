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
| Guest adds to cart | `/` product page | `POST /api/commerce/cart` | cart ID collision | not started |
| Authenticated adds to cart | product page | `POST /api/commerce/cart` | merge on login | not started |
| Update cart quantity | cart drawer | `PATCH /api/commerce/cart/:id` | stock race | not started |
| Remove from cart | cart drawer | `DELETE /api/commerce/cart/:id` | stale UI | not started |
| Guest cart merges on login | login flow | `POST /api/commerce/cart/merge` | item duplication | not started |
| Checkout email field pre-fill | checkout.vue | client only | fake TLD bypass | not started |
| Shipping rate selection | checkout.vue | `POST /api/commerce/shipping/calculate` | zone mismatch | not started |
| Initialize card payment | checkout.vue | `POST /api/commerce/payments/initialize` | Paystack email, duplicate ref | not started |
| Initialize POD payment | checkout.vue | `POST /api/commerce/payments/pod-initialize` | POD zone eligibility | not started |
| Verify card payment return | `/checkout/return` | `POST /api/commerce/payments/verify` | replay, ref mismatch | not started |
| Verify POD payment return | `/checkout/return` | `POST /api/commerce/payments/pod-verify` | shipping-only amount | not started |
| Paystack webhook | internal | `POST /api/webhooks/paystack` | signature, duplicate | not started |
| PayPal create | checkout.vue | `POST /api/commerce/payments/paypal/create` | sandbox config | not started |
| PayPal capture | return page | `POST /api/commerce/payments/paypal/capture` | duplicate capture | not started |
| Order confirmation email | post-payment | queue / Resend | template, delivery | not started |

### P0 — Orders

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Buyer views own orders | `/orders` | `GET /api/commerce/orders` | other buyer's orders | not started |
| Buyer views order detail | `/orders/:id` | `GET /api/commerce/orders/:id` | IDOR | not started |
| Buyer cancels order | order detail | `POST /api/commerce/orders/:id/cancel` | post-paid cancel | not started |
| Buyer confirms receipt | order detail | `POST /api/commerce/orders/:id/confirm-receipt` | premature confirm | not started |
| Buyer refuses delivery (POD) | order detail | `POST /api/commerce/orders/:id/refuse-delivery` | state transition | not started |
| Seller views store orders | seller dashboard | `GET /api/seller/orders` | other seller's orders | not started |
| Seller updates order status | seller dashboard | `PATCH /api/commerce/orders/:id/status` | invalid transition | not started |
| Seller marks order shipped | seller dashboard | shipping provider | tracking number | not started |

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
| Buyer wallet state | account | `GET /api/commerce/wallet` | N/A | not started |

### P1 — Affiliate

| Flow | Entry | API Routes | Risk | Status |
|------|-------|-----------|------|--------|
| Seller enrolls | seller dashboard | `POST /api/commerce/affiliate/enroll` | idempotency | not started |
| Affiliate link applied at checkout | checkout | affiliateCode param | code validation | not started |
| Affiliate stats | seller dashboard | `GET /api/commerce/affiliate` | other seller's stats | not started |

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
| Guest adds to cart | cart ID collision | API + E2E | not started | |
| Cart merge on login | item duplication | API | not started | |
| Checkout email pre-fill | fake TLD bypass | manual UI | not started | |
| Initialize card payment | duplicate ref | API + E2E | not started | |
| Initialize POD payment | zone eligibility | API | not started | |
| Verify card payment | replay attack | API | not started | |
| Paystack webhook | signature, duplicate | API | not started | needs ngrok/Paystack CLI |
| Buyer views order (IDOR) | IDOR | API | not started | |
| Seller updates order status | invalid transition | API | not started | |
| Seller creates product | media, variants | E2E | not started | |
| Out of stock at checkout | oversell race | API | not started | |
| Product review eligibility | not purchased | API | passed with evidence | `eligibility.get.ts` fixed (userId field) |
| Shipping calculate | zone not found | API | passed with evidence | `shipping.spec.ts` passing |
| Wallet withdraw | double-withdraw | API | not started | |
| Affiliate code at checkout | code validation | API | not started | |

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
