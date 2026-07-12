# Payments — architecture & verification

MarketX payments are **provider-agnostic and layered**, so a new rail (M-Pesa,
MoMo, Flutterwave…) is a single file, not a rewrite. The load-bearing rule: **an
order is only ever marked paid through one money-gate that re-derives what's owed
from the DB and asserts the collected amount covers it.** Never trust a
client-sent amount.

Related: [POD.md](./POD.md) (Pay-on-Delivery), [SHIPPING.md](./SHIPPING.md)
(quotes/rates + the signed shipping-quote token).

## 1. Layers

```
layers/payments/server/
  utils/types.ts            IPaymentProvider, PaymentVerifyResult, PaymentWebhookResult
  providers/paystack.ts     live provider (wraps server/utils/paystack)
  providers/stubs.ts        M-Pesa / MoMo / Flutterwave — registered, enabled:false (gated)
  providers/registry.ts     resolve by currency/country; Paystack is the default
  services/payment.service.ts  orchestrator: initialize · confirmPayment · parseWebhook
```

A provider implements `initialize`, `verify` (returns the **actual collected
amount**), and `parseWebhook` (signature-verified). Adding a rail = implement the
interface + flip `enabled: true`.

## 2. The money-gate — `paymentService.confirmPayment`

Every confirmation path calls it. It:
1. `verify()`s the transaction with the provider → actual `amountMinor` + currency.
2. Rejects unless `status === 'success'`, currency matches, and
   `amountMinor >= expectedMinor` (overpay tolerated, underpay rejected).
3. Returns `{ ok, status, actualMinor, … }` — it does **not** touch the DB. The
   caller computes `expectedMinor` from the order rows and flips state on `ok`.

The webhook path uses `parseWebhook` (Paystack HMAC-verified) + the pure
`amountCovers(expected, actual)` helper — same assertion, signed payload.

## 3. Confirmation flow

```
initialize.post.ts   placeOrder (DB-priced items, stock, per-seller split)
                     → payment provider.initialize → redirect to Paystack
   ↓ buyer pays
verify.post.ts       expected = Σ(order.totalAmount + shippingCost)  → confirmPayment
                     ok → PAID/CONFIRMED (atomic once-only), credit sellers, notify
webhook.post.ts      parseWebhook (signed) → same expected → same flip (idempotent vs verify)
```

POD is the same shape but the **expected amount is shipping-only**
(`Σ order.shippingCost`) — see [POD.md](./POD.md).

## 4. Airtightness fixes (July 2026)

Full audit + resolutions. All in `layers/commerce/server/api/commerce/payments/*`
unless noted.

| # | Issue | Fix |
|---|---|---|
| 1 | verify/webhook never checked the amount — any `success` confirmed the order | `confirmPayment` gate in verify + pod-verify + webhook; expected recomputed from DB |
| 2 | POD platform fee debited at **init** (before the buyer paid) → abandoned checkouts charged sellers | Debit moved to **after deposit confirmed** (`podService.debitSellerPodFees`, idempotent, called from pod-verify + webhook) |
| 3 | Shipping amount was client-trusted (buyer could set ₦0) | **Signed quote token** — `/api/shipping/rates` signs `(storeSlug, amount)`; `placeOrder` re-derives the charge from the verified token ([quoteToken.ts](../layers/shipping/server/utils/quoteToken.ts)) |
| 4 | Currency was an unrestricted client string | Locked `z.enum(['NGN'])` at init + currency check in the gate |
| 5 | Stock decremented pre-payment; a `FAILED` order leaked it forever (expiry cron only reclaims `UNPAID`) | `orderRepository.failAndRestore` — atomic cancel + stock restore on genuine failure (verify + pod-verify). Abandoned/pending left for `releaseExpiredOrders` |
| 6 | `quantity` allowed fractions | `z.number().int().positive()` |
| 7 | Placeholder-email domain mismatch (`.africa` vs `.app`) | Standardized to `@checkout.marketx.africa` |
| 8 | Webhook verified signature but not amount | Amount gate added; routes through `confirmPayment`/`amountCovers` |

**Still open:** an **init idempotency key** (double-submit → duplicate PENDING
groups) — needs an `Orders.idempotencyKey` column + migration.

## 5. Environment

| Var | Purpose | Default |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack API + webhook HMAC | — |
| `SHIPPING_QUOTE_SECRET` | signs shipping-quote tokens (falls back to `JWT_SECRET`) | `JWT_SECRET` |
| `SHIPPING_MARKUP_PCT` / `SHIPPING_HANDLING_FEE` | carrier markup (see SHIPPING.md §6) | 0.25 / 0 |
| `POD_FREIGHT_TAX_PCT` | platform tax on the POD freight deposit | 0 |
| `PLATFORM_FEE_PERCENT` | platform fee on product cash | 5 |

## 6. ⚠️ Pending manual verification (sandbox — do before going live)

The unit suite (`npm run test:unit`) does **not** cover these server endpoints;
the payment specs are Playwright and need a live server. Run this in a **Paystack
sandbox**:

> **Note:** Pay-on-Delivery (rows 6–8) is currently **disabled — "Coming soon"**
> (GIG's API has no COD endpoint yet; see [POD.md](./POD.md) §1). Those rows apply
> only once POD is re-enabled. Card rows (1–5, 9) are live.

| # | Do | Expect |
|---|---|---|
| 1 | Card checkout, complete payment | order `PAID`/`CONFIRMED`, seller wallet credited, buyer emailed |
| 2 | Pay **less** than initialized, hit `/verify` | **409 "amount mismatch"**, order stays PENDING (never PAID) |
| 3 | Edit `shippingBreakdown[].amount` → 0 (keep token), place order | created order's `shippingCost` = token's real amount, not 0. Drop the token → logs `"shipping amount not verified"` + fallback |
| 4 | Send `currency:"USD"` to `/initialize` | 400 invalid body |
| 5 | POST `/webhook` bad signature | 401. Valid sig but amount < order total → 200 to Paystack, order **not** confirmed (log shows mismatch) |
| 6 | Start POD checkout, **abandon** on Paystack | seller wallet **not** debited; `PodDelivery.state=DEPOSIT_PENDING`, no `PLATFORM_FEE_DEBIT` |
| 7 | Complete POD deposit → `/pod-verify` (twice) | `SHIPPING_PAID`, `PodDelivery.state=DEPOSIT_PAID`, exactly **one** `PLATFORM_FEE_DEBIT` per seller |
| 8 | Fail a payment (sandbox decline) → `/verify` | variant stock incremented back, order `CANCELLED`/`FAILED`; POD → `PodDelivery.state=CANCELLED` |
| 9 | `quantity:2.5`; open POD at checkout | 400; POD 2-step visual renders with correct ₦ amounts |

## 7. Known gaps / next

- **Init idempotency key** (bug #5 remainder) — needs a migration.
- **Courier-collect POD settlement + denied-delivery refund** — BLOCKED on
  capturing a real GIG COD outcome/remittance webhook payload (see POD.md §3).
- **Bug #3 strict flip** — once the token-sending checkout is deployed, make
  `placeOrder` reject an unverified shipping breakdown instead of falling back.
