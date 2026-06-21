import { defineEventHandler, readBody, createError } from 'h3'
import { forgotPasswordSchema } from '../../schemas/auth.schemas'
import { authService } from '../../services/auth.service'
import { AuthError } from '../../types/auth.types'
import { getClientIP } from '~~/server/layers/shared/utils/security'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Request a password-reset email',
    description:
      'Sends a reset link if the email exists. Always returns 200 with an ' +
      'identical message — no account enumeration.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, message }' },
      400: { description: 'Invalid email' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      const first = validation.error.errors[0]
      throw createError({
        statusCode: 400,
        statusMessage: first?.message ?? 'Invalid input',
      })
    }

    const ipAddress = getClientIP(event)
    const userAgent = event.node.req.headers['user-agent'] || 'Unknown'

    const result = await authService.requestPasswordReset(
      validation.data.email,
      ipAddress,
      userAgent,
    )

    return { success: true, message: result.message }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/forgot-password]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
