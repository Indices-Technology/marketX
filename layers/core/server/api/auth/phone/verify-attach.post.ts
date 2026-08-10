// POST /api/auth/phone/verify-attach
// Verifies a WhatsApp OTP and sets it as the LOGGED-IN user's verified phone
// (Profile.phone/phone_verified — the same fields login and WhatsApp
// notifications read). Unlike /api/auth/phone/verify-otp (a sign-in door),
// this never creates an account or session — it only updates the caller's own
// row. Reuses phone-otp.service.ts's OTP store; send the code first via the
// existing /api/auth/phone/send-otp (unauthenticated, phone-only).

import { z } from 'zod'
import { getRequestIP, getRequestHeader } from 'h3'
import { normalizePhone, PHONE_ERROR } from '~~/shared/utils/phone'
import { attachVerifiedPhone } from '~~/layers/core/server/services/phone-otp.service'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().length(6),
})

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Verify and attach a phone number to the logged-in account',
    description:
      'Confirms a WhatsApp OTP sent via /api/auth/phone/send-otp and sets it as ' +
      "the caller's verified phone (used for login and WhatsApp notifications).",
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
      200: { description: '{ success, phone, phoneVerified }' },
      400: { description: 'Invalid input or wrong/expired code' },
      409: { description: 'Phone already linked to another account' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

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

    const result = await attachVerifiedPhone(
      user.id,
      phone,
      parsed.data.code,
      ipAddress,
      userAgent,
    )

    return { success: true, ...result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Verification failed. Please try again.',
    })
  }
})
