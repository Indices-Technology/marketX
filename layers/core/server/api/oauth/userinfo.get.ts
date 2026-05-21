import { defineEventHandler, getHeader, createError } from 'h3'
import { jwtVerify } from '~~/server/utils/auth/auth'
import { profileService } from '~~/layers/profile/server/services/profile.service'

/**
 * GET /api/oauth/userinfo
 *
 * OIDC-compatible userinfo endpoint. The client passes the access_token
 * it received from /api/oauth/token as a Bearer token.
 *
 * Returns a subset of the user's profile suitable for identity federation.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing Bearer token' })
  }

  const token = authHeader.slice(7)
  let payload
  try {
    payload = jwtVerify(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  const profile = await profileService.getProfile(payload.userId)

  return {
    sub: profile.id,
    email: profile.email,
    email_verified: profile.emailVerified ?? false,
    name: profile.username,
    picture: profile.avatar ?? null,
    role: profile.role,
  }
})
