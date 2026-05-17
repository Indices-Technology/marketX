import { z } from 'zod'

export const submitReportSchema = z.object({
  contentType: z.enum(['POST', 'PRODUCT', 'COMMENT', 'REVIEW', 'SELLER_REVIEW', 'USER', 'STORY']),
  contentId: z.string().min(1),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'COUNTERFEIT', 'HARASSMENT', 'MISINFORMATION', 'VIOLENCE', 'OTHER']),
  note: z.string().max(500).optional(),
})

export const resolveReportSchema = z.object({
  action: z.enum(['WARN', 'HIDE', 'REMOVE', 'SUSPEND', 'BAN', 'REINSTATE', 'DISMISS']),
  moderatorNote: z.string().max(1000).optional(),
})

export const moderateContentSchema = z.object({
  status: z.enum(['ACTIVE', 'FLAGGED', 'UNDER_REVIEW', 'HIDDEN', 'REMOVED']),
  reason: z.string().max(500).optional(),
})

export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(1000),
  durationDays: z.number().int().positive().optional(),
})

export const verifySellerSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().max(500).optional(),
})
