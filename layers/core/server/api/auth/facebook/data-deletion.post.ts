import { randomBytes } from 'crypto'
import { defineEventHandler, readBody, getQuery, createError } from 'h3'
// verifyFacebookSignedRequest / resolveOAuthAppUrl are auto-imported from
// server/utils (same as the rest of the OAuth code) — no explicit import.

/**
 * POST /api/auth/facebook/data-deletion
 *
 * Facebook Data Deletion Request callback. Register this URL under
 * App Settings → Advanced → "Data deletion request callback URL".
 *
 * Meta POSTs `signed_request` (form-encoded) carrying the app-scoped user id and
 * expects a JSON `{ url, confirmation_code }` back — `url` is a page the user can
 * visit to check the status, `confirmation_code` is our reference for the request.
 *
 * Policy (chosen): **queue for manual review, log only.** We link accounts by
 * email at login and do not store the Facebook user id, so we cannot auto-locate
 * the account here. We verify the signature, record the app-scoped id + code in
 * the logs for an operator to action, and return the required response.
 *
 * Public endpoint — Meta calls it server-to-server (no auth cookie).
 */

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Facebook data deletion request callback',
    description:
      'Server-to-server callback Meta invokes when a user requests deletion of ' +
      'the data our app obtained via Facebook Login. Verifies the signed_request ' +
      'HMAC, records the request for manual processing, and returns a status URL ' +
      'and confirmation code.',
    responses: {
      200: { description: 'Deletion request acknowledged (url + confirmation_code)' },
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
    // A bad/absent signature is the only failure mode we surface — everything the
    // request needs is self-contained, so there is nothing transient to retry.
    logger.warn('[POST /api/auth/facebook/data-deletion] invalid signed_request', {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signed_request',
    })
  }

  const confirmationCode = `del-${randomBytes(10).toString('hex')}`

  // The durable record of the request. Manual processing keys off this line:
  // facebookUserId is the app-scoped id (ASID) Meta gave us; confirmationCode is
  // what the user sees on the status page.
  logger.info('[facebook data-deletion] request received', {
    facebookUserId: payload.user_id,
    confirmationCode,
    issuedAt: payload.issued_at,
    requestId: event.context?.requestId,
  })

  const config = useRuntimeConfig()
  const appUrl = resolveOAuthAppUrl(event, config.public.baseURL as string)

  // Meta requires exactly these two fields. `url` is a status page the user can
  // open to confirm the request is being handled.
  return {
    url: `${appUrl}/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  }
})
