-- AuditLog: drop the FK to Profile and allow a null actor.
--
-- An audit log is an append-only historical fact. The foreign key made it both
-- failable and erasable:
--   * writing a record for an actor that no longer exists (or never did — e.g.
--     a login attempt against a deleted account) violated the constraint, the
--     queued job dead-lettered after 3 attempts, and the event was lost;
--   * ON DELETE CASCADE meant removing a Profile removed its audit history.
--
-- The actor is now a scalar id with no constraint, matching the convention
-- documented in layers/growth. Both statements are metadata-only in Postgres —
-- no table rewrite, no lock beyond a brief ACCESS EXCLUSIVE.

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_user_id_fkey";
ALTER TABLE "AuditLog" ALTER COLUMN "user_id" DROP NOT NULL;
