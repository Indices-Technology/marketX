// FILE PATH: server/layers/shared/middleware/requireAuth.ts

/**
 * Custom JWT Authentication Middleware
 *
 * Validates custom JWT tokens (NOT Supabase)
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify with custom JWT_SECRET
 * 3. Fetch user from database
 * 4. Set event.context.user for downstream handlers
 */

import { createError, getHeader, type H3Event } from 'h3'
import { jwtVerify } from '../../../utils/auth/auth'
import { IProfile } from '~~/layers/profile/app/types/profile.types'

/**
 * Require authentication
 * Throws 401 if not authenticated
 */
export async function requireAuth(event: H3Event) {
  try {
    // 0. Per-request memoization. requireAuth (and optionalAuth) can be called by
    //    several layers within a single request; the token verify + DB loads only
    //    need to happen once. Subsequent calls reuse the resolved user.
    //
    //    Only reuse a FULLY-resolved profile (one this function loaded). The global
    //    auth middleware (server/middleware/auth.global.ts) pre-populates
    //    event.context.user with a lightweight { id, email, role } straight from
    //    the JWT — that object has no sellerProfile, so trusting it here would make
    //    every seller-only handler see sellerProfile === undefined and 403. The
    //    `sellerProfile` key is always present (possibly null) once we've done the
    //    full load below, so its presence marks a resolved user.
    if (event.context.user && 'sellerProfile' in event.context.user) {
      return event.context.user as IProfile
    }

    // 1. Get auth header
    const authHeader = getHeader(event, 'authorization')

    //TODO  I think we should check for the content type of the request here

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No token provided',
      })
    }

    // 2. Extract token (remove "Bearer " prefix)
    const token = authHeader.slice(7)

    // 3. Verify token with custom JWT
    let payload
    try {
      payload = jwtVerify(token)
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid or expired token',
      })
    }

    if (!payload || !payload.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid token',
      })
    }

    // 3b + 4. Session-revocation check and profile load are independent reads, so
    // run them in parallel instead of serially — this halves the auth round-trips
    // that sit on the critical path of every authenticated request.
    //
    // Session revocation is only checked when sessionId is present in the token.
    // Tokens issued before this check was added won't have sessionId and are
    // allowed through until they expire naturally (max 24 h).
    const [session, user] = await Promise.all([
      payload.sessionId
        ? prisma.session.findUnique({
            where: { id: payload.sessionId },
            select: { revokedAt: true, expiresAt: true },
          })
        : Promise.resolve(null),
      prisma.profile.findUnique({
        where: { id: payload.userId },
        include: {
          sellerProfile: {
            where: { is_active: true },
            take: 1,
          },
        },
      }),
    ])

    if (payload.sessionId) {
      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - Session revoked',
        })
      }
    }

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found',
      })
    }

    // 5. Set user in event context for downstream handlers
    event.context.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.email_verified,
      sellerProfile: user.sellerProfile?.[0] || null,
    }

    return event.context.user as IProfile
  } catch (error: any) {
    // If already an HTTP error, re-throw
    if (error.statusCode) {
      throw error
    }

    // Log unexpected errors
    console.error('[Auth Middleware] Unexpected error:', error.message)

    // Generic error (don't expose internal details)
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed',
    })
  }
}

/**
 * Optional auth - doesn't throw if not authenticated
 * Returns user if authenticated, null if not
 */
export async function optionalAuth(event: H3Event) {
  try {
    return await requireAuth(event)
  } catch {
    return null
  }
}

/**
 * Get current user from event context
 * Call this after requireAuth has set context.user
 */
export function getCurrentUser(event: H3Event) {
  return event.context.user || null
}
