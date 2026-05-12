import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRequestIP,
  getRequestHeader,
  createError,
} from 'h3'
import { authService } from '../../services/auth.service'
import { authRepository } from '../../repositories/auth.repository'

export default defineEventHandler(async (event) => {
  try {
    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    const refreshToken = getCookie(event, 'refreshToken')

    if (refreshToken) {
      const session =
        await authRepository.getSessionByRefreshToken(refreshToken)

      if (session) {
        await authService.logout(session.id, ipAddress, userAgent)
      }
    }

    deleteCookie(event, 'accessToken')
    deleteCookie(event, 'refreshToken')

    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/logout]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
