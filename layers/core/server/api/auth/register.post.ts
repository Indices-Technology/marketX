import { defineEventHandler, readBody, createError } from 'h3'
import { authService } from '../../services/auth.service'
import { registerSchema } from '../../schemas/auth.schemas'
import { AuthError } from '../../types/auth.types'
import { getClientIP } from '~~/server/layers/shared/utils/security'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Register a new user account',
    description:
      'Creates a `user` account and sends an email-verification link. ' +
      'Username: 3–30 chars, `[a-zA-Z0-9_-]`. Password must meet complexity rules.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'username', 'password', 'confirmPassword'],
            properties: {
              email: { type: 'string', format: 'email' },
              username: { type: 'string', minLength: 3, maxLength: 30 },
              password: { type: 'string' },
              confirmPassword: { type: 'string' },
              role: {
                type: 'string',
                enum: ['user', 'seller'],
                default: 'user',
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, message, user }' },
      400: { description: 'Invalid input (e.g. passwords do not match)' },
      409: { description: 'Email or username already taken' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      const first = validation.error.errors[0]
      const field = first?.path?.[0] ? `${first.path[0]}: ` : ''
      throw createError({
        statusCode: 400,
        statusMessage: `${field}${first?.message ?? 'Invalid input'}`,
      })
    }

    const { email, username, password } = validation.data
    const ipAddress = getClientIP(event)
    const userAgent = event.node.req.headers['user-agent'] || 'Unknown'

    const result = await authService.register(
      email,
      username,
      password,
      ipAddress,
      userAgent,
      'user',
    )

    return {
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
      user: result,
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/auth/register]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed. Please try again.',
    })
  }
})
