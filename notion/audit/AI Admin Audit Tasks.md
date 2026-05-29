# AI + Admin + Pre-Production Audit Tasks — August 2026

> **Pillar:** AI + Admin + Pre-Production
> **Theme:** Intelligence, governance, and production readiness.
> **Goal:** Dassa AI works reliably for buyers and sellers. Admin tooling is safe. The app passes a security audit. Infrastructure is ready for production traffic.
> **Deadline:** August 31, 2026
> **Owner:** Joshua Akibu (AI keys + infra) · Mapida Ishaya (code execution)

---

## P0 — Dassa Chat (Buyer & Seller)

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Buyer starts Dassa conversation | P0 | Joshua | API + Manual | Prompt injection, cost | not started | August 31 | `POST /api/ai/chat/turn` |
| Chat maintains context (multi-turn) | P0 | Mapida | Manual | Stale context, hallucination | not started | August 31 | Embeddings + context API |
| AI recommends products | P0 | Mapida | Manual | Wrong seller's products surfaced | not started | August 31 | Internal product query |
| AI adds item to cart | P0 | Mapida | API + Manual | Auth required, quantity handling | not started | August 31 | `POST /api/commerce/cart` via AI |
| Seller uses Dassa in seller mode | P0 | Mapida | Manual | Seller context leak | not started | August 31 | Seller chat variant |
| Guard rail triggered and logged | P0 | Mapida | API | Log persistence | not started | August 31 | `POST /api/ai/logs/guard-rail` — logs route was in `.gitignore` (fixed) |
| Conversation turn logged | P0 | Mapida | API + Manual | PII in logs | not started | August 31 | `POST /api/ai/logs/turn` |

---

## P1 — Listing Generation & Enhancement

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Generate listing from photo/prompt | P1 | Joshua | API + Manual | Prompt injection, cost runaway | not started | August 31 | `POST /api/ai/generate-listing` |
| Enhance product description | P1 | Mapida | Manual | Output not sanitized before render | not started | August 31 | `POST /api/ai/enhance-description` |
| AI output applied to product form | P1 | Mapida | Manual | Unsanitized HTML applied to fields | not started | August 31 | Client-only — verify no raw HTML |
| Rate limiting on AI endpoints | P1 | Mapida | Manual | Cost runaway | not started | August 31 | Middleware check |

---

## P1 — AI Context & Embeddings

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Fetch AI context for session | P1 | Mapida | API | Auth required | not started | August 31 | `GET /api/ai/context` |
| Embeddings generated for new product | P1 | Mapida | API | Async failure silently skipped | not started | August 31 | Product create/edit side effect |
| Search uses embeddings (vector query) | P1 | Mapida | API + Manual | Relevance, latency | not started | August 31 | Embedding column fix already applied |
| Dassa brand name consistency | P1 | Mapida | Code review | "DassaAI" remnants in UI | passed with evidence | August 31 | All components updated to "Dassa" |

---

## P0 — Admin Access Control

| Task | Priority | Owner | Test Type | Risk | Status | Deadline | Notes |
|------|----------|-------|-----------|------|--------|----------|-------|
| Admin login | P0 | Joshua | API | Privilege escalation | not started | August 31 | Admin auth flow |
| Admin views users | P0 | Mapida | API + Manual | PII exposure to non-admins | not started | August 31 | User management APIs |
| Admin moderates content | P0 | Mapida | API | False positive, irreversible action | not started | August 31 | Moderation APIs |
| Admin views audit log | P0 | Mapida | API | Log integrity | not started | August 31 | Audit log APIs |
| Non-admin blocked from admin routes | P0 | Mapida | API | Privilege escalation | not started | August 31 | Admin middleware check |

---

## AI UI/UX Checklist — Dassa Chat Widget

`layers/ai/app/components/dassa/Chat.vue`

- [ ] Welcome message shows "Dassa" (not "DassaAI" or "Dassa AI")
- [ ] Input placeholder is "Ask Dassa…"
- [ ] Typing indicator (animated dots) appears while AI is generating
- [ ] Message bubbles use brand color `#F43F5E` for user messages
- [ ] Product cards in AI response link to correct product pages
- [ ] "Add to cart" in product card works and shows feedback
- [ ] Chat window scrolls to bottom on new message
- [ ] Error state shown when AI API fails (not blank/infinite spinner)
- [ ] Chat persists across page navigation (or resets cleanly)

## AI UI/UX Checklist — Mobile AI Chat

`layers/ai/app/components/MobileAIChat.vue`

- [ ] Tab label shows "Dassa"
- [ ] Sign-in fallback CTA shows "Chat with Dassa"
- [ ] Keyboard does not obscure input on iOS/Android

## AI UI/UX Checklist — Seller Chat

`layers/seller/pages/seller/chat.vue`

- [ ] Avatar uses brand red background (`#F43F5E`)
- [ ] Send button uses brand red
- [ ] Seller context (own products) is surfaced in AI responses

## AI UI/UX Checklist — Listing Generation

- [ ] Generate button shows loading state during generation
- [ ] Generated content is applied to form fields (not raw HTML)
- [ ] Error message shown if generation fails
- [ ] User can edit AI-generated content before saving

---

## Pre-Production Checklist — Security Hardening

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

## Pre-Production Checklist — Performance & Reliability

- [ ] Database indexes verified for common query patterns (orders by userId, products by storeSlug, etc.)
- [ ] Prisma N+1 queries identified and fixed in feed/order list endpoints
- [ ] Redis connection pool configured for production load
- [ ] Background queue (notifications, email, audit) handles Redis unavailability gracefully
- [ ] Paystack/PayPal/Shippo/Sendbox API calls have timeout limits
- [ ] Image uploads: file size limit enforced, file type validated server-side
- [ ] CDN (Cloudinary) URLs used for all media in production
- [ ] Picsum fallbacks replaced with real assets or acceptable for production

## Pre-Production Checklist — Infrastructure

> Owner: Joshua Akibu — all production keys and environment variables

- [ ] Neon/Postgres connection string is production database (not dev)
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

## Pre-Production Checklist — Observability

- [ ] Server error logs going to a persistent sink (file or external service)
- [ ] Audit log table populated for P0 actions (payments, order status, auth events)
- [ ] AI guard rail logs persist correctly
- [ ] Failed webhook calls logged with enough context to replay
- [ ] Health check endpoint exists and returns 200

---

## Final E2E Regression Suite (Playwright)

Run the full suite before deployment. All 10 must pass.

| # | Flow | Status |
|---|------|--------|
| 1 | Guest home loads — feed + featured products visible | not started |
| 2 | Register → verify email → login → profile visible | not started |
| 3 | Product detail loads — gallery, variants, reviews | not started |
| 4 | Add to cart (guest) → login → cart merges → checkout → Paystack test redirect | not started |
| 5 | Seller logs in → creates product → product visible on store page | not started |
| 6 | Seller updates order status | not started |
| 7 | Buyer messages seller → conversation created | not started |
| 8 | Dassa chat: user sends message → AI responds with product card | not started |
| 9 | Search: query returns products and stores | not started |
| 10 | Map: seller pins visible, filter updates pins | not started |

---

## Definition of Done — August 31, 2026

- [ ] All AI flows have API test coverage or documented manual test
- [ ] Dassa chat UI passes manual review on mobile + desktop
- [ ] Listing generation + enhancement tested with real OpenAI API key
- [ ] All guard rail and turn logs verified to persist correctly
- [ ] Admin access control verified: non-admin blocked from all admin routes
- [ ] Security checklist above is 100% checked
- [ ] Performance checklist is complete or risks documented
- [ ] Infrastructure checklist is complete for production environment
- [ ] Final E2E regression suite passes 10/10
- [ ] No P0 or P1 flows with "not started" or "bug found (unresolved)" status
