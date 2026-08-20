-- Usernames become case-insensitive by being stored lowercase.
--
-- Before this, `Josh` and `josh` were two claimable accounts, while profile
-- lookups matched case-insensitively — so `/profile/josh` resolved to whichever
-- row the planner happened to return first. The application compensated with
-- ILIKE, which no btree index can serve: every profile view, follow check and
-- username check was a sequential scan of "Profile", and would stay one at any
-- table size.
--
-- Folding the stored value to lowercase makes the existing unique index
-- ("Profile_username_key") both the correctness guarantee and the fast path,
-- with plain equality on the query side.

-- 1. Resolve any case-collisions BEFORE folding, or the unique index rejects the
--    update. The oldest account keeps the name it has been using; newer ones are
--    suffixed. Falls back to an id fragment if the numbered candidate is itself
--    taken. Expected to affect zero rows on a database that has only ever been
--    written by this app, but a rejected migration at deploy time is worse than
--    a no-op.
WITH dupes AS (
  SELECT
    id,
    lower(username) AS folded,
    row_number() OVER (
      PARTITION BY lower(username) ORDER BY created_at, id
    ) AS rn
  FROM "Profile"
  WHERE username IS NOT NULL
)
UPDATE "Profile" p
SET username = CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM "Profile" x
    WHERE x.username = d.folded || (d.rn - 1)::text
  ) THEN d.folded || (d.rn - 1)::text
  ELSE d.folded || '_' || left(replace(d.id::text, '-', ''), 6)
END
FROM dupes d
WHERE p.id = d.id
  AND d.rn > 1;

-- 2. Fold the rest.
UPDATE "Profile"
SET username = lower(username)
WHERE username IS NOT NULL
  AND username <> lower(username);
