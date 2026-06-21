// POST /api/shipping/quote — orchestrated multi-carrier shipping quotes.
//
// Body: { origin, destination, items[], parcel?, declaredValueMinor?, currency?,
//         options?, discountPct?, strategy? }
// Returns ranked Quote[] across all eligible carriers. See docs/SHIPPING.md §5.

import {
  getQuotes,
  type RankStrategy,
} from '~~/layers/shipping/server/services/orchestrator.service'
import type { ShipmentRequest } from '~~/layers/shipping/server/utils/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<
      ShipmentRequest & { discountPct?: number; strategy?: RankStrategy }
    >(event)

    if (!body?.origin?.state || !body?.destination?.state) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'origin and destination (with state and country) are required',
      })
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'items[] is required',
      })
    }

    const req: ShipmentRequest = {
      origin: body.origin,
      destination: body.destination,
      items: body.items,
      parcel: body.parcel,
      declaredValueMinor: body.declaredValueMinor ?? 0,
      currency: body.currency ?? 'NGN',
      options: body.options,
      customs: body.customs,
    }

    const quotes = await getQuotes(req, {
      discountPct: body.discountPct,
      strategy: body.strategy,
    })

    return { success: true, data: quotes }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/shipping/quote]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get shipping quotes',
    })
  }
})
