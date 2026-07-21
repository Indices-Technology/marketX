import {
  defineEventHandler,
  readBody,
  getRequestIP,
  getRequestHeader,
  deleteCookie,
  createError,
} from 'h3'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { authService } from '../../../services/auth.service'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Sign out other devices (or every device)',
    description:
      "Revokes the caller's sessions in bulk. By default the current session " +
      'is kept alive, so the user stays signed in where they clicked. Send ' +
      '`{ includeCurrent: true }` to sign out everywhere including this ' +
      'device — auth cookies are then cleared too.',
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { includeCurrent: { type: 'boolean', default: false } },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, message, count, signedOutCurrent }' },
      401: { description: 'Not authenticated' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event).catch(() => null)
    const includeCurrent = Boolean(body?.includeCurrent)

    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    const result = await authService.revokeOtherSessions(
      user.id,
      event.context.sessionId,
      ipAddress,
      userAgent,
      includeCurrent,
    )

    // A legacy token (minted before sessionId was embedded) has no session to
    // exclude, so "revoke others" unavoidably revokes everything the user has.
    // Treat that like an explicit sign-out-everywhere rather than leaving the
    // caller holding cookies whose session is gone.
    const signedOutCurrent = includeCurrent || !event.context.sessionId

    if (signedOutCurrent) {
      deleteCookie(event, 'accessToken')
      deleteCookie(event, 'refreshToken')
    }

    return { success: true, ...result, signedOutCurrent }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/sessions/revoke-all]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
