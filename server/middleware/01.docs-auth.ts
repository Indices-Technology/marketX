// Gates the OpenAPI documentation routes behind a shared secret.
//
// Protects ONLY the docs surface (/_openapi.json, /_scalar, /_swagger) — the
// API itself (/api/**) and the app are untouched. Staging runs in production
// mode, so without this the API map would be world-readable once deployed.
//
// Access is granted by any of:
//   - query param  ?key=<secret>     (browser-friendly; sets a cookie so the
//                                      Scalar/Swagger UI can then fetch the spec)
//   - header       x-docs-key: <secret>   (for curl / codegen tooling)
//   - cookie       docs_key=<secret>      (set automatically after ?key= works)
//
// The gate is OFF when OPENAPI_DOCS_SECRET is unset (e.g. local dev) so the
// docs stay frictionless on a developer machine.

import { getQuery, getRequestHeader, getCookie, setCookie, createError } from 'h3'

const DOC_ROUTES = ['/_openapi.json', '/_scalar', '/_swagger']
const COOKIE_NAME = 'docs_key'

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  if (!DOC_ROUTES.includes(path)) return

  const secret = process.env.OPENAPI_DOCS_SECRET
  if (!secret) return // gate disabled — open (local dev)

  const fromQuery = getQuery(event).key
  const provided =
    (typeof fromQuery === 'string' ? fromQuery : undefined) ||
    getRequestHeader(event, 'x-docs-key') ||
    getCookie(event, COOKIE_NAME)

  if (provided !== secret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API documentation requires a valid ?key=',
    })
  }

  // Came in via ?key= → drop a cookie so the same-origin spec fetch the UI
  // makes next (GET /_openapi.json) is authorised without a key in the URL.
  if (typeof fromQuery === 'string' && fromQuery === secret) {
    setCookie(event, COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })
  }
})
