/**
 * Seller identifier shapes — the four ways a buyer can hand us "this person"
 * without knowing anything about MarketX: a pasted profile link, a public
 * Seller ID (MX-LAG-J8KP), a phone number, or a social @handle.
 *
 * Shared because two places have to agree on it: the Verify lookup
 * (layers/reputation/server/api/reputation/verify.get.ts) resolves these
 * against the DB, and the search dock uses the same rules to decide, while
 * the buyer is still typing, that a query is a *who is this* question rather
 * than a *what can I buy* one. When those two drift, the dock offers a verify
 * route the endpoint can't resolve, or stays silent on one it could.
 */

export type SellerIdentifierKind = 'link' | 'id' | 'phone' | 'handle'

/** Pull a store slug out of a pasted MarketX profile link, if that's what this is. */
export function slugFromSellerLink(raw: string): string | null {
  const m = raw.match(/\/sellers\/profile\/([^/?#\s]+)/i)
  return m?.[1] ?? null
}

/** Collapse a public Seller ID to its normalized form (MX-LAG-J8KP → MXLAGJ8KP). */
export function sellerPublicIdFrom(raw: string): string | null {
  const collapsed = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return collapsed.startsWith('MX') && collapsed.length >= 6 ? collapsed : null
}

/** Digits only; last 9 tolerates +234 / leading-0 variants of the same number. */
export function phoneTailFrom(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  return d.length >= 7 ? d.slice(-9) : null
}

/** @handle or bare handle → lowercase, no leading @. */
export function handleFrom(raw: string): string | null {
  const h = raw.trim().replace(/^@/, '').toLowerCase()
  return /^[a-z0-9._]{2,40}$/.test(h) ? h : null
}

/**
 * What kind of identifier — if any — this query looks like. Checked in the
 * same precedence the Verify lookup resolves them in, so the two agree.
 *
 * `handle` requires a leading `@` here even though the lookup accepts a bare
 * one: almost every single word is a syntactically valid handle, so without
 * the sigil an ordinary search for "shoes" would be read as a person.
 */
export function sellerIdentifierKind(raw: string): SellerIdentifierKind | null {
  const q = raw.trim()
  if (!q) return null

  if (slugFromSellerLink(q)) return 'link'
  if (sellerPublicIdFrom(q)) return 'id'
  if (phoneTailFrom(q)) return 'phone'
  if (q.startsWith('@') && handleFrom(q)) return 'handle'
  return null
}

/**
 * Canonical form of a username. Usernames are stored lowercase (migration
 * 20260820120000_lowercase_usernames), so every write folds through here and
 * every lookup folds its input the same way — which keeps the queries on plain
 * equality, and therefore on the unique index.
 */
export function normalizeUsernameValue(raw: string): string {
  return raw.trim().toLowerCase()
}
