import { defineEventHandler, readBody, createError } from 'h3'
import { verifyEmailSchema } from '../../schemas/auth.schemas'
import { authService } from '../../services/auth.service'
import { AuthError } from '../../types/auth.types'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Verify email with a token',
    description: 'Consumes a single-use email-verification token.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, message }' },
      400: { description: 'Invalid or expired token' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    // 1. Parse and validate request body
    const body = await readBody(event)
    const validation = verifyEmailSchema.safeParse(body)

    if (!validation.success) {
      const first = validation.error.errors[0]
      throw createError({ statusCode: 400, statusMessage: first?.message ?? 'Invalid input' })
    }

    const result = await authService.verifyEmail(validation.data.token)

    return { success: true, message: result.message }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/verify-email]', error, { requestId: event.context?.requestId })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
