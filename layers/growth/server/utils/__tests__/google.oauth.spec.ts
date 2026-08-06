import { describe, it, expect, beforeEach } from 'vitest'
import {
  googleGbpAuthorizeUrl,
  GOOGLE_GBP_CONNECT_SCOPES,
} from '../google.oauth'

describe('googleGbpAuthorizeUrl', () => {
  beforeEach(() => {
    process.env.OAUTH_GOOGLE_CLIENT_ID = 'test-client-id'
  })

  const build = () =>
    new URL(
      googleGbpAuthorizeUrl(
        'state-123',
        'https://app.example.com/api/growth/connect/google/callback',
      ),
    )

  it('points at the Google OAuth 2.0 authorize endpoint', () => {
    const url = build()
    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    )
  })

  it('carries the client id, redirect uri, and state through', () => {
    const q = build().searchParams
    expect(q.get('client_id')).toBe('test-client-id')
    expect(q.get('redirect_uri')).toBe(
      'https://app.example.com/api/growth/connect/google/callback',
    )
    expect(q.get('state')).toBe('state-123')
    expect(q.get('response_type')).toBe('code')
  })

  it('requests offline access with forced consent so a refresh token is returned', () => {
    const q = build().searchParams
    // offline + consent are what guarantee a refresh_token on re-consent.
    expect(q.get('access_type')).toBe('offline')
    expect(q.get('prompt')).toBe('consent')
  })

  it('requests the business.manage scope (unlocks all GBP sub-APIs)', () => {
    const scope = build().searchParams.get('scope') ?? ''
    expect(scope).toContain('https://www.googleapis.com/auth/business.manage')
    // The default scope constant is what gets requested when no override is set.
    expect(GOOGLE_GBP_CONNECT_SCOPES).toContain('business.manage')
  })
})
