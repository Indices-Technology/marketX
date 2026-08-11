# Background Jobs & Scheduling

> **Status: host-independent.** The schedule lives OUTSIDE the app and drives it
> over HTTP, so jobs are no longer tied to any platform's cron support. Changing
> host means repointing a URL — no code change, no silently-dead jobs.

## The model

```
  external scheduler  ──POST──▶  /api/internal/tasks/:name  ──▶  server/tasks/*.ts
  (QStash, GH Actions,           (shared-secret guard,           (defineTask —
   cron-job.org, systemd)         Redis overlap lock)             unchanged)
```

Job *logic* stays in `server/tasks/*.ts` as plain Nitro `defineTask`s. Only the
*trigger* moved out. The same task file runs identically whether it was invoked
by the endpoint or by in-process cron, so nothing is coupled to the transport.

**Why not the platform's own cron?** Nitro `scheduledTasks` only fire on a host
that runs a long-lived Node process with the schedule runner attached. Serverless
and function hosts (Netlify, Vercel, Cloudflare) never start it — the jobs just
silently never run. `setInterval` in a plugin has the same problem, plus it
double-fires on every extra instance since there's no leader election. Both make
the schedule a property of the host, which is what we removed.

## The schedule

Single source of truth: **`server/utils/taskSchedule.ts`**. It feeds the config,
the status endpoint, and this table — edit it there, not here.

| Task | Cron (UTC) | Critical | Purpose |
|---|---|---|---|
| `releaseExpiredOrders` | `*/15 * * * *` | 🔴 | Reconciles PENDING/UNPAID orders >30 min against Paystack; confirms genuinely-paid, else cancels + restores stock. **Sole backstop for a lost payment webhook** |
| `releaseShippedOrders` | `0 */6 * * *` | 🔴 | Auto-releases seller funds for orders SHIPPED/READY_FOR_PICKUP 7+ days unconfirmed. Without it **sellers are never paid** |
| `pollCarrierTracking` | `*/30 * * * *` | 🔴 | Only mechanism advancing **GIG** orders (no delivery webhook) SHIPPED → DELIVERED |
| `reputationBackfill` | `*/20 * * * *` | 🟡 | Idempotent reputation reconciliation; replays missed signals |
| `processQueues` | `* * * * *` | ⚪ | Health-check stub — doubles as the "is the scheduler alive?" ping |

Every task is **idempotent** (conditional/atomic writes, dedupe keys), so a
retry, an overlap, or a double-fire is safe.

## Setup

### 1. Set the secret

```
TASKS_SHARED_SECRET=<long random string>
```

Required on the app. Without it the endpoints return **503** — they fail closed,
so an unset secret can never mean "anyone may run jobs that move money".

### 2. Point a scheduler at it

One HTTP call per task, on the cron above:

```
POST https://<host>/api/internal/tasks/<name>
Authorization: Bearer $TASKS_SHARED_SECRET
```

`x-tasks-key: <secret>` works too, for schedulers that can't set `Authorization`.

A plain bearer secret is deliberate — it's the one scheme every scheduler can
send. Adopting a provider's signature scheme (e.g. QStash's) would re-couple the
app to that provider, which is the thing this design avoids.

**Upstash QStash** is the natural pick (already an Upstash account), but nothing
depends on it. GitHub Actions cron, cron-job.org, a systemd timer, or a `curl`
loop on any box are all equivalent — this endpoint has no provider-specific
knowledge in it.

### 3. Verify it's actually running

```
GET https://<host>/api/internal/tasks
Authorization: Bearer $TASKS_SHARED_SECRET
```

Returns per-task `lastRun` + `stale`, and a top-level `healthy` flag.

```jsonc
{
  "healthy": false,
  "staleCritical": ["releaseShippedOrders"],  // ← alert on this
  "tasks": [ /* name, cron, critical, lastRun, stale */ ]
}
```

`stale` = no successful run within 2× the cron interval. **`healthy: false` with
a non-empty `staleCritical` means seller payouts or lost-webhook recovery are not
running.** That's the alert condition — wire it to whatever watches production.

Run records live in Redis (`tasks:lastrun:*`, 14-day TTL). Without Upstash
configured `lastRun` is always `null` and everything reports stale — the status
surface needs Redis; the tasks themselves don't.

## Option: in-process cron

For an always-on single-instance host (Railway / Render / Fly / VM / Docker) you
can skip the external scheduler:

```
NITRO_INPROCESS_CRON=true
```

Nitro then runs the same schedule internally. **Off by default** — leaving it on
by default would mean "works here, silently dead there".

Don't enable it *and* an external scheduler: both fire, work is duplicated. Safe
(tasks are idempotent) but wasteful. Don't enable it on more than one instance
either — no leader election, so every instance fires. The status endpoint reports
`inProcessCronEnabled` so you can see which mode a deployment is in.

## Concurrency

The endpoint takes a Redis lock (`tasks:lock:<name>`, 300s TTL) before running
and releases it in `finally`. An overlapping trigger returns
`{ success: true, skipped: 'locked' }` rather than running twice. With no Redis
it proceeds unlocked — a skipped money-critical run is worse than a duplicate
idempotent one. Nitro additionally dedupes concurrent runs of the same task name
within a single process.

## Serverless caveat

If the host is serverless, the function's execution timeout applies to the task
too. `releaseExpiredOrders` makes one Paystack call per stale order, so a large
backlog can exceed a 10s limit — the scheduler sees a timeout, and the run is cut
short (safe, since it's idempotent and the next tick retries, but it may never
drain). If that shows up, either move to an always-on host or chunk the task with
a batch limit per invocation.

## Still on `setInterval`

Not yet migrated to this model:

| Location | Purpose | Impact |
|---|---|---|
| `server/queues/pod-reminder.queue.ts` (`startPodReminderCron`) | POD deposit reminders | Low — POD paused at launch (`NUXT_PUBLIC_POD_ENABLED=false`). **Also has a live spam bug**: it dedupes on a floored day count while running hourly, so a matching order gets ~24 identical notifications per day. Fix when converting it to a task. |
| `server/utils/auth/rateLimiter.ts`, `server/middleware/rate-limit.ts`, `server/utils/auth/otpStore.ts` | In-memory cleanup | Harmless when Redis-backed |
| `server/utils/monitoring/authMonitoring.ts` | Periodic auth monitoring | Degraded monitoring only |

The BullMQ **workers** (`server/plugins/workers.ts`) are a separate concern and
still need a long-lived process. On a function host they don't stay up: producers
keep writing to Redis and nothing drains the queue, so notifications/emails pile
up rather than falling back to inline. Either run the workers somewhere always-on
or verify queue depth stays at zero.

## Adding a task

1. Create `server/tasks/<name>.ts` with `defineTask({ meta: { name }, run() })`.
   `meta.name` must match the filename.
2. Add it to `SCHEDULED_TASKS` in `server/utils/taskSchedule.ts` with its cron,
   purpose, and whether it's critical.
3. Add the scheduler entry pointing at `/api/internal/tasks/<name>`.
4. Make it idempotent — it will be retried and may overlap.
