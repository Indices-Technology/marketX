/**
 * SquareRequest service — buyer requests + seller product offers.
 *
 * Anti-leakage rules enforced here:
 *  - Only square followers can post requests; only ACTIVE member sellers can offer.
 *  - Sellers offer an existing product they OWN — never free contact.
 *  - Free-text (note, offer message) is content-guard masked before persist,
 *    and any contact-leak attempt is logged as a CONTACT_LEAK GuardRailEvent.
 *  - Accepting an offer routes the buyer to on-platform checkout (variant returned).
 */
import { createError } from 'h3'
import { squareRequestRepository as repo } from '../repositories/squareRequest.repository'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { aiDataService } from '~~/layers/ai/server/services/ai-data.service'
import { maskContact, scanForContact } from '~~/shared/utils/contentGuard'
import {
  createRequestSchema,
  createOfferSchema,
  type CreateRequestInput,
  type CreateOfferInput,
} from '../schemas/squareRequest.schema'

const REQUEST_TTL_DAYS = 7
const MAX_OPEN_REQUESTS = 5

/** Mask contact info and log a CONTACT_LEAK event if anything was found. */
function guardText(userId: string, text: string | null | undefined): string | null {
  if (!text) return null
  const { clean, matches } = scanForContact(text)
  if (!clean) {
    aiDataService.logGuardEvent({
      userId,
      type: 'CONTACT_LEAK',
      inputFragment: matches.join(' | ').slice(0, 280),
    })
    return maskContact(text)
  }
  return text
}

async function resolveActiveSquare(slug: string) {
  const square = await repo.getSquareBySlug(slug)
  if (!square || square.status !== 'ACTIVE')
    throw createError({ statusCode: 404, statusMessage: 'Square not found' })
  return square
}

export const squareRequestService = {
  async createRequest(userId: string, slug: string, body: unknown) {
    const data: CreateRequestInput = createRequestSchema.parse(body)
    const square = await resolveActiveSquare(slug)

    // Only followers may post a request into the square
    if (!(await repo.isFollower(userId, square.id)))
      throw createError({
        statusCode: 403,
        statusMessage: 'Follow this Square to post a request',
      })

    // Rate limit — cap concurrent open requests to protect sellers from spam
    const active = await repo.countActiveRequests(userId, square.id)
    if (active >= MAX_OPEN_REQUESTS)
      throw createError({
        statusCode: 429,
        statusMessage: `You can have up to ${MAX_OPEN_REQUESTS} open requests in a Square — close one to post more`,
      })

    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMin > data.budgetMax
    )
      throw createError({ statusCode: 400, statusMessage: 'Budget min cannot exceed max' })

    const expiresAt = new Date(Date.now() + REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000)

    const request = await repo.createRequest({
      squareId: square.id,
      buyerId: userId,
      categoryId: data.categoryId ?? null,
      title: guardText(userId, data.title) ?? data.title,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      condition: data.condition ?? null,
      sizeSpec: data.sizeSpec ?? null,
      deliverTo: data.deliverTo ?? null,
      note: guardText(userId, data.note),
      referencePhotoUrl: data.referencePhotoUrl ?? null,
      visibility: data.visibility,
      respondersOnlyVerified: data.respondersOnlyVerified,
      isAnonymous: data.isAnonymous,
      expiresAt,
    })

    // Notify active member sellers — this is the demand signal that pulls
    // sellers into the square. Fire-and-forget.
    repo
      .getActiveMemberProfileIds(square.id, userId)
      .then((profileIds) => {
        for (const pid of profileIds) {
          notificationQueue.enqueue({
            userId: pid,
            type: 'SQUARE_REQUEST',
            actorId: userId,
            message: `New request in ${square.name}: "${request.title}"`,
          })
        }
      })
      .catch(() => {})

    return request
  },

  async listRequests(
    slug: string,
    pagination: { limit: number; offset: number },
    status?: string,
  ) {
    const square = await resolveActiveSquare(slug)
    const [requests, total] = await Promise.all([
      repo.listRequests(square.id, pagination, status),
      repo.countRequests(square.id, status),
    ])
    // Lazy expiry — mark past-due OPEN rows as EXPIRED on read
    const now = Date.now()
    for (const r of requests) {
      if (r.status === 'OPEN' && new Date(r.expiresAt).getTime() < now) {
        r.status = 'EXPIRED'
        repo.markExpired(r.id).catch(() => {})
      }
    }
    return {
      requests: requests.map((r) => (r.isAnonymous ? { ...r, buyer: null } : r)),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    }
  },

  async getRequest(id: string) {
    const request = await repo.getRequestById(id)
    if (!request) throw createError({ statusCode: 404, statusMessage: 'Request not found' })
    if (request.isAnonymous) return { ...request, buyer: null }
    return request
  },

  async createOffer(userId: string, requestId: string, body: unknown) {
    const data: CreateOfferInput = createOfferSchema.parse(body)

    const request = await repo.getRequestById(requestId)
    if (!request) throw createError({ statusCode: 404, statusMessage: 'Request not found' })
    if (request.status !== 'OPEN' || new Date(request.expiresAt).getTime() < Date.now())
      throw createError({ statusCode: 400, statusMessage: 'This request is no longer open' })

    // Resolve the seller FROM the product so multi-store sellers are validated
    // against the correct store (not an arbitrary "first" profile).
    const product = await repo.getProductWithSeller(data.productId)
    if (!product)
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })

    // The caller must own the product's store (ownership / IDOR)
    if (product.seller?.profileId !== userId)
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only offer your own products',
      })

    // That store must be an ACTIVE member of this square
    if (!(await repo.getActiveMembership(product.sellerId, request.squareId)))
      throw createError({
        statusCode: 403,
        statusMessage: 'Only active members of this Square can respond',
      })

    // Verified-only gate set by the buyer
    if (request.respondersOnlyVerified && !product.seller?.is_verified)
      throw createError({
        statusCode: 403,
        statusMessage: 'This buyer is only accepting offers from verified sellers',
      })

    if (data.variantId && !product.variants.some((v) => v.id === data.variantId))
      throw createError({
        statusCode: 400,
        statusMessage: 'Variant does not belong to this product',
      })

    let offer
    try {
      offer = await repo.createOffer({
        requestId,
        sellerId: product.sellerId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        message: guardText(userId, data.message),
      })
    } catch (e: unknown) {
      // Unique (requestId, sellerId, productId) — duplicate offer
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002')
        throw createError({ statusCode: 409, statusMessage: 'You already offered this product' })
      throw e
    }

    // Notify the buyer (skip when anonymous? buyer still owns the request and
    // should hear about offers — anonymity only hides them from others)
    notificationQueue.enqueue({
      userId: request.buyerId,
      type: 'SQUARE_OFFER',
      actorId: userId,
      productId: data.productId,
      message: `A seller responded to your request "${request.title}"`,
    })

    return offer
  },

  async actOnOffer(userId: string, offerId: string, action: 'ACCEPT' | 'DECLINE') {
    const offer = await repo.getOfferById(offerId)
    if (!offer) throw createError({ statusCode: 404, statusMessage: 'Offer not found' })

    // Only the request owner (buyer) can act on offers
    if (offer.request.buyerId !== userId)
      throw createError({ statusCode: 403, statusMessage: 'Not your request' })

    if (action === 'DECLINE') {
      await repo.setOfferStatus(offerId, 'DECLINED')
      return { offerId, status: 'DECLINED' }
    }

    // ACCEPT — close the request, return the variant so the client adds to cart
    await repo.setOfferStatus(offerId, 'ACCEPTED')
    await repo.setStatus(offer.request.id, 'FULFILLED')
    return {
      offerId,
      status: 'ACCEPTED',
      productId: offer.productId,
      variantId: offer.variantId,
    }
  },

  async closeRequest(userId: string, requestId: string) {
    const request = await repo.getRequestById(requestId)
    if (!request) throw createError({ statusCode: 404, statusMessage: 'Request not found' })
    if (request.buyerId !== userId)
      throw createError({ statusCode: 403, statusMessage: 'Not your request' })
    await repo.setStatus(requestId, 'CLOSED')
    return { id: requestId, status: 'CLOSED' }
  },
}
