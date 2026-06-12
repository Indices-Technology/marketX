/**
 * SquareRequest / SquareOffer data access.
 * Buyers post structured "looking for" requests into a Square; sellers in the
 * Square respond with an existing product (an Offer). Kept thin — business
 * rules live in squareRequest.service.ts.
 */
import { prisma } from '~~/server/utils/db'

const REQUEST_BUYER_SELECT = {
  id: true,
  username: true,
  avatar: true,
} as const

const OFFER_PRODUCT_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  discount: true,
  media: {
    where: { isBgMusic: false },
    select: { id: true, url: true, type: true },
    take: 1,
  },
  seller: {
    select: { id: true, store_name: true, store_slug: true, store_logo: true },
  },
  variants: {
    select: { id: true, size: true, stock: true, price: true },
    take: 5,
  },
} as const

export const squareRequestRepository = {
  async getSquareBySlug(slug: string) {
    return prisma.square.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    })
  },

  async isFollower(userId: string, squareId: string): Promise<boolean> {
    const row = await prisma.userSquareFollow.findUnique({
      where: { userId_squareId: { userId, squareId } },
      select: { userId: true },
    })
    return !!row
  },

  /** Active membership for a seller in a square (used to gate offers). */
  async getActiveMembership(sellerId: string, squareId: string) {
    return prisma.squareMembership.findFirst({
      where: { sellerId, squareId, status: 'ACTIVE' },
      select: { id: true },
    })
  },

  /** Profile ids of active member sellers — recipients of new-request notifications. */
  async getActiveMemberProfileIds(squareId: string, excludeUserId?: string): Promise<string[]> {
    const memberships = await prisma.squareMembership.findMany({
      where: { squareId, status: 'ACTIVE' },
      select: { seller: { select: { profileId: true } } },
    })
    const ids = memberships
      .map((m) => m.seller?.profileId)
      .filter((id): id is string => !!id && id !== excludeUserId)
    return [...new Set(ids)]
  },

  /** Seller profile owned by a user (offers are made as a seller). */
  async getSellerForUser(userId: string) {
    return prisma.sellerProfile.findFirst({
      where: { profileId: userId, is_active: true },
      select: { id: true, store_slug: true, is_verified: true },
    })
  },

  /** Load a product with its owning seller — resolves the seller FROM the product
   *  so multi-store sellers are validated against the correct store. */
  async getProductWithSeller(productId: number) {
    return prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sellerId: true,
        variants: { select: { id: true, stock: true } },
        seller: { select: { profileId: true, is_verified: true } },
      },
    })
  },

  /** Count a buyer's currently-OPEN requests in a square — caps concurrent spam
   *  and self-heals when they close/fulfill (unlike a fixed daily counter). */
  async countActiveRequests(buyerId: string, squareId: string): Promise<number> {
    return prisma.squareRequest.count({
      where: { buyerId, squareId, status: 'OPEN' },
    })
  },

  async createRequest(data: {
    squareId: string
    buyerId: string
    categoryId?: number | null
    title: string
    budgetMin?: number | null
    budgetMax?: number | null
    condition?: string | null
    sizeSpec?: string | null
    deliverTo?: string | null
    note?: string | null
    referencePhotoUrl?: string | null
    visibility: string
    respondersOnlyVerified: boolean
    isAnonymous: boolean
    expiresAt: Date
  }) {
    return prisma.squareRequest.create({
      data,
      include: { buyer: { select: REQUEST_BUYER_SELECT } },
    })
  },

  async listRequests(
    squareId: string,
    pagination: { limit: number; offset: number },
    status?: string,
  ) {
    const where: Record<string, unknown> = { squareId }
    if (status) where.status = status
    return prisma.squareRequest.findMany({
      where,
      include: {
        buyer: { select: REQUEST_BUYER_SELECT },
        _count: { select: { offers: true } },
      },
      orderBy: { created_at: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    })
  },

  async countRequests(squareId: string, status?: string): Promise<number> {
    return prisma.squareRequest.count({
      where: { squareId, ...(status ? { status } : {}) },
    })
  },

  async getRequestById(id: string) {
    return prisma.squareRequest.findUnique({
      where: { id },
      include: {
        buyer: { select: REQUEST_BUYER_SELECT },
        offers: {
          include: {
            product: { select: OFFER_PRODUCT_SELECT },
            seller: { select: { id: true, store_name: true, store_slug: true, store_logo: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    })
  },

  async markExpired(id: string) {
    return prisma.squareRequest.update({
      where: { id },
      data: { status: 'EXPIRED' },
    })
  },

  async setStatus(id: string, status: string) {
    return prisma.squareRequest.update({
      where: { id },
      data: { status },
    })
  },

  async createOffer(data: {
    requestId: string
    sellerId: string
    productId: number
    variantId?: number | null
    message?: string | null
  }) {
    return prisma.squareOffer.create({
      data,
      include: {
        product: { select: OFFER_PRODUCT_SELECT },
        seller: { select: { id: true, store_name: true, store_slug: true, store_logo: true } },
      },
    })
  },

  async getOfferById(id: string) {
    return prisma.squareOffer.findUnique({
      where: { id },
      include: { request: { select: { id: true, buyerId: true, status: true } } },
    })
  },

  async setOfferStatus(id: string, status: string) {
    return prisma.squareOffer.update({
      where: { id },
      data: { status },
    })
  },
}
