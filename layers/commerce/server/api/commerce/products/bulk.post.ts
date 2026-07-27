// POST /api/commerce/products/bulk
// Offline gallery bulk import: create many products (as DRAFT) in one request,
// with per-row partial success. Distinct from the single-create endpoint because
// the per-product side-effects (follower fan-out, cache busts, slug probes) don't
// scale — see productService.createProductsBulk and BULK_LISTING doc §3.

import { ZodError } from 'zod'
import { productService } from '~~/layers/commerce/server/services/product.service'
import { UserError } from '~~/layers/profile/server/types/user.types'
import {
  requireAuth,
  getAuthSellerProfile,
} from '~~/server/layers/shared/middleware/requireAuth'
import { getClientIP } from '~~/server/layers/shared/utils/security'

const MAX_ROWS = 500

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const ipAddress =
      getHeader(event, 'x-forwarded-for') || getClientIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Resolve the seller profile (mirror of the single-create endpoint).
    let sellerProfile = await getAuthSellerProfile(event)
    if (body.storeSlug && body.storeSlug !== sellerProfile?.store_slug) {
      const match = await prisma.sellerProfile.findFirst({
        where: {
          store_slug: body.storeSlug,
          profileId: user.id,
          is_active: true,
        },
        select: { id: true, store_slug: true, profileId: true },
      })
      if (!match)
        throw new UserError(
          'SELLER_NOT_FOUND',
          'Seller profile not found or not active',
          404,
        )
      sellerProfile = match
    }
    if (!sellerProfile)
      throw new UserError(
        'SELLER_REQUIRED',
        'A seller profile is required to create products',
        403,
      )

    const rows = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0)
      throw new UserError('NO_ROWS', 'rows[] is required and must be non-empty', 400)
    if (rows.length > MAX_ROWS)
      throw new UserError('TOO_MANY_ROWS', `Max ${MAX_ROWS} rows per import`, 400)

    const result = await productService.createProductsBulk(
      sellerProfile.id,
      sellerProfile.store_slug,
      rows,
      user.id,
      ipAddress,
      userAgent,
    )

    // No cache bust: bulk imports are DRAFT and never appear in cached
    // (PUBLISHED-only) listings. They surface publicly when the seller publishes.
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    if (error instanceof ZodError) {
      const issue = error.errors[0]
      const field = issue?.path?.join('.')
      throw createError({
        statusCode: 422,
        statusMessage: issue
          ? field
            ? `${field}: ${issue.message}`
            : issue.message
          : 'Validation error',
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/commerce/products/bulk]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
