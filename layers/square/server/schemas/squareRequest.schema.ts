import { z } from 'zod'

export const createRequestSchema = z.object({
  title: z.string().trim().min(3, 'Say what you are looking for').max(80),
  categoryId: z.number().int().positive().optional().nullable(),
  // Budget in kobo (client sends major NGN × 100, or null)
  budgetMin: z.number().int().min(0).optional().nullable(),
  budgetMax: z.number().int().min(0).optional().nullable(),
  condition: z
    .enum(['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
    .optional()
    .nullable(),
  sizeSpec: z.string().trim().max(60).optional().nullable(),
  deliverTo: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(300).optional().nullable(),
  referencePhotoUrl: z.string().url().optional().nullable(),
  visibility: z.enum(['square', 'followed', 'public']).default('square'),
  respondersOnlyVerified: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
})

export const createOfferSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional().nullable(),
  message: z.string().trim().max(200).optional().nullable(),
})

export const offerActionSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type OfferActionInput = z.infer<typeof offerActionSchema>
