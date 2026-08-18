import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Facebook signed_request verification.
 *
 * Facebook's Data Deletion / Deauthorize callbacks POST a `signed_request`
 * string of the form `<sig>.<payload>`, both base64url-encoded:
 *   - `payload`  base64url(JSON) → { algorithm, issued_at, user_id, ... }
 *   - `sig`      base64url( HMAC-SHA256(payloadPart, appSecret) )
 *
 * The signature is computed over the RAW base64url `payload` segment (the string
 * as received, before decoding) — see Meta's "Parsing the signed_request".
 */

export interface FacebookSignedRequestPayload {
  algorithm: string
  issued_at?: number
  /** App-scoped Facebook user id (ASID) — the only identifier the callback gives us. */
  user_id: string
  [key: string]: unknown
}

/**
 * Verify and decode a Facebook `signed_request`. Returns the payload on success,
 * or `null` if the input is malformed, the algorithm is unexpected, or the HMAC
 * does not match. Never throws — callers branch on `null`.
 *
 * Fails closed: with no app secret configured it returns `null` (in production a
 * warning is logged) so an unsigned request can never be treated as valid.
 *
 * Two Meta apps can call these callbacks — the original login app
 * (OAUTH_FACEBOOK_CLIENT_SECRET) and the dedicated Page-management app
 * (GROWTH_FACEBOOK_CLIENT_SECRET, set once that app exists) — each signs with
 * its OWN secret, so every configured secret is tried until one verifies.
 */
export function verifyFacebookSignedRequest(
  signedRequest: string | undefined | null,
): FacebookSignedRequestPayload | null {
  const secrets = [
    process.env.OAUTH_FACEBOOK_CLIENT_SECRET,
    process.env.GROWTH_FACEBOOK_CLIENT_SECRET,
  ].filter((s): s is string => !!s)
  if (secrets.length === 0) {
    if (!import.meta.dev) {
      logger.warn(
        '[facebook signed_request] no Facebook app secret configured — rejecting',
      )
    }
    return null
  }

  if (!signedRequest || typeof signedRequest !== 'string') return null

  const dot = signedRequest.indexOf('.')
  if (dot <= 0 || dot === signedRequest.length - 1) return null

  const sigPart = signedRequest.slice(0, dot)
  const payloadPart = signedRequest.slice(dot + 1)

  let providedSig: Buffer
  try {
    providedSig = Buffer.from(sigPart, 'base64url')
  } catch {
    return null
  }
  if (providedSig.length === 0) return null

  // HMAC is over the raw base64url payload segment, not the decoded JSON.
  const verified = secrets.some((secret) => {
    const expectedSig = createHmac('sha256', secret).update(payloadPart).digest()
    return (
      providedSig.length === expectedSig.length &&
      timingSafeEqual(providedSig, expectedSig)
    )
  })
  if (!verified) return null

  let payload: FacebookSignedRequestPayload
  try {
    const json = Buffer.from(payloadPart, 'base64url').toString('utf8')
    payload = JSON.parse(json) as FacebookSignedRequestPayload
  } catch {
    return null
  }

  // Meta only signs with HMAC-SHA256; reject anything else outright.
  if (
    !payload ||
    typeof payload.algorithm !== 'string' ||
    payload.algorithm.toUpperCase().replace(/-/g, '') !== 'HMACSHA256' ||
    !payload.user_id
  ) {
    return null
  }

  return payload
}
