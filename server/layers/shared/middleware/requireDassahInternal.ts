import { createError, getHeader, type H3Event } from 'h3'

/**
 * Guards an endpoint so only Dassah's indexing worker can call it.
 *
 * Callers must send:  X-Dassah-Internal: <DASSAH_INTERNAL_KEY>
 *
 * Never expose these endpoints through the public API gateway.
 * Add them to the rate-limit exclusion list in server/middleware/rate-limit.ts.
 */
export function requireDassahInternal(event: H3Event): void {
  const provided = getHeader(event, 'x-dassah-internal')
  const expected = process.env.DASSAH_INTERNAL_KEY

  if (!expected) {
    // Misconfigured server — fail loudly so it's caught in dev
    throw createError({
      statusCode: 503,
      statusMessage: 'Internal service key not configured',
    })
  }

  if (!provided || provided !== expected) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
}
