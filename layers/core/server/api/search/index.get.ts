import { Prisma } from '@prisma/client'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { optionalAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { normalizePublicId } from '~~/layers/seller/server/utils/publicSellerId'

export default defineEventHandler(async (event) => {
  try {
    await optionalAuth(event)
    const query = getQuery(event)
    const q = ((query.q as string) || '').trim()
    const type = (query.type as string) || 'all'
    const limit = Math.min(Number(query.limit) || 10, 50)
    const offset = Number(query.offset) || 0

    if (!q || q.length < 2) {
      return {
        success: true,
        data: { users: [], products: [], posts: [], stores: [], tags: [] },
      }
    }

    const searchFilter = { contains: q, mode: 'insensitive' as const }

    // Public Seller ID lookup: normalize the query the same way the stored
    // shadow column is, so "MX-PLA-VDKR", "mx pla vdkr", "plavdkr" and the bare
    // code "vdkr" all match. Skipped when normalization leaves <2 chars (a bare
    // `contains: ''` would match every store).
    const qNorm = normalizePublicId(q)
    const storeOr: Prisma.SellerProfileWhereInput[] = [
      { store_name: searchFilter },
      { store_description: searchFilter },
    ]
    if (qNorm.length >= 2) {
      storeOr.push({ publicIdNormalized: { contains: qNorm } })
    }

    const [users, stores, products, posts, tags] = await Promise.all([
      type === 'all' || type === 'users'
        ? prisma.profile.findMany({
            // Never match or return email — searching by email substring would
            // let anyone enumerate accounts, and returning it leaks PII to an
            // unauthenticated caller (this route is optionalAuth).
            where: {
              OR: [{ username: searchFilter }, { bio: searchFilter }],
            },
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true,
            },
            take: limit,
            skip: offset,
          })
        : [],

      type === 'all' || type === 'stores'
        ? prisma.sellerProfile.findMany({
            where: { OR: storeOr },
            select: {
              id: true,
              publicId: true,
              store_name: true,
              store_slug: true,
              store_description: true,
              store_logo: true,
            },
            take: limit,
            skip: offset,
          })
        : [],

      type === 'all' || type === 'products'
        ? prisma.products.findMany({
            where: {
              status: 'PUBLISHED',
              OR: [{ title: searchFilter }, { description: searchFilter }],
            },
            include: {
              seller: { select: { store_slug: true, store_name: true } },
              media: { select: { id: true, url: true, type: true }, take: 1 },
            },
            take: limit,
            skip: offset,
          })
        : [],

      type === 'all' || type === 'posts'
        ? prisma.post.findMany({
            // Public search must never surface PRIVATE/FOLLOWERS posts or
            // removed/flagged content — mirror the feed visibility rules.
            where: {
              visibility: 'PUBLIC',
              moderationStatus: 'ACTIVE',
              OR: [{ caption: searchFilter }, { content: searchFilter }],
            },
            include: {
              author: { select: { id: true, username: true, avatar: true } },
              media: { select: { id: true, url: true, type: true }, take: 1 },
              _count: { select: { likes: true, comments: true } },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
          })
        : [],

      type === 'all' || type === 'tags'
        ? prisma.tag.findMany({
            where: {
              name: { contains: q, mode: 'insensitive' },
              products: { some: {} },
            },
            select: {
              id: true,
              name: true,
              _count: { select: { products: true } },
            },
            take: limit,
            skip: offset,
          })
        : [],
    ])

    return {
      success: true,
      // FIXED: Added stores and tags to the return object!
      data: { users, products, posts, stores, tags },
    }
  } catch (error: any) {
    if (error instanceof UserError)
      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
