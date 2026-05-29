# MarketX Pre-Production Audit Playbook

> **Testing window:** June 1 – August 31, 2026
> **Baseline:** 385/385 API tests passing · 5/5 E2E smoke passing
> **Goal:** Production confidence across Commerce, Social, and AI before public launch.

---

## Timeline at a Glance

| Month | Pillar | Focus | P0 Flows | P1 Flows | Deadline | Owner |
|-------|--------|-------|----------|----------|----------|-------|
| June | Commerce | Money, orders, payments, shipping, seller ops | 23 | 19 | June 30, 2026 | Mapida + Joshua |
| July | Social | Identity, feed, messaging, discovery, community | 23 | 45 | July 31, 2026 | Mapida + Joshua |
| August | AI + Admin + Pre-Prod | Intelligence, guard rails, security, performance | 12 | 12 | August 31, 2026 | Mapida + Joshua |

Each pillar covers: API correctness · UI/UX polish · E2E flows · Security · Performance

---

## Sub-Pages

- [Commerce Audit Tasks](Commerce%20Audit%20Tasks.md) — June flows, checklists, Definition of Done
- [Social Audit Tasks](Social%20Audit%20Tasks.md) — July flows, checklists, Definition of Done
- [AI + Admin Audit Tasks](AI%20Admin%20Audit%20Tasks.md) — August flows, pre-production checklist, Definition of Done

---

## Audit Principles

1. Audit by flow, not by file.
2. Prioritize money, auth, permissions, and state transitions before UI polish.
3. Verify both happy paths and failure paths.
4. Prefer evidence over confidence — a flow is not "done" until it has reproducible checks.
5. Add tests around existing behavior before large refactors in risky areas.
6. Treat AI-generated code as untrusted until validated by tests and ownership checks.

---

## What Counts As A Flow

A flow is one end-to-end behavior with a clear business outcome spanning:

1. Page or component
2. Client composable / store / service
3. API route
4. Server service / repository
5. Prisma writes / reads
6. Queue, email, webhook, or third-party side effect

---

## Per-Flow Audit Checklist

Run this for every P0 and P1 flow.

### Entry Point
- [ ] Route/page is discoverable and linked correctly
- [ ] Protected UI is not client-gated only
- [ ] Flow cannot be double-submitted by refresh or double-click
- [ ] Loading, disabled, error, and retry states are present

### Client Behavior
- [ ] Composable/store calls the correct endpoint
- [ ] Auth headers and tokens are used correctly
- [ ] Optimistic updates are reversible on failure
- [ ] Stale client state does not persist after login/logout
- [ ] Query params, redirect params, and route params are validated

### API Contract
- [ ] Input is validated server-side with Zod
- [ ] H3 error passthrough is present in every catch block
- [ ] ZodError is caught and returns 400
- [ ] UserError is caught and returns the correct status
- [ ] Method and route semantics are correct
- [ ] Unsafe defaults are not accepted silently

### Authorization
- [ ] Cannot access another user's resource by changing an ID or slug
- [ ] Buyer cannot perform seller-only actions
- [ ] Seller cannot mutate another seller's product or order
- [ ] Admin/internal endpoints are not accidentally public

### Business Logic
- [ ] Totals, fees, currency, stock, and status transitions are correct
- [ ] Duplicate requests are idempotent or safely rejected
- [ ] Order and payment states cannot be corrupted by retries
- [ ] Deletes are soft/hard as intended
- [ ] Partial failures are handled explicitly

### Persistence
- [ ] Prisma writes happen exactly once
- [ ] Transactions are used where needed
- [ ] Relations are loaded and updated consistently
- [ ] Race conditions are handled

### Background Work
- [ ] Audit, notification, and email jobs are enqueued correctly
- [ ] Redis unavailability does not break correctness
- [ ] Queue failure does not corrupt the main request
- [ ] Job retry is safe for duplicate delivery

### External Integrations
- [ ] Provider input is validated before sending
- [ ] Secrets are used safely via runtimeConfig only
- [ ] Webhook authenticity is verified
- [ ] Timeout, 4xx, 5xx, and duplicate callbacks are handled
- [ ] Provider IDs are stored for reconciliation

### Security
- [ ] CSRF protections are correct for cookie-based flows
- [ ] Tokens are not leaked into logs or URLs
- [ ] User-controlled strings are sanitized before render or persistence
- [ ] Rate limits exist for auth and abuse-prone endpoints
- [ ] Sensitive actions are recorded in audit logs

### Observability
- [ ] Failures are visible in production logs
- [ ] Structured logging with correlation IDs is present
- [ ] Audit logs record who did what, to which resource, and when
- [ ] External provider failures are actionable

---

## Evidence Standard

A flow is audited when it has at least one of:

- Automated test coverage with meaningful assertions
- Documented manual test with exact steps and observed result
- Code references proving auth, validation, and side effects were checked
- Recorded bug with reproduction and impact

**Do not mark a flow complete from reading code alone.**

---

## Test Pyramid

| Layer | What to test | Good targets |
|-------|-------------|--------------|
| Unit | Fee calculations, formatting helpers, auth utilities, pure validation, state transition helpers | `server/utils/fees.ts`, `server/utils/auth/passwordValidator.ts`, `server/utils/security/*` |
| Service / Integration | Business logic without the browser — order creation rules, ownership enforcement, inventory checks | Service layer files |
| API Integration (main P0/P1 investment) | Each critical endpoint: success · invalid input · unauthenticated · unauthorized · not found · duplicate/replay · third-party failure · DB side effects | All `/api/` routes |
| Browser E2E | Critical user journeys only — 8–10 flows that must not break in production | Playwright test suite |

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

## Known Deferred Items

| Item | Blocker | Target Month | Priority |
|------|---------|-------------|----------|
| Chat message send (returns 200) | Soketi service must be running | July 2026 | P1 |
| PayPal capture flow | PayPal sandbox config | June 2026 | P0 |
| Paystack webhook | Paystack CLI / ngrok | June 2026 | P0 |
| UI component tests (Vue) | Vitest + Vue Test Utils setup needed | August 2026 | P1 |
| Page-level integration tests | Playwright component testing setup | August 2026 | P1 |
| E2E add-to-cart button | UI element visibility issue on product page | June 2026 | P0 |

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
