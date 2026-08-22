// POST /api/partners/leads — public partnership / API-waitlist application
import { z, ZodError } from 'zod'
import { partnerLeadService } from '~~/layers/growth/server/services/partnerLead.service'
import { checkRateLimitAsync } from '~~/server/utils/auth/rateLimiter'
// Lives outside the auto-imported server/utils tree, so it needs naming.
import { getClientIP } from '~~/server/layers/shared/utils/security'
import { RATE_LIMITS } from '~~/server/config/rateLimits'

const schema = z.object({
  type: z.enum(['PARTNERSHIP', 'API']),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().min(2).max(150),
  website: z.string().trim().url().max(300).optional().or(z.literal('')),
  role: z.string().trim().max(120).optional(),
  useCase: z.string().trim().min(20).max(3000),
  expectedVolume: z.string().trim().max(60).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  // Honeypot: a real applicant never sees this field, so anything in it is a
  // bot. Cheaper and less hostile than a captcha on a low-traffic form.
  // Accepts any string on purpose — rejecting a filled honeypot here would
  // return a 400 that tells the bot exactly which field to clear. The handler
  // swallows it instead.
  companyFax: z.string().max(200).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const ipAddress = getClientIP(event)

    const rateLimit = await checkRateLimitAsync(`lead:${ipAddress}`, {
      windowMs: RATE_LIMITS.PARTNER_LEAD.windowMs,
      maxAttempts: RATE_LIMITS.PARTNER_LEAD.maxAttempts,
      lockoutMs: RATE_LIMITS.PARTNER_LEAD.lockoutMs,
      keyPrefix: RATE_LIMITS.PARTNER_LEAD.keyPrefix,
    })
    if (!rateLimit.allowed) {
      const secs = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      throw createError({
        statusCode: 429,
        statusMessage: `Too many applications. Try again in ${secs} seconds`,
      })
    }

    const body = schema.parse(await readBody(event))

    // Silently accept the bot so it doesn't learn to retry with the field
    // cleared, but store nothing.
    if (body.companyFax) return { success: true, data: null }

    const lead = await partnerLeadService.submit({
      type: body.type,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      company: body.company,
      website: body.website || null,
      role: body.role,
      useCase: body.useCase,
      expectedVolume: body.expectedVolume,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    })

    return { success: true, data: lead }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if (error instanceof ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    logger.logError('[partners/leads:create]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
