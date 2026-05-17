// FILE PATH: server/layers/seller/api/list.get.ts

import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { sellerService } from '../../services/seller.services'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const sellers = await remember(`seller:list:${user.id}`, 300, () =>
      sellerService.getUserSellerProfiles(user.id),
    )

    return {
      success: true,
      message: 'Seller profiles retrieved successfully',
      data: sellers,
      total: sellers.length,
    }
  } catch (error: any) {
    if (error.name === 'SellerError') {
      throw createError({ statusCode: error.statusCode || 404, statusMessage: error.message })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve seller profiles' })
  }
})
