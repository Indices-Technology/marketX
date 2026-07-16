# MarketX Launch Checklist

> Living doc. Check items off as they're verified **in the production environment**,
> not just locally. Anything money-, auth-, or data-related is a hard gate.
> Legend: 🔴 blocker · 🟡 should-fix · 🟢 nice-to-have

---

## 1. Security & Auth 🔴

- [ ] `JWT_SECRET` is a strong, unique production value (not the dev secret, not committed)
- [ ] Session revocation verified end-to-end (logout + admin ban actually kills live tokens) — `requireAuth` checks `Session.revokedAt`
- [ ] **Authz coverage sweep**: every mutating `server/api/**` route calls `requireAuth`/`requireRole` **and** verifies *ownership* (user can't edit/cancel someone else's product/order/ticket). See §Appendix A.
- [ ] **XSS / token-theft**: tokens live in `localStorage`, so any XSS = account takeover. Audit every `v-html` / raw-HTML render (esp. `HtmlDescriptionEditor`, post captions, product descriptions) for sanitization. Decision logged on `httpOnly` cookies vs. localStorage.
- [ ] Rate limiting live on auth endpoints (`RATE_LIMIT_*` envs set and enforced: login, register, forgot-password, verify-email, refresh-token)
- [ ] No secrets in the client bundle (verified: `runtimeConfig` keeps them server-side; `paystackPk` is publishable ✓ — re-verify after any config change)
- [ ] All dev/test API keys rotated to production keys (OpenAI, Anthropic, Grok, Google, Paystack, PayPal, Shippo, Sendbox, Resend, Upstash)
- [ ] Webhook **signature verification** enforced: Paystack, Shippo (`SHIPPO_WEBHOOK_SECRET`), Sendbox (`SENDBOX_WEBHOOK_SECRET`), PayPal
- [ ] Admin (`requireAdmin`), moderator (`requireModerator`), support-agent (`requireSupportAgent`) routes all guarded server-side
- [ ] CSP / security headers reviewed (CSP already blocks external hosts — confirm prod domains allowlisted for Cloudinary, sockets)
- [ ] Password reset + email verification flows tested against **production** email
- [ ] CORS locked to production origin(s)

## 2. Payments & Money 🔴

- [ ] Paystack **LIVE** keys (secret + public); PayPal **live** credentials
- [ ] `PLATFORM_COMMISSION_RATE` set to the correct production value
- [ ] Full purchase tested with a **real** card (small amount) → order created, paid, seller credited
- [ ] Payment idempotency verified (double-submit / webhook replay does not double-charge or double-credit)
- [ ] Seller payout flow end-to-end: `SellerWallet` → `Payout` → bank (`BankAccount`), with commission deducted
- [ ] Refund / dispute flow: support `REFUND_BUYER` reverses seller credit correctly; card refund path documented (manual step?)
- [ ] Cash-on-delivery (`PodDelivery`) flow tested incl. `confirm-cash`
- [ ] Buyer wallet (`BuyerWallet`) add-funds + spend reconciles
- [ ] Square wallets/payouts (`SquareWallet`, `SquarePayout`) reconcile if live at launch
- [ ] Currency/formatting correct (NGN) across cart, checkout, receipts
- [ ] Money math audited for float/rounding on totals, discounts, commission

## 3. Infrastructure & Environment 🔴

- [ ] Prisma migrations applied to prod: `migrate deploy` run over the **direct (non-pooler) `DATABASE_URL`** — the Neon pooler hangs on the advisory lock
- [ ] Prod `DATABASE_URL` (pooled) + direct URL both configured correctly
- [ ] Neon **backups / branching** confirmed working (test a restore before you need it)
- [ ] Upstash Redis prod instance configured; **no stale dev BullMQ workers** on the shared queue (they mis-type notifications — kill stale node procs)
- [ ] Cloudinary prod cloud configured; upload + transform URLs work from prod domain
- [ ] Env validation passes in prod (the `✅ Environment validation passed!` gate)
- [ ] Websockets prod: Soketi / Pusher (`SOKETI_*`) and Dassa socket (`NUXT_PUBLIC_DASSA_SOCKET_URL`) reachable over TLS
- [ ] Domain, DNS, SSL/TLS, `NUXT_PUBLIC_BASE_URL` = prod URL
- [ ] PWA manifest, icons, safe-area insets verified on real iOS + Android
- [ ] Error logging shipping somewhere queryable (`logger.logError` + `requestId` correlation)

## 4. Background Workers & Notifications 🟡

- [ ] BullMQ workers **deployed and running** in prod (not only dev machines)
- [ ] Notification delivery tested per-type (order, message, support, square) — no mis-typing from queue contention
- [ ] Resend prod key; email deliverability set up (SPF, DKIM, DMARC on send domain)
- [ ] Push notifications tested on device (permission → receipt)
- [ ] Email templates reviewed (from-name, reply-to, unsubscribe where required)

## 5. Shipping 🟡

- [ ] Shippo + Sendbox **live** keys and webhook secrets
- [ ] `GlobalShippingZone`s configured with real rates
- [ ] Booking + label + tracking tested end-to-end (Carrier Simulation tool for state transitions)
- [ ] Delivery status → notification → order status chain verified

## 6. Data & Content 🔴

- [ ] **Test data cleaned** from prod DB (see `docs/DB_CLEANUP.md` / separate plan — backup first)
- [ ] Real category taxonomy (`Category`) seeded and correct
- [ ] Market Squares (`Square`) curated — real ones live, test ones removed
- [ ] Seed supply strategy executed (avoid empty-marketplace cold start — go deep on 1 Square, not fake-wide)
- [ ] Legal pages current: Terms, Privacy, and **NDPA** (Nigeria Data Protection Act) compliance reviewed by counsel
- [ ] Seller verification (`VerificationDocument`, CAC fields) review process staffed

## 7. QA — Critical Flows 🔴

Test each on **mobile + desktop**, logged-out and logged-in:

- [ ] Sign up (email + OAuth: Google, Facebook) → verify email
- [ ] Seller onboarding → create store → list product (with media, variants)
- [ ] Browse / search (People/products/stores surface correctly) → product detail
- [ ] Add to cart → checkout → pay → order confirmed
- [ ] Seller: receive order → ship → buyer receives → review
- [ ] Dispute → support ticket → resolution → refund
- [ ] Messaging (buyer↔seller) + Dassa AI + Support tab
- [ ] Squares: browse → follow → join → buyer request → seller offer
- [ ] E2E suite green (Playwright baseline ~217/222 — investigate any new reds)
- [ ] Lighthouse / perf audit acceptable on key pages
- [ ] Mobile nav parity (all store-dashboard links reachable incl. Finance)

## 8. Moderation, Support & Ops 🟡

- [ ] Report → moderation queue → action flow works; moderators assigned
- [ ] Support agents onboarded; `/support/agent` queue reachable; SLA defined
- [ ] Refund/return policy published
- [ ] Content moderation policy + escalation path documented
- [ ] Incident + rollback runbook (how to revert a bad deploy / migration)
- [ ] On-call / who-gets-paged for payments and outages

## 9. Observability & Post-Launch 🟡

- [ ] Uptime + error-rate monitoring with alerts
- [ ] Payment-failure + payout-failure alerts
- [ ] Product analytics wired (funnels: signup → first purchase)
- [ ] Kill switches / feature flags for risky surfaces (payments, AI)
- [ ] Day-1 dashboard: signups, GMV, failed payments, error rate

## 10. Launch-Day Smoke Test 🔴

Run in prod, in order, right before flipping the switch:

1. [ ] Fresh signup + verify email
2. [ ] Create store + list one real product
3. [ ] Real purchase (small) with live card → seller credited
4. [ ] Ship + mark delivered + review
5. [ ] Trigger one notification of each channel (in-app, email, push)
6. [ ] Open a support ticket → agent sees it
7. [ ] Confirm error logs + monitoring are receiving events

---

## Appendix A — Authz sweep targets (high-risk mutations)

Verify each guards auth **and ownership/role**:

- `commerce/**/products/[id]/{patch,delete}` — seller owns the product
- `commerce/**/orders/**` — party to the order only
- `commerce/**/wallet/withdraw`, `payments/**` — own wallet; server computes amounts
- `seller/**` — owns the store
- `support/**` — own ticket (or agent/admin)
- `squares/[slug]/{members,officers,announcements,settings}` — square officer/admin
- `admin/**` — `requireAdmin` / `requireModerator`
- Anything writing `role`, `balance`, `commission`, `status` must derive from server state, never client input.

## Appendix B — Known gotchas (from build history)

- Neon **pooler** hangs `migrate deploy` on the advisory lock → run migrations over the **direct** URL.
- Stale dev **BullMQ workers** on the shared Upstash queue mis-type notifications → ensure only prod workers run.
- Auth is **Bearer-from-localStorage** (not cookies): SSR fetches are unauthenticated, and localStorage is XSS-readable — informs both the follow-state pattern and the XSS audit above.
