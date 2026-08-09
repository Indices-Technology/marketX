// POST /api/auth/phone/verify-otp
// Step 2 of phone/WhatsApp auth — verifies the OTP, auto-registers new users,
// issues JWT tokens, sets httpOnly cookies identical to /api/auth/login.
// Business logic lives in phone-otp.service.ts.

import { z } from 'zod'
import { getRequestIP, getRequestHeader, setCookie } from 'h3'
import { normalizePhone, PHONE_ERROR } from '~~/shared/utils/phone'
import { verifyPhoneOtp } from '~~/layers/core/server/services/phone-otp.service'

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().length(6),
})

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Verify a phone-signup OTP',
    description:
      'Step 2 of phone/WhatsApp auth — verifies the 6-digit code, auto-registers ' +
      'new users, issues tokens (body + httpOnly cookies).',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['phone', 'code'],
            properties: {
              phone: { type: 'string' },
              code: { type: 'string', minLength: 6, maxLength: 6 },
            },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, accessToken, refreshToken, user, ... }' },
      400: { description: 'Invalid input or wrong/expired code' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      const field = first?.path?.[0] ? `${first.path[0]}: ` : ''
      throw createError({
        statusCode: 400,
        statusMessage: `${field}${first?.message ?? 'Invalid input'}`,
      })
    }

    const phone = normalizePhone(parsed.data.phone)
    if (!phone) {
      throw createError({ statusCode: 400, statusMessage: PHONE_ERROR })
    }

    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    const result = await verifyPhoneOtp(
      phone,
      parsed.data.code,
      ipAddress,
      userAgent,
    )

    const isProd = process.env.NODE_ENV === 'production'
    setCookie(event, 'accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
    })
    setCookie(event, 'refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    })

    return { success: true, ...result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Verification failed. Please try again.',
    })
  }
})
