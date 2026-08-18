import { defineEventHandler, getQuery, createError } from 'h3'
import { authService } from '../../services/auth.service'
import { usernameSchema } from '../../schemas/auth.schemas'
import { AuthError } from '../../types/auth.types'
import { getClientIP } from '~~/server/layers/shared/utils/security'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Check whether a username is available',
    description:
      'Public typeahead endpoint for the signup form. Runs the same uniqueness ' +
      'check registration performs, so the answer matches what `POST /api/auth/register` ' +
      'will do. Matching is case-insensitive — `Josh` and `josh` are one identity. ' +
      'Malformed usernames come back as `available: false` with the reason ' +
      'rather than a 400, so the field can render it inline. Rate limited per IP.',
    parameters: [
      {
        name: 'username',
        in: 'query',
        required: true,
        schema: { type: 'string', minLength: 3, maxLength: 30 },
      },
    ],
    responses: {
      200: {
        description: '{ success, username, available, message, suggestions }',
      },
      429: { description: 'Too many checks from this IP' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const username = String(getQuery(event).username ?? '').trim()

    // Format problems are an answer, not an error — the field shows the reason
    // inline while typing instead of flashing a failed request.
    const parsed = usernameSchema.safeParse(username)
    if (!parsed.success) {
      return {
        success: true,
        username,
        available: false,
        message: parsed.error.errors[0]?.message ?? 'Invalid username',
        suggestions: [] as string[],
      }
    }

    const { available, suggestions } =
      await authService.checkUsernameAvailability(
        parsed.data,
        getClientIP(event),
      )

    return {
      success: true,
      username: parsed.data,
      available,
      message: available
        ? 'Username is available'
        : 'Username is already taken',
      suggestions,
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[GET /api/auth/check-username]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check username availability',
    })
  }
})
