import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { authService } from '../../../services/auth.service'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'List active sessions across all devices',
    description:
      'Returns every live (non-revoked, non-expired) session for the ' +
      'authenticated user, most recently used first. The session that made ' +
      'this request is flagged with `isCurrent: true`.',
    responses: {
      200: { description: '{ success, sessions[] }' },
      401: { description: 'Not authenticated' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const sessions = await authService.listSessions(
      user.id,
      event.context.sessionId,
    )

    return { success: true, sessions }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/auth/sessions]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
