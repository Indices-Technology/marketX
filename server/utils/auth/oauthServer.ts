import { redis } from '../cache'

// ─── Client Registry ──────────────────────────────────────────────────────────

export interface OAuthClient {
  clientId: string
  clientSecret: string
  allowedRedirectUris: string[]
  name: string
}

const CLIENTS: OAuthClient[] = [
  {
    clientId: process.env.OAUTH_DASSAH_CLIENT_ID || 'dassah',
    clientSecret:
      process.env.OAUTH_DASSAH_CLIENT_SECRET ||
      'dassah_secret_change_in_production',
    allowedRedirectUris: (
      process.env.OAUTH_DASSAH_REDIRECT_URIS ||
      'http://localhost:3001/api/auth/sso/callback'
    ).split(','),
    name: 'Dassah AI',
  },
]

export function getOAuthClient(clientId: string): OAuthClient | null {
  return CLIENTS.find((c) => c.clientId === clientId) ?? null
}

export function validateOAuthClient(
  clientId: string,
  clientSecret: string,
): OAuthClient | null {
  const client = getOAuthClient(clientId)
  if (!client || client.clientSecret !== clientSecret) return null
  return client
}

export function isRedirectUriAllowed(
  client: OAuthClient,
  redirectUri: string,
): boolean {
  return client.allowedRedirectUris.some(
    (allowed) =>
      redirectUri === allowed ||
      redirectUri.startsWith(allowed.replace(/\/$/, '') + '/'),
  )
}

// ─── Auth Code Storage (10-min, one-time use) ─────────────────────────────────

const AUTH_CODE_TTL = 600

export interface AuthCodeData {
  userId: string
  email: string
  clientId: string
  redirectUri: string
}

function authCodeKey(code: string) {
  return `oauth:code:${code}`
}

export async function storeAuthCode(
  code: string,
  data: AuthCodeData,
): Promise<void> {
  if (!redis) {
    inMemoryCodes.set(code, {
      data,
      expiresAt: Date.now() + AUTH_CODE_TTL * 1000,
    })
    return
  }
  await redis.set(authCodeKey(code), JSON.stringify(data), {
    ex: AUTH_CODE_TTL,
  })
}

export async function redeemAuthCode(
  code: string,
  clientId: string,
  redirectUri: string,
): Promise<AuthCodeData | null> {
  let raw: string | null = null

  if (!redis) {
    const entry = inMemoryCodes.get(code)
    if (!entry || entry.expiresAt < Date.now()) {
      inMemoryCodes.delete(code)
      return null
    }
    raw = JSON.stringify(entry.data)
    inMemoryCodes.delete(code)
  } else {
    raw = await redis.getdel<string>(authCodeKey(code))
  }

  if (!raw) return null
  const data: AuthCodeData = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (data.clientId !== clientId || data.redirectUri !== redirectUri)
    return null
  return data
}

// ─── Refresh Token Storage (30 days) ─────────────────────────────────────────

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60

export interface RefreshTokenData {
  userId: string
  email: string
  clientId: string
}

function refreshTokenKey(token: string) {
  return `oauth:refresh:${token}`
}

export async function storeRefreshToken(
  token: string,
  data: RefreshTokenData,
): Promise<void> {
  if (!redis) {
    inMemoryRefreshTokens.set(token, {
      data,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL * 1000,
    })
    return
  }
  await redis.set(refreshTokenKey(token), JSON.stringify(data), {
    ex: REFRESH_TOKEN_TTL,
  })
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenData | null> {
  if (!redis) {
    const entry = inMemoryRefreshTokens.get(token)
    if (!entry || entry.expiresAt < Date.now()) {
      inMemoryRefreshTokens.delete(token)
      return null
    }
    return entry.data
  }
  const raw = await redis.get<string>(refreshTokenKey(token))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function revokeRefreshToken(token: string): Promise<void> {
  if (!redis) {
    inMemoryRefreshTokens.delete(token)
    return
  }
  await redis.del(refreshTokenKey(token))
}

// ─── Dev in-memory fallbacks (no Redis) ──────────────────────────────────────

const inMemoryCodes = new Map<
  string,
  { data: AuthCodeData; expiresAt: number }
>()
const inMemoryRefreshTokens = new Map<
  string,
  { data: RefreshTokenData; expiresAt: number }
>()
