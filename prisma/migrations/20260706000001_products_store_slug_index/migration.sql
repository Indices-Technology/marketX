-- Seller storefront/management grid and countProducts filter by store_slug
-- (optionally + status) and order by created_at DESC. Without this index those
-- queries fell back to a full table scan on Products.
--
-- Note: for a large production table, apply this as
--   CREATE INDEX CONCURRENTLY ...
-- outside a migration transaction to avoid locking writes. Prisma runs
-- migrations in a transaction, so this file uses a plain CREATE INDEX.
CREATE INDEX "Products_store_slug_status_created_at_idx" ON "Products"("store_slug", "status", "created_at" DESC);
