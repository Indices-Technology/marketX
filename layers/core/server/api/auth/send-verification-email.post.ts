import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { authService } from '../../services/auth.service'
import { AuthError } from '../../types/auth.types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/auth/send-verification-email
 *
 * Public endpoint — no auth required.
 * Accepts { email } in the body and resends the verification link.
 * Used by the /resend-verification page for unverified / guest users.
 */
defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Resend the email-verification link',
    description:
      'Public. Responds identically whether or not the account exists / is ' +
      'already verified — no account enumeration.',
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
    const validation = schema.safeParse(body)

    if (!validation.success) {
      const first = validation.error.errors[0]
      throw createError({
        statusCode: 400,
        statusMessage: first?.message ?? 'Invalid input',
      })
    }

    const email = validation.data.email.toLowerCase()

    // Look up profile by email — respond identically whether found or not
    // to avoid user enumeration
    const profile = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, email_verified: true },
    })

    if (profile && !profile.email_verified) {
      await authService.sendVerificationEmail(profile.id, email)
    }

    return {
      success: true,
      message:
        'If an account with that email exists and is unverified, a verification link has been sent.',
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const msg = error instanceof Error ? error.message : 'Failed to send verification email'
    logger.logError('[POST /api/auth/send-verification-email]', error, { requestId: event.context?.requestId })
    throw createError({
      statusCode: 500,
      statusMessage: msg,
    })
  }
})
