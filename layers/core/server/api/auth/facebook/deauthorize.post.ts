import { defineEventHandler, readBody, getQuery, setResponseStatus } from 'h3'
// verifyFacebookSignedRequest is auto-imported from server/utils (same as the
// rest of the OAuth code) — no explicit import.

/**
 * POST /api/auth/facebook/deauthorize
 *
 * Facebook Deauthorize callback. Register this URL under
 * Facebook Login → Settings → "Deauthorize callback URL".
 *
 * Meta POSTs `signed_request` (form-encoded) carrying the app-scoped user id when
 * a person removes our app from their Facebook account. Unlike the data-deletion
 * callback, Meta expects no response body — just a 2xx.
 *
 * Policy (same as data-deletion): **log only, no schema change.** Login links
 * accounts by email and does not store the Facebook user id, so we cannot
 * auto-locate the account here. We verify the signature and record the
 * app-scoped id for an operator to action. Always 2xx on a valid request so Meta
 * does not keep retrying.
 *
 * Public endpoint — Meta calls it server-to-server (no auth cookie).
 */

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Facebook deauthorize callback',
    description:
      'Server-to-server callback Meta invokes when a user removes the app from ' +
      'their Facebook account. Verifies the signed_request HMAC and logs the ' +
      'app-scoped user id for cleanup. Returns 200 on success, 400 on a bad ' +
      'signature.',
    responses: {
      200: { description: 'Deauthorization acknowledged' },
      400: { description: 'Missing or invalid signed_request' },
    },
  },
})
export default defineEventHandler(async (event) => {
  // Meta sends application/x-www-form-urlencoded { signed_request }. Be tolerant
  // of a JSON body too.
  let signedRequest: string | undefined
  try {
    const body = await readBody<Record<string, unknown>>(event).catch(() => null)
    if (body && typeof body.signed_request === 'string') {
      signedRequest = body.signed_request
    }
  } catch {
    signedRequest = undefined
  }
  if (!signedRequest) {
    const q = getQuery(event)
    if (typeof q.signed_request === 'string') signedRequest = q.signed_request
  }

  const payload = verifyFacebookSignedRequest(signedRequest)
  if (!payload) {
    logger.warn('[POST /api/auth/facebook/deauthorize] invalid signed_request', {
      requestId: event.context?.requestId,
    })
    // 400 (not 200) so an unsigned/forged call isn't silently treated as a real
    // deauthorization. Meta only retries on 5xx, so this won't loop.
    setResponseStatus(event, 400)
    return { ok: false }
  }

  // Durable record for manual cleanup: facebookUserId is the app-scoped id (ASID)
  // whose data we should scrub on request. Mirrors the data-deletion log line.
  logger.info('[facebook deauthorize] user removed app', {
    facebookUserId: payload.user_id,
    issuedAt: payload.issued_at,
    requestId: event.context?.requestId,
  })

  return { ok: true }
})
