/**
 * GET /api/shipping/dropoff-centres?orderId=N
 * GIG service centres the SELLER can drop this order's parcel at — the centres in
 * their ship-from state, nearest-first. Powers the drop-off centre picker. Seller
 * of the order only.
 */
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { listServiceCentresForState } from '~~/layers/shipping/server/providers/gig/stations'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orderId = Number(getQuery(event).orderId)
  if (!orderId || Number.isNaN(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      orderItem: {
        select: {
          variant: {
            select: {
              product: {
                select: {
                  seller: {
                    select: {
                      profileId: true,
                      shipFromState: true,
                      state: true,
                      latitude: true,
                      longitude: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!order)
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  const seller = order.orderItem[0]?.variant?.product?.seller
  if (!seller || seller.profileId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not your order' })
  }

  const state = seller.shipFromState || seller.state
  if (!state) return { success: true, data: [] }

  const centres = await listServiceCentresForState(
    state,
    seller.latitude ?? undefined,
    seller.longitude ?? undefined,
  )
  return {
    success: true,
    data: centres.map((c) => ({
      id: c.ServiceCentreId,
      name: c.ServiceCentreName,
      code: c.ServiceCentreCode,
      address: c.Address,
    })),
  }
})
