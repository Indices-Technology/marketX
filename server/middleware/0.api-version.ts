/**
 * API version alias.
 *
 * Exposes the current handlers under a stable `/api/v1/*` URL so independently
 * deployed consumers (mobile app, Dasah, partners) can pin a versioned contract
 * — WITHOUT us moving ~285 route files or touching client call sites. The
 * same-repo web app keeps calling the unversioned `/api/*`, which is identical.
 *
 * Contract & policy:
 *   - `/api/*` IS the v1 contract. `/api/v1/*` is an explicit synonym for it.
 *   - Evolve `/api/*` **additive-only** (never remove/rename response fields) so
 *     v1 clients never break.
 *   - Ship a genuinely breaking change as a **new physical route** under
 *     `server/api/v2/<endpoint>.ts` (it is NOT aliased here, so it stays
 *     independent). The web app migrates to `/api/v2/...` at its own pace; v1
 *     consumers are untouched.
 *
 * Runs first (the `0.` filename prefix orders it ahead of rate-limit/auth) so
 * downstream sees the canonical `/api/*` path — unified rate-limit buckets and
 * correct `/api/auth/*` tiering regardless of the version prefix.
 */
export default defineEventHandler((event) => {
  const url = event.node.req.url
  if (url && url.startsWith('/api/v1/')) {
    // '/api/v1'.length === 7 → strip the version segment, keep path + query.
    event.node.req.url = '/api' + url.slice(7)
  }
})
