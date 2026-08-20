-- The auth monitor's one remaining query groups AuditLog by event_type over a
-- 24-hour window. With only single-column indexes on event_type and created_at,
-- Postgres had to bitmap-scan both and recheck against the heap:
--
--   Bitmap Heap Scan on "AuditLog"
--     Recheck Cond: ((event_type = …) AND (created_at >= …))
--
-- A composite in that order serves the whole predicate from the index. AuditLog
-- is append-only and already the largest table in the database, so this is the
-- query that would have degraded fastest as it grows.
--
-- CONCURRENTLY so the write path is never blocked while it builds. Prisma runs
-- each migration file in a transaction by default and CREATE INDEX CONCURRENTLY
-- cannot run inside one, so this file must contain no other statement.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_event_type_created_at_idx"
  ON "AuditLog" ("event_type", "created_at" DESC);
