// POST /api/auth/phone/send-otp
// Step 1 of phone/WhatsApp auth — generates and WhatsApp-sends a one-time code.
// Business logic lives in phone-otp.service.ts.

import { z } from 'zod'
import { getRequestIP } from 'h3'
import { normalizePhone, PHONE_ERROR } from '~~/shared/utils/phone'
import { sendPhoneOtp } from '~~/layers/core/server/services/phone-otp.service'

const schema = z.object({
  phone: z.string().min(1),
})

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Send a phone-signup OTP via WhatsApp',
    description:
      'Step 1 of phone/WhatsApp auth — sends a 6-digit one-time code via WhatsApp.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['phone'],
            properties: { phone: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: { description: '{ success, isNewUser }' },
      400: { description: 'Invalid phone number' },
    },
  },
})
export default defineEventHandler(async (event) => {
  try {
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'phone: Invalid input',
      })
    }

    const phone = normalizePhone(parsed.data.phone)
    if (!phone) {
      throw createError({ statusCode: 400, statusMessage: PHONE_ERROR })
    }

    const ipAddress =
      getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'

    const result = await sendPhoneOtp(phone, ipAddress)

    return { success: true, ...result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification code',
    })
  }
})
