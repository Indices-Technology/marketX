// GET /api/map/sellers/:slug/preview?lat=X&lng=Y
import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3'
import { mapService } from '../../../../map.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const query = getQuery(event) as Record<string, string>
  const lat = parseFloat(query.lat)
  const lng = parseFloat(query.lng)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug is required' })

  // lat/lng are optional — when omitted, distanceKm will be 0 (store's own position)
  const seller = await mapService.getSellerPreview(slug, isNaN(lat) ? null : lat, isNaN(lng) ? null : lng)
  if (!seller) throw createError({ statusCode: 404, statusMessage: 'Seller not found' })

  return { success: true, data: seller }
})
