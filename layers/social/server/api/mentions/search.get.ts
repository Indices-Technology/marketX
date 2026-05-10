// GET /api/mentions/search?q=text
// Returns users + sellers matching the query for @mention autocomplete.
import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { q = '' } = getQuery(event) as { q: string }
  const query = String(q).trim().slice(0, 50)
  if (!query) return { data: [] }

  const [users, sellers] = await Promise.all([
    prisma.profile.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, username: true, avatar: true },
      take: 5,
    }),
    prisma.sellerProfile.findMany({
      where: {
        is_active: true,
        OR: [
          { store_name: { contains: query, mode: 'insensitive' } },
          { store_slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        store_slug: true,
        store_name: true,
        store_logo: true,
        profileId: true,
      },
      take: 5,
    }),
  ])

  const results = [
    ...users.map((u) => ({
      type: 'user' as const,
      id: u.id,              // profileId — used for notification target
      handle: u.username,
      displayName: u.username,
      avatar: u.avatar ?? null,
    })),
    ...sellers.map((s) => ({
      type: 'seller' as const,
      id: s.profileId,       // seller owner's profileId — used for notification target
      handle: s.store_slug,
      displayName: s.store_name ?? s.store_slug,
      avatar: s.store_logo ?? null,
    })),
  ]

  return { data: results }
})
