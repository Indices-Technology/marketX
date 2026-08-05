import { createHmac } from 'crypto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { verifyFacebookSignedRequest } from '../auth/facebookSignedRequest'

// The util logs via the server-side auto-imported `logger` global on the
// fail-closed path; stub it so those branches don't ReferenceError under vitest.
vi.stubGlobal('logger', { warn: vi.fn(), info: vi.fn(), logError: vi.fn() })

const SECRET = 'test-app-secret'

/** Build a valid `<sig>.<payload>` signed_request the way Facebook does. */
function makeSignedRequest(
  payload: Record<string, unknown>,
  secret = SECRET,
): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${sig}.${encoded}`
}

describe('verifyFacebookSignedRequest', () => {
  const original = process.env.OAUTH_FACEBOOK_CLIENT_SECRET

  beforeEach(() => {
    process.env.OAUTH_FACEBOOK_CLIENT_SECRET = SECRET
  })
  afterEach(() => {
    process.env.OAUTH_FACEBOOK_CLIENT_SECRET = original
  })

  it('accepts a correctly signed request and returns the payload', () => {
    const sr = makeSignedRequest({
      algorithm: 'HMAC-SHA256',
      issued_at: 1700000000,
      user_id: '1234567890',
    })
    const result = verifyFacebookSignedRequest(sr)
    expect(result).not.toBeNull()
    expect(result?.user_id).toBe('1234567890')
  })

  it('rejects a request signed with the wrong secret', () => {
    const sr = makeSignedRequest(
      { algorithm: 'HMAC-SHA256', user_id: '1' },
      'attacker-secret',
    )
    expect(verifyFacebookSignedRequest(sr)).toBeNull()
  })

  it('rejects a request whose payload was tampered after signing', () => {
    const sr = makeSignedRequest({ algorithm: 'HMAC-SHA256', user_id: '1' })
    const [sig] = sr.split('.')
    const forged = Buffer.from(
      JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '999' }),
    ).toString('base64url')
    expect(verifyFacebookSignedRequest(`${sig}.${forged}`)).toBeNull()
  })

  it('rejects a non HMAC-SHA256 algorithm', () => {
    const sr = makeSignedRequest({ algorithm: 'PLAINTEXT', user_id: '1' })
    expect(verifyFacebookSignedRequest(sr)).toBeNull()
  })

  it('rejects a payload missing user_id', () => {
    const sr = makeSignedRequest({ algorithm: 'HMAC-SHA256' })
    expect(verifyFacebookSignedRequest(sr)).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(verifyFacebookSignedRequest('')).toBeNull()
    expect(verifyFacebookSignedRequest(undefined)).toBeNull()
    expect(verifyFacebookSignedRequest('no-dot-here')).toBeNull()
    expect(verifyFacebookSignedRequest('.onlypayload')).toBeNull()
    expect(verifyFacebookSignedRequest('onlysig.')).toBeNull()
  })

  it('fails closed when no app secret is configured', () => {
    delete process.env.OAUTH_FACEBOOK_CLIENT_SECRET
    const sr = makeSignedRequest({ algorithm: 'HMAC-SHA256', user_id: '1' })
    expect(verifyFacebookSignedRequest(sr)).toBeNull()
  })
})
