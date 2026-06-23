# Pending baseline migration

`*_baseline.sql` here is a **full, verified schema baseline** generated from
`prisma/schema.prisma` with:

```bash
prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

It exists because the live schema **drifted** from `prisma/migrations/` — the Squares
feature, the AI/`Embedding` tables, the `vector` extension, and the Post wall columns
were applied via `prisma db push` and were never written as migrations (see
`docs/DATABASE.md` §4.1). This baseline captures the **true current schema**, including
`CREATE EXTENSION IF NOT EXISTS "vector"`.

## It is deliberately OUTSIDE `prisma/migrations/`

If it lived in `prisma/migrations/`, `prisma migrate deploy` would try to apply it
**and** the old (partial) migrations → duplicate-table errors. So it sits here until
the cutover.

## Activate it during the Neon→Supabase cutover (docs/DATABASE.md §6, Option 1)

After restoring the live data into Supabase (Runbook A):

```bash
# 1. Archive the old, drifted migrations (they no longer reflect reality)
mkdir -p prisma/migrations_archive
git mv prisma/migrations/* prisma/migrations_archive/    # keep migration_lock.toml in migrations/

# 2. Promote this baseline into the migrations folder
mkdir -p prisma/migrations/20260622174601_baseline
git mv prisma/baseline/20260622174601_baseline.sql prisma/migrations/20260622174601_baseline/migration.sql

# 3. Mark it applied on the restored DB (the tables already exist from the dump)
prisma migrate resolve --applied 20260622174601_baseline

# 4. Verify zero drift against the live DB
prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
#   exit 0 = no drift ✅
```

From here, `prisma migrate dev` works normally for all future changes.

> Regenerate anytime if the schema changes before cutover — it's a pure function of
> `schema.prisma`.
