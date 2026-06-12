/**
 * POST /api/commerce/shipping/create
 * Book a shipment after an order is confirmed + paid.
 * Creates label, stores tracking info on the Order record.
 */

import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { prisma } from '~~/server/utils/db'
import { getShippingProvider } from '~~/server/utils/shipping'
import type { ICreateShipmentPayload } from '~~/server/utils/shipping'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody<ICreateShipmentPayload & { orderId: number }>(
      event,
    )

    if (!body?.orderId || !body?.rateId || !body?.from || !body?.to) {
      throw createError({
        statusCode: 400,
        message: 'orderId, rateId, from, and to are required',
      })
    }

    const order = await prisma.orders.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        orderItem: {
          select: {
            variant: {
              select: {
                product: {
                  select: { seller: { select: { profileId: true } } },
                },
              },
            },
          },
        },
      },
    })

    if (!order) {
      throw createError({ statusCode: 404, message: 'Order not found' })
    }

    // Buyer or a seller fulfilling items in this order may book the shipment
    const isBuyer = order.userId === user.id
    const isSeller = order.orderItem.some(
      (item) => item.variant.product.seller?.profileId === user.id,
    )
    if (!isBuyer && !isSeller) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    // Shipment is only bookable for a confirmed order — matches the
    // CONFIRMED → SHIPPED transition enforced by the status PATCH endpoint
    if (order.status !== 'CONFIRMED') {
      throw createError({
        statusCode: 400,
        message: `Cannot book a shipment for a ${order.status} order`,
      })
    }

    const provider = getShippingProvider(body.to.country)
    let result
    try {
      result = await provider.createShipment(body)
    } catch (providerError: unknown) {
      logger.logError('[shipping/create] provider failure', providerError, {
        requestId: event.context?.requestId,
      })
      throw createError({
        statusCode: 502,
        message: 'Shipping provider is unavailable — please try again later',
      })
    }

    // Persist tracking info on the order
    await prisma.orders.update({
      where: { id: body.orderId },
      data: {
        trackingNumber: result.trackingNumber,
        shipper: result.carrier,
        labelUrl: result.labelUrl,
        shippingProvider: result.provider,
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
    })

    return { success: true, data: result }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    logger.logError('[POST /api/commerce/shipping/create]', error, {
      requestId: event.context?.requestId,
    })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
