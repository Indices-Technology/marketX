import {
  defineEventHandler,
  getRouterParam,
  getRequestIP,
  getRequestHeader,
  deleteCookie,
  createError,
} from 'h3'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { authService } from '../../../services/auth.service'
import { AuthError } from '../../../types/auth.types'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Revoke a single session (sign out one device)',
    description:
      "Revokes one of the caller's own sessions. Any access token bound to " +
      'that session stops working immediately. Revoking your current session ' +
      'is allowed and behaves like a logout — auth cookies are cleared and ' +
      '`wasCurrent: true` is returned so the client can drop its tokens.',
    responses: {
      200: { description: '{ success, message, wasCurrent }' },
      400: { description: 'Invalid session id' },
      401: { description: 'Not authenticated' },
      404: { description: 'Session not found, already revoked, or not yours' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session id is required',
      })
    }

    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    // Capture this before revoking — after the write we still need to know
    // whether the caller just signed themselves out.
    const wasCurrent = sessionId === event.context.sessionId

    // Ownership is enforced inside the service's WHERE clause, so a session id
    // belonging to another account is indistinguishable from a missing one.
    await authService.revokeSession(sessionId, user.id, ipAddress, userAgent)

    if (wasCurrent) {
      deleteCookie(event, 'accessToken')
      deleteCookie(event, 'refreshToken')
    }

    return { success: true, message: 'Session revoked', wasCurrent }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[DELETE /api/auth/sessions/[id]]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
