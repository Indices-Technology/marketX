# MarketX — Database Connection & Migration Reference

> How the app connects to PostgreSQL, the known irregularities found during the
> Neon→Supabase audit (2026-06-22), the fragile dependencies, and the runbooks to
> move providers and fix migration drift. Read **§4 (audit)** before any migration.

---

## 1. Connection architecture

| Piece | Detail |
|---|---|
| Engine | PostgreSQL (+ `pgvector`) |
| ORM | Prisma 7 with the **driver-adapter** pattern (`@prisma/adapter-pg`) |
| Runtime pool | `pg.Pool` in `server/utils/db.ts` (single instance, HMR-persisted in dev) |
| CLI / migrations | `prisma.config.ts` supplies the URL to the Prisma CLI |
| Source of truth | **`DATABASE_URL`** env var — every connection reads it |

**Why no `url` in the `datasource` block?** With the driver adapter, the runtime
connection comes from the `pg.Pool` we build, not from `datasource.url`. The Prisma
*CLI* (migrate/db pull) still needs a URL — that's what `prisma.config.ts`
(`datasource.url = process.env.DATABASE_URL`) provides. So the schema's
`datasource db { provider = "postgresql"; extensions = [vector] }` is intentional,
not a mistake.

### Pool configuration (`server/utils/db.ts`)

```
max: 10                       # ceiling on concurrent connections
idleTimeoutMillis: 30_000     # drop idle clients after 30s
connectionTimeoutMillis: 10_000
keepAlive: true               # hold TCP open (was tuned for Neon auto-suspend)
```

- `pool.on('error')` only **logs** — without it, a dropped idle socket throws an
  uncaught exception and crashes the process. Keep this listener.
- A connection is **warmed on boot** so the first request isn't cold.
- `max: 10` is comfortably under Supabase free's ~60 direct-connection limit, even
  with a couple of developer connections and a migration running.

---

## 2. Connection points (everything that opens a DB connection)

`DATABASE_URL` is the single source of truth, but many places build their own pool.
After a provider change, all of these follow automatically — **except** the Python
tool, which is a separate driver.

| Location | Purpose |
|---|---|
| `server/utils/db.ts` | **Main app pool** (the one that matters) |
| `prisma.config.ts` | Prisma CLI / migrations |
| `prisma/seed.ts` | Seeder |
| `scripts/*.{ts,mjs}` (~10) | One-off maintenance/seed scripts (own pools) |
| `tests/scripts/verify-reset-token.cjs` | Test helper |
| `PythonUtils/embed_all.py` | **Separate** — `psycopg2`, reads the same `DATABASE_URL` |

---

## 3. pgvector handling

- The `Embedding.embedding` column is `Unsupported("vector(1536)")?` — Prisma tracks
  the column but never serializes it. **All reads/writes use `$queryRaw` /
  `$executeRaw`.**
- The `vector` extension must exist in the database **before** the `Embedding` table
  is usable.
- **Never** run `prisma db push --accept-data-loss` — it can drop the vector column.

---

## 4. ⚠️ Audit findings (2026-06-22)

### 4.1 Migration drift — CRITICAL

The migration history (`prisma/migrations/`) is **out of sync with the live schema.**
Migrations create ~44 tables but **do not** include:

- the `vector` **extension**
- the **Squares** feature: `Square`, `SquareMembership`, `SquareOfficer`,
  `SquareWallet`, `SquareTransaction`, `UserSquareFollow`, `SquareAnnouncement`,
  `SquareRequest`, …
- the **AI** tables: `Embedding`, `UserAIProfile`
- the Post **wall** columns (`wallTargetType`, `wallTargetSlug`)

These were applied to the live DB with `prisma db push` and never written as
migrations. **Consequence:** running `prisma migrate deploy` against a fresh database
builds an **incomplete** schema (no Squares, no AI, no vector) → the app half-breaks.

> **Therefore the provider move must copy the *live* structure (via `pg_dump`), not
> rebuild from migrations.** See §5. Fixing the drift itself is §6.

### 4.2 Connection-string portability

The current Neon URL uses Neon-specific params:
`?sslmode=require&channel_binding=require`. **`channel_binding` is Neon-only** — drop
it for Supabase (`?sslmode=require`). Because the URL lives only in `DATABASE_URL`,
this is a one-line env change, but copying the Neon params verbatim will fail.

### 4.3 Migrations need a *direct* connection

On Supabase, the **transaction pooler (port 6543)** does not support DDL / advisory
locks reliably — migrations can hang or fail. Use the **direct connection (port
5432)** for migrations. Since the app pool is bounded (`max: 10`), the app can also
use the direct connection — **simplest: use the Supabase direct URL everywhere.** If
you later need the pooler for the app, add a separate `DIRECT_URL` for the CLI.

### 4.4 Stale provider coupling (cosmetic, now fixed)

`server/config/env.ts` described `DATABASE_URL` as "(Neon)"; `server/utils/db.ts`
referenced "Neon auto-suspend". Both generalised — the code is provider-agnostic.

---

## 5. Runbook A — Move Neon → Supabase (data + structure)

Because of the drift (§4.1), copy the live database directly.

```bash
# 0. In Supabase: create project → SQL editor → enable pgvector
#    create extension if not exists vector;

# 1. Dump the live Neon DB (schema + data, portable flags)
pg_dump "$NEON_DATABASE_URL" \
  --no-owner --no-acl --format=plain \
  --file=marketx_dump.sql

# 2. Restore into Supabase (use the DIRECT connection, port 5432)
psql "$SUPABASE_DIRECT_URL" --file=marketx_dump.sql

# 3. Point the app at Supabase  (drop channel_binding!)
#    DATABASE_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres?sslmode=require

# 4. Verify
#    - prisma db pull   (schema matches — no surprises)
#    - app boots, a feed/products query returns rows
#    - an embeddings $queryRaw path returns rows (pgvector works)
```

> If `pg_dump` version mismatches the server, use the Supabase/Neon-recommended
> client version, or run `pg_dump` from the same major version as the source.

---

## 6. Runbook B — Fix the migration drift (do once, after §5)

Goal: make `prisma/migrations` represent the **actual** schema so future deploys are
correct. Two clean options:

**Option 1 — Baseline (recommended, lowest risk).** Treat the current schema as a new
starting point.
```bash
# Generate a single migration that captures the FULL current schema
prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_baseline/migration.sql
# Mark it as already-applied on the (restored) DB so it isn't re-run
prisma migrate resolve --applied <timestamp>_baseline
```
Then archive the old migrations (they no longer reflect reality). New changes flow
through `prisma migrate dev` normally from here.

**Option 2 — Catch-up migration.** Keep history; add one migration for only the
missing objects (vector ext, Squares, AI, wall):
```bash
prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$TEMP_SHADOW_DB_URL" \
  --script > prisma/migrations/<timestamp>_catchup/migration.sql
prisma migrate resolve --applied <timestamp>_catchup
```

Either way: **add `CREATE EXTENSION IF NOT EXISTS vector;` as the first line** of the
baseline/catch-up migration so a from-scratch deploy provisions pgvector.

> Verify the fix: on a fresh empty DB, `prisma migrate deploy` must produce a schema
> that `prisma migrate diff --from-schema-datasource --to-schema-datamodel` reports as
> **empty** (no drift).

---

## 7. Fragile dependencies — summary

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Migration drift** — `migrate deploy` builds an incomplete DB | Move via `pg_dump` (§5); baseline migrations (§6) |
| 2 | pgvector extension absent on a new DB | `create extension vector;` first; include in baseline |
| 3 | Neon-only `channel_binding` in the URL | Use Supabase format; `DATABASE_URL` is the only place to change |
| 4 | Migrations on the transaction pooler fail | Use the **direct** connection (port 5432) |
| 5 | `pool.on('error')` removed → process crash on dropped socket | Keep the listener |
| 6 | `db push --accept-data-loss` drops the vector column | Never run it on this project |
| 7 | Python tool uses a separate driver (`psycopg2`) | Ensure it reads the same `DATABASE_URL` |

---

## 8. Per-request DB query metrics

A built-in counter logs how many DB queries each API request makes — your guard
against N+1 regressions before they reach a production bill.

**Files:** `server/utils/dbMetrics.ts` (counter), `server/utils/db.ts`
(`$extends` hook that increments it), `server/plugins/dbMetrics.ts` (opens a
per-request store, logs on response). Linking a query to its request relies on
`nitro.experimental.asyncContext: true` (nuxt.config.ts).

**Reading it** — in dev, every API request logs:
```
[db-metrics] /api/feed/home → 3 queries  {"findMany":2,"count":1}
```
Anything at/above the threshold is flagged:
```
[db-metrics] /api/some/route → 22 queries  {...}  ⚠️ possible N+1
```

**Controls (env):**
| Var | Effect |
|---|---|
| _(none, dev)_ | On by default in non-production |
| `DB_METRICS=1` | Force on in production (temporary profiling) |
| `DB_METRICS_WARN=15` | N+1 warning threshold (default 15) |

**Baseline (2026-06-22)** — healthy, no N+1:
| Endpoint | Queries |
|---|---|
| `/api/feed/home` | 3 (`findMany ×2` + `count`) |
| `/api/commerce/products` | 2 (`findMany` + `count` — `total` used by category page) |
| `/api/seller/{slug}` | 2 (`findUnique` + follower `count`) |
| `/api/squares`, `/api/commerce/categories` | 1 |

> Both `count` queries above are **used data** (pagination total shown on category
> pages; follower count on the store), not waste — verified before any change.
> The one deeper lever, if ever needed: maintain `SellerProfile.followers_count`
> at write-time (on follow/unfollow) instead of recomputing it live per store view.

> Overhead: inert unless a per-request store is open, so production cost is a
> single `useEvent()` lookup per query when `DB_METRICS` is off.

---

*Last updated: 2026-06-23 (query metrics added).*
