// PATCH /api/growth/assets/:id
// Attach the rendered + uploaded card image to an asset (after the client captures
// ProductShareCard and uploads it to Cloudinary). Body: { cardImageUrl, cardPublicId, qrPublicId? }.

import { UserError } from '~~/layers/profile/server/types/user.types'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { growthAssetService } from '~~/layers/growth/server/services/growthAsset.service'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw new UserError('BAD_REQUEST', 'Missing asset id', 400)

    const body = await readBody(event)
    if (!body?.cardImageUrl || !body?.cardPublicId) {
      throw new UserError('BAD_REQUEST', 'cardImageUrl and cardPublicId are required', 400)
    }

    const result = await growthAssetService.attachCard({
      assetId: id,
      userId: user.id,
      cardImageUrl: String(body.cardImageUrl),
      cardPublicId: String(body.cardPublicId),
      qrPublicId: body.qrPublicId ? String(body.qrPublicId) : undefined,
    })
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof UserError)
      throw createError({ statusCode: error.status, statusMessage: error.message })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[PATCH /api/growth/assets/:id]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update growth asset' })
  }
})
