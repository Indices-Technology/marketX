// FILE PATH: server/layers/seller/schemas/seller.schema.ts

import { z } from 'zod'
import { safeHttpUrl } from '~~/shared/utils/safeUrl'

/**
 * Seller Profile Schemas
 * Zod validation for all seller-related requests
 */

// ==================== ENUMS ====================

export const VerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
])

// ==================== CREATE SELLER PROFILE ====================

export const createSellerProfileSchema = z.object({
  store_name: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name must be less than 100 characters')
    .trim(),

  store_slug: z
    .string()
    .min(3, 'Store slug must be at least 3 characters')
    .max(50, 'Store slug must be less than 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Store slug can only contain lowercase letters, numbers, and hyphens',
    )
    .toLowerCase(),

  store_description: z
    .string()
    .max(500, 'Store description must be less than 500 characters')
    .optional(),

  store_location: z
    .string()
    .max(100, 'Store location must be less than 100 characters')
    .optional(),

  store_phone: z.preprocess(
    (val) =>
      typeof val === 'string'
        ? val.replace(/[\s\-().]/g, '').trim() || undefined
        : val,
    z
      .string()
      .regex(
        /^\+?[1-9]\d{6,14}$/,
        'Phone must be in international format, e.g. +2348012345678',
      )
      .optional(),
  ),

  store_website: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() || undefined : val),
    z
      .string()
      .refine(safeHttpUrl, 'Website must be an http(s) URL, e.g. https://yourstore.com')
      .optional(),
  ),

  store_logo: z.string().url('Invalid logo URL').optional(),

  store_banner: z.string().url('Invalid banner URL').optional(),

  store_socials: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),

  default_currency: z
    .enum(['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'])
    .default('NGN')
    .optional(),
})

export type CreateSellerProfileRequest = z.infer<
  typeof createSellerProfileSchema
>

// ==================== UPDATE SELLER PROFILE ====================

export const updateSellerProfileSchema = z
  .object({
    store_name: z
      .string()
      .min(3, 'Store name must be at least 3 characters')
      .max(100, 'Store name must be less than 100 characters')
      .trim()
      .optional(),

    store_description: z
      .string()
      .max(500, 'Store description must be less than 500 characters')
      .optional(),

    store_location: z
      .string()
      .max(100, 'Store location must be less than 100 characters')
      .optional(),

    store_phone: z.preprocess(
      (val) =>
        typeof val === 'string'
          ? val.replace(/[\s\-().]/g, '').trim() || undefined
          : val,
      z
        .string()
        .regex(
          /^\+?[1-9]\d{6,14}$/,
          'Phone must be in international format, e.g. +2348012345678',
        )
        .optional(),
    ),

    store_website: z.preprocess(
      (val) => (typeof val === 'string' ? val.trim() || undefined : val),
      z
        .string()
        .refine(safeHttpUrl, 'Website must be an http(s) URL, e.g. https://yourstore.com')
        .optional(),
    ),

    store_logo: z.string().url('Invalid logo URL').optional(),

    store_banner: z.string().url('Invalid banner URL').optional(),

    store_socials: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        tiktok: z.string().optional(),
        youtube: z.string().optional(),
        linkedin: z.string().optional(),
      })
      .optional(),

    auto_answer_enabled: z.boolean().optional(),

    // ── Media watermark (reels/video) ────────────────────────────────────────
    watermark_enabled: z.boolean().optional(),
    // Kept short + trimmed so overlays stay legible. Empty string → null so the
    // render helper falls back to the store name.
    watermark_text: z.preprocess(
      (val) => (typeof val === 'string' ? val.trim().slice(0, 24) || null : val),
      z
        .string()
        .max(24, 'Watermark must be 24 characters or less')
        .nullable()
        .optional(),
    ),

    default_currency: z
      .enum(['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'])
      .optional(),

    // Shipping origin
    shipFromName: z.string().max(100).optional(),
    shipFromAddress: z.string().max(200).optional(),
    shipFromCity: z.string().max(100).optional(),
    shipFromState: z.string().max(100).optional(),
    shipFromZip: z.string().max(20).optional(),
    shipFromCountry: z.string().length(2).optional(),
    shipFromPhone: z.preprocess(
      (val) =>
        typeof val === 'string'
          ? val.replace(/[\s\-().]/g, '').trim() || undefined
          : val,
      z
        .string()
        .regex(/^\+?[1-9]\d{6,14}$/)
        .optional(),
    ),
    // ── Map / Discovery ──────────────────────────────────────────────────────
    // preprocess: coerce empty string / NaN → null so number inputs don't break validation
    latitude: z.preprocess(
      (v) =>
        v === '' || v === null || (typeof v === 'number' && isNaN(v))
          ? null
          : v,
      z.number().min(-90).max(90).nullable().optional(),
    ),
    longitude: z.preprocess(
      (v) =>
        v === '' || v === null || (typeof v === 'number' && isNaN(v))
          ? null
          : v,
      z.number().min(-180).max(180).nullable().optional(),
    ),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    locationLabel: z.string().max(200).optional(),
    hideLocation: z.boolean().optional(),
    // ── Pay on Delivery ────────────────────────────────────────────────────
    pod_enabled: z.boolean().optional(),
    pod_zones: z.array(z.string().min(1)).max(37).optional(),
    pod_delivery_days: z.number().int().min(1).max(30).optional(),
    // ── Bring-your-own-shipping (BYOS) ───────────────────────────────────────
    shippingConfig: z
      .object({
        selfEnabled: z.boolean().optional(),
        gigEnabled: z.boolean().optional(),
        flatRateMinor: z.number().int().min(0).max(100_000_00).optional(),
        freeOverMinor: z.number().int().min(0).optional(),
        pickupEnabled: z.boolean().optional(),
        pickupNote: z.string().max(200).optional(),
        etaText: z.string().max(120).optional(),
        zoneRates: z.record(z.string(), z.number().int().min(0)).optional(),
      })
      .nullable()
      .optional(),
    // MarketX Card — owner-controlled visibility toggles (values live on the
    // store's own fields: store_phone, store_location, store_email).
    cardSettings: z
      .object({
        showRating: z.boolean().optional(),
        showFollowers: z.boolean().optional(),
        showProducts: z.boolean().optional(),
        showDescription: z.boolean().optional(),
        showPhone: z.boolean().optional(),
        showEmail: z.boolean().optional(),
        showAddress: z.boolean().optional(),
      })
      .optional(),
    // Public business email (shown on the card when showEmail is on).
    store_email: z.string().email().max(120).optional().or(z.literal('')),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    'At least one field must be provided for update',
  )

export type UpdateSellerProfileRequest = z.infer<
  typeof updateSellerProfileSchema
>

// ==================== VERIFY SELLER ====================

export const verifySellerProfileSchema = z.object({
  verification_status: VerificationStatusEnum,

  verification_reason: z
    .string()
    .max(500, 'Verification reason must be less than 500 characters')
    .optional(),
})

export type VerifySellerProfileRequest = z.infer<
  typeof verifySellerProfileSchema
>

// ==================== ACTIVATE / DEACTIVATE ====================

export const activateSellerSchema = z.object({
  sellerProfileId: z.string().uuid('Invalid seller profile ID'),
})

export const deactivateSellerSchema = z.object({
  sellerProfileId: z.string().uuid('Invalid seller profile ID'),
})

// ==================== GET SELLER ====================

export const getSellerBySlugSchema = z.object({
  slug: z
    .string()
    .min(3, 'Store slug must be at least 3 characters')
    .max(50, 'Store slug must be less than 50 characters'),
})

export type GetSellerBySlugRequest = z.infer<typeof getSellerBySlugSchema>

// ==================== SLUG VALIDATION ====================

export const checkSlugAvailabilitySchema = z.object({
  slug: z
    .string()
    .min(3, 'Store slug must be at least 3 characters')
    .max(50, 'Store slug must be less than 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Store slug can only contain lowercase letters, numbers, and hyphens',
    ),
})

export type CheckSlugAvailabilityRequest = z.infer<
  typeof checkSlugAvailabilitySchema
>

// ==================== SUGGEST SLUG ====================

export const suggestSlugSchema = z.object({
  baseName: z
    .string()
    .min(3, 'Base name must be at least 3 characters')
    .max(50, 'Base name must be less than 50 characters')
    .trim()
    .transform((val) => val.toLowerCase().replace(/\s+/g, '-')),
})

export type SuggestSlugRequest = z.infer<typeof suggestSlugSchema>
