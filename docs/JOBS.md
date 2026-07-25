# Background Jobs & Scheduling — inventory + launch risk

> **Status: HIGH-STAKES / REVIEW BEFORE OR SHORTLY AFTER LAUNCH.**
> This documents a structural fragility, not a bug. It is deferred deliberately so
> we can launch, but the money-/fulfillment-critical jobs below **must** actually
> run in production. Revisit when we plan the jobs migration.

## The core risk

Every scheduled job today assumes a **single, always-on Node process**. There are
two mechanisms, both fragile in different ways:

1. **Nitro `scheduledTasks`** (`nitro.experimental.tasks: true`, configured in
   `nuxt.config.ts`). These only fire if the deploy target actually runs Nitro's
   task scheduler. **Most serverless/function platforms (Vercel, Netlify
   functions, Cloudflare) do NOT run them.** A persistent host (Railway, Render,
   Fly, a VM, Docker) does.
2. **`setInterval` inside server plugins.** These need a long-lived process (die on
   serverless / scale-to-zero) and **double-fire** if more than one instance runs
   (no leader election).

If prod is a single always-on instance, everything works today. It silently breaks
on serverless, and duplicates on horizontal scaling.

## A. Jobs that depend SOLELY on Nitro `scheduledTasks`

Source: `server/tasks/*`. Schedules in `nuxt.config.ts` → `nitro.scheduledTasks`.

| Task | Schedule | Purpose | Blast radius if it never runs |
|---|---|---|---|
| `releaseExpiredOrders` | */15 min | Reconciles PENDING/UNPAID orders >30 min: asks Paystack, confirms if genuinely paid, else cancels + restores stock | 🔴 **Only backstop for lost Paystack webhooks/redirects.** Paid-but-unwebhooked orders stay PENDING forever (buyer charged, no fulfillment, seller uncredited); abandoned orders never free reserved stock |
| `releaseShippedOrders` | every 6 h | Auto-releases seller funds for orders SHIPPED 7+ days with no buyer confirmation → DELIVERED + release + reputation | 🔴 **Sellers never paid** for delivered-but-unconfirmed orders; funds stuck in `pending_balance` indefinitely |
| `pollCarrierTracking` | */30 min | Only mechanism advancing **GIG** (no delivery webhook) orders SHIPPED→DELIVERED + release | 🔴 **GIG orders never progress**; funds never release; buyer never notified |
| `reputationBackfill` | */20 min | Idempotent reputation reconciliation (replays missed signals) | 🟡 Trust figures lag; live emission still best-effort |
| `processQueues` | every 1 min | Health-check stub | ⚪ None (no-op) |

**3 of 5 are money-/fulfillment-critical.** `releaseExpiredOrders` is the safety net
for exactly the lost-webhook failure mode that already affected the carrier webhooks.

All are **idempotent** (conditional/atomic writes, dedupe keys), so re-running or
double-firing is safe — which makes them easy to drive from any external trigger.

## B. `setInterval`-based jobs (need a persistent process, not Nitro cron)

| Location | Purpose | Launch impact |
|---|---|---|
| `server/queues/pod-reminder.queue.ts` (`startPodReminderCron`) | POD deposit reminders | Low — POD paused at launch (`NUXT_PUBLIC_POD_ENABLED=false`) |
| `server/utils/auth/rateLimiter.ts`, `server/middleware/rate-limit.ts`, `server/utils/auth/otpStore.ts` | In-memory cleanup | Harmless when Redis-backed |
| `server/utils/monitoring/authMonitoring.ts` | Periodic auth monitoring checks | Degraded monitoring only |

## Launch requirement (interim)

Until the migration below, **deploy to a single always-on Node host** (Railway /
Render / Fly / VM / Docker — NOT serverless functions) and **verify after deploy
that the scheduled tasks actually fire** (look for the `[task:*] fired` log lines).
Do **not** horizontally scale the web process without addressing duplicate firing.

## Framework options (for the migration — not yet decided)

- **Option A — external cron → secured internal endpoints.** Expose
  `POST /api/internal/tasks/<name>` behind a shared-secret guard (tasks are already
  idempotent) and drive them from one reliable scheduler (Upstash QStash / GitHub
  Actions cron / platform cron). Portable across any host, survives serverless,
  exactly-once-ish.
- **Option B — BullMQ repeatable jobs.** We already run `QUEUE_REDIS_URL` for
  workers; add repeatable (cron) jobs so Redis is the single schedule source (no
  duplicate firing across instances). Needs the worker process always-on.

Decision + implementation deferred. See also `docs/PAYMENTS.md` (§6b) and the
launch checklist §3/§9.
