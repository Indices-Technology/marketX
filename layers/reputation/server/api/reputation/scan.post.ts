// POST /api/reputation/scan — logs a Trust Card QR scan (framework §3,
// TrustScanEvent). The top of the trust funnel: which surface, when, and (later)
// whether it converted to a protected payment.
//
// Deliberately resilient: analytics must never break a page, and this tolerates
// the TrustScanEvent table not existing yet (returns { success:false } until the
// migration is applied) rather than throwing.

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const slug = String(body?.slug || '').trim()
    if (!slug) return { success: false }

    const surface = body?.surface
      ? String(body.surface).toUpperCase().slice(0, 24)
      : null
    const orderId = Number.isFinite(Number(body?.orderId))
      ? Number(body.orderId)
      : null

    const seller = await prisma.sellerProfile.findUnique({
      where: { store_slug: slug },
      select: { id: true },
    })
    if (!seller) return { success: false }

    await prisma.trustScanEvent.create({
      data: { sellerId: seller.id, surface, orderId },
    })

    return { success: true }
  } catch (error: unknown) {
    logger.logError('[POST /api/reputation/scan]', error, {
      requestId: event.context?.requestId,
    })
    return { success: false }
  }
})
