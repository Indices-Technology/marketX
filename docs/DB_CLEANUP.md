# Production DB — test-data cleanup plan

> Referenced by LAUNCH_CHECKLIST §6. **Back up before deleting anything.**

## Preferred path: never let test data into prod

`prisma/seed.ts` now has a **production guard** (after the category block): when
`NODE_ENV=production` it seeds the 12-category taxonomy and **stops before any test
data**. So the clean launch sequence is:

1. Fresh/empty prod database.
2. `prisma migrate deploy` over the **direct (non-pooler)** `DATABASE_URL` (Neon
   pooler hangs on the advisory lock — see LAUNCH_CHECKLIST §3).
3. `NODE_ENV=production prisma db seed` → seeds **categories only**.
4. Manage categories thereafter via the **admin categories API**
   (`/api/admin/categories`), not the seed file.

If you follow this, **there is no test data to clean** — skip the rest of this doc.

> Do **not** set `ALLOW_TEST_SEED=true` in production. It exists only to override the
> guard in a throwaway staging DB.

## If test data already reached prod

### Marker
Every seeded person uses the **`@peppr.test`** email domain. That single marker
identifies all seeded profiles; everything else (their stores, products, posts,
stories, squares) hangs off them.

Seeded tables: `profile`, `sellerProfile`, `products` (+ `productVariant`), `post`,
`story`, `media`, `square`, `squareWallet`, `squareOfficer`, `squareMembership`.
**Never** delete `category` — it is the real taxonomy.

### Step 1 — Back up (non-negotiable)
- Neon: create a **branch** from the current prod state (instant, restorable), or
  take a snapshot. Verify you can restore it *before* proceeding.

### Step 2 — Count first (know your blast radius)
```sql
SELECT count(*) FROM "Profile" WHERE email LIKE '%@peppr.test';
-- Repeat for products/posts/etc. via the seller/author join to confirm scope.
```

### Step 3 — Delete children → parents (one transaction)
Run inside a transaction. If your FK constraints already `ON DELETE CASCADE` from
`Profile`, deleting the profiles may be enough — but verify per relation; delete
explicitly where cascade is not configured. Suggested order:

1. `story`, `media`, `post` authored by seeded profiles
2. `squareMembership`, `squareOfficer`, `squareWallet`, then `square`
3. `productVariant` → `products` owned by seeded `sellerProfile`s
4. `sellerProfile` owned by seeded profiles
5. any `orders` / `transaction` / wallet rows tied to seeded profiles (check first —
   you generally should NOT have real orders yet at launch)
6. `profile` where `email LIKE '%@peppr.test'`

Anchor every delete to the `@peppr.test` set (join through the owning profile) so a
real user can never be caught.

### Step 4 — Verify
```sql
SELECT count(*) FROM "Profile" WHERE email LIKE '%@peppr.test';  -- expect 0
SELECT count(*) FROM "Category";                                  -- expect 12 (unchanged)
```
Spot-check the app: categories intact, no seeded stores/products/squares surface.

### Step 5 — Keep the backup
Retain the Neon branch/snapshot for a few days post-launch in case a wrongly-deleted
row surfaces.
