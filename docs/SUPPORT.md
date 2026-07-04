# Support & Disputes — architecture

MarketX support is a **ticketing system** with two ticket kinds sharing one thread
model:

- **SUPPORT** — a user/seller/guest ↔ MarketX conversation (account, payment,
  "where's my order", refunds). One requester, one agent.
- **DISPUTE** — a buyer ↔ seller conflict over a specific **order**, which MarketX
  **mediates**. Both parties can post; an agent rules and can trigger a
  wallet/escrow movement. This fulfils the "dispute window" the Help FAQ already
  promises but that never existed as a system.

It is its own layer (`layers/support`) — same provider-style separation as
`payments`, `pod`, `shipping`. It **reuses** existing infra rather than
reinventing: the notification queue, the email queue, Cloudinary uploads, the
audit log, and (for dispute rulings) the wallet reversal path used by
`refuse-delivery`. It deliberately does **not** reuse the `Conversation`/`Message`
chat model — that's hard-bound to buyer↔seller participants with unique
constraints and can't carry agents, statuses, SLAs, or order context.

## 1. Roles

Agents are a **dedicated role**, separate from content moderators, so support staff
can work tickets without the power to moderate posts.

- `role = "support_agent"` (a `Profile.role` string value — the column is free-form,
  default `"user"`).
- Gate: `requireSupportAgent(event)` allows `support_agent` **and** `admin`
  (admins are a superset). Content moderators (`moderator`) are **not** support
  agents and vice-versa.

## 2. Data model

Two tables (see `prisma/schema.prisma`):

### `SupportTicket`
| Field | Notes |
|---|---|
| `ticketNumber` | `autoincrement()` — human ref, shown as `MX-<n>` |
| `type` | `SUPPORT` \| `DISPUTE` |
| `category` | `ORDER` `PAYMENT` `DELIVERY` `ACCOUNT` `SELLER` `PRODUCT` `REFUND` `OTHER` |
| `priority` | `LOW` `NORMAL` `HIGH` `URGENT` — auto-derived from category (payment/refund → HIGH) |
| `status` | `OPEN → IN_PROGRESS → PENDING_USER → RESOLVED → CLOSED` (state machine) |
| `subject` | short summary |
| `requesterId` | `Profile?` — **nullable** to support guest / checkout-placeholder buyers |
| `guestEmail` | set when `requesterId` is null (guest tickets, email replies) |
| `assignedAgentId` | `Profile?` — the owning agent |
| `orderId` / `productId` / `sellerId` | context links; `orderId` + `sellerId` required for a DISPUTE |
| `resolution` | agent's ruling summary (disputes) |
| `disputeOutcome` | `REFUND_BUYER` \| `RELEASE_SELLER` \| `PARTIAL_REFUND` \| `REJECTED` (disputes only) |
| `source` | `WEB` `EMAIL` `CHECKOUT` `ORDER` |
| `lastMessageAt` / `resolvedAt` / `closedAt` | timeline |

### `SupportMessage`
| Field | Notes |
|---|---|
| `ticketId` | FK → SupportTicket (cascade delete) |
| `authorId` | `Profile?` — null = SYSTEM message |
| `authorRole` | `REQUESTER` `SELLER` `AGENT` `SYSTEM` |
| `body` | text |
| `attachments` | `Json?` — `[{ url, name }]` Cloudinary uploads |
| `internalNote` | `true` = agent-only, hidden from the requester/seller |

## 3. Status state machine

```
OPEN ─────────► IN_PROGRESS ─────────► RESOLVED ─────► CLOSED
  │                   │  ▲                   ▲             ▲
  │                   ▼  │                   │             │
  └──────────►  PENDING_USER ───────────────┘             │
                      (any non-terminal) ─────────────────┘
```

- A new agent reply or assignment → `IN_PROGRESS`.
- Agent needs info from the user → `PENDING_USER`; the user's reply bumps it back to
  `IN_PROGRESS`.
- `RESOLVED` is soft — a reply within the reopen window bumps it back to
  `IN_PROGRESS`. `CLOSED` is terminal (requester-closed or auto-close after the
  reopen window).
- Transitions are explicit (`SUPPORT_TRANSITIONS`) — no handler jumps states.

## 4. Dispute resolution & money

A DISPUTE ties to a paid order. The agent rules with `disputeOutcome`:

| Outcome | Effect |
|---|---|
| `RELEASE_SELLER` | dispute rejected in seller's favour; order proceeds; no money moves |
| `REFUND_BUYER` | seller's pending wallet credit reversed (`walletService.reverseOrderCredit`); buyer refund recorded. Order → `CANCELLED`/`RETURNED` + stock restored |
| `PARTIAL_REFUND` | partial reversal recorded (amount entered by agent) |
| `REJECTED` | closed with no action |

> **Gateway refunds:** the wallet/escrow side is automated. Refunding the buyer's
> **card** (Paystack) is **recorded** here but executed out-of-band via the Paystack
> dashboard/refund API until we wire a `paymentService.refund` provider method — see
> PAYMENTS.md. `REFUND_BUYER` credits `BuyerWallet` as the on-platform refund path;
> card reversal is the manual follow-up.

## 5. Layer shape

```
layers/support/server/
  utils/types.ts            enums mirror, SUPPORT_TRANSITIONS, categoryPriority(), ticketRef()
  repositories/support.repository.ts   Prisma access
  services/support.service.ts          createTicket · reply · assign · transition ·
                                       openDispute · resolveDispute (+ notify/email)
  api/support/
    tickets/index.post.ts     create (auth or guest)
    tickets/index.get.ts      my tickets
    tickets/[id]/index.get.ts thread (requester | seller party | agent)
    tickets/[id]/messages.post.ts  reply
    tickets/[id]/close.post.ts     requester closes
    orders/[id]/dispute.post.ts    buyer opens a dispute on an order
    agent/tickets/index.get.ts     queue (requireSupportAgent)
    agent/tickets/[id].patch.ts    assign / status / priority
    agent/tickets/[id]/resolve.post.ts  resolve (+ dispute outcome/refund)
```

## 6. Surfaces

- **Help page** (`layers/core/app/pages/Help.vue`) — the dead "Live Chat" button +
  `mailto:` become a real **contact form** that creates a ticket.
- **My tickets** — `/support` (list) + `/support/[id]` (thread) for logged-in users.
- **Order help / dispute** — a "Get help with this order" / "Open a dispute" button on
  the buyer order detail, prefilled with order context.
- **Agent queue** — in the admin layer, `/admin/support` (filter by status/priority,
  assign, reply, internal notes, resolve). Gated by `requireSupportAgent`.

## 7. Guardrails

- **Rate-limit** ticket creation (spam) — 5 open tickets per requester.
- **Notifications**: new ticket → agents; agent reply → requester (`SUPPORT_REPLY`);
  dispute opened → seller + agents; resolution → both parties. Email fallback for
  guests (no in-app account).
- **Authorization**: a thread is readable only by its requester, the seller party
  (disputes), or an agent. `internalNote` messages are stripped for non-agents.

## 8. Build status (July 2026)

**Built & wired (this pass):**
- Schema: `SupportTicket` + `SupportMessage` + 7 enums, relations on
  Profile/Orders/SellerProfile. Migrations `20260704000000_support_tickets` and
  `20260704000001_support_notification_type` applied; client regenerated.
- Role gate `requireSupportAgent` (`support_agent | admin`).
- `layers/support/server`: types (state machine, `categoryToPriority`), repository,
  service (create · reply · close · openDispute · agent update/reply/resolve ·
  `applyDisputeOutcome`).
- Routes under `/api/support/**` (requester + dispute + agent).
- Notifications: `SUPPORT` type added to the enum + `typeMap` (no GENERAL downgrade).
  Email builders `buildSupportTicketCreatedEmail` / `buildSupportReplyEmail`.
- Layer registered in `nuxt.config.ts`.
- UI: `SupportNewTicketModal`, `/support` (list), `/support/[id]` (thread),
  `/support/agent` (agent queue + resolve), Help-page "Submit a ticket", and a
  "Get help / Report a problem" button on the buyer order detail.

**How to appoint an agent:** set a `Profile.role` to `support_agent` (or `admin`).
There is no UI for role assignment yet — do it in the DB / an admin script.

**Config:** `SUPPORT_EMAIL` env var sets the reply-to on outgoing support emails
(defaults to `support@marketx.app`).

**Not yet done / verify:**
- No automated tests yet (Playwright API specs are the natural next step).
- Not run through a full typecheck/dev boot — restart the dev server so the new
  layer + migrations load, then smoke-test the flows.
- **PARTIAL_REFUND** records the amount + reverses nothing automatically (manual).
  **REFUND_BUYER** reverses the seller's *pending* credit + cancels the order; the
  buyer's **card** refund is manual via Paystack until `paymentService.refund` exists.
- Live-chat (phase 2 over Pusher) and dynamic knowledge-base search (Help FAQ still
  static) remain.
