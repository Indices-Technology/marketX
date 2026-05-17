// GET /api/seller/following-ids
// Returns the DB IDs of all sellers the current user follows
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)

  const ids = await remember(`seller:following-ids:${currentUser.id}`, 120, async () => {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUser.id, followingType: 'SELLER' },
      select: { followingId: true },
    })
    return follows.map((f: { followingId: string }) => f.followingId)
  })

  return { success: true, data: ids }
})
