const storyInclude = {
  author: {
    select: { id: true, username: true, avatar: true },
  },
  media: {
    select: { id: true, url: true, type: true },
  },
  product: {
    select: { id: true, title: true, price: true, bannerImageUrl: true },
  },
}

export const storyRepository = {
  async createStory(authorId: string, mediaId: string, productId?: number) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    return prisma.story.create({
      data: {
        authorId,
        mediaId,
        expiresAt,
        ...(productId ? { productId } : {}),
      },
      include: storyInclude,
    })
  },

  async getActiveStories(limit = 50) {
    return prisma.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: storyInclude,
      orderBy: { created_at: 'desc' },
      take: limit,
    })
  },

  async getActiveStoriesForUser(userId: string, limit = 50) {
    // Single follow query for all types, then resolve seller profileIds in parallel
    const allFollows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true, followingType: true },
    })

    const userFollowIds = allFollows
      .filter((f) => f.followingType === 'USER')
      .map((f) => f.followingId)
    const sellerFollowIds = allFollows
      .filter((f) => f.followingType === 'SELLER')
      .map((f) => f.followingId)

    const sellerProfileIds = sellerFollowIds.length
      ? (
          await prisma.sellerProfile.findMany({
            where: { id: { in: sellerFollowIds } },
            select: { profileId: true },
          })
        ).map((s) => s.profileId)
      : []

    const profileIds = [userId, ...userFollowIds, ...sellerProfileIds]

    const stories = await prisma.story.findMany({
      where: { authorId: { in: profileIds }, expiresAt: { gt: new Date() } },
      include: storyInclude,
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    // No followed-user stories? Fall back to all active public stories
    if (!stories.length) {
      return prisma.story.findMany({
        where: { expiresAt: { gt: new Date() } },
        include: storyInclude,
        orderBy: { created_at: 'desc' },
        take: limit,
      })
    }

    return stories
  },

  async getMyStories(authorId: string) {
    return prisma.story.findMany({
      where: { authorId },
      include: storyInclude,
      orderBy: { created_at: 'desc' },
    })
  },

  async getStoryById(id: string) {
    return prisma.story.findUnique({ where: { id }, include: storyInclude })
  },

  async deleteStory(id: string) {
    return prisma.story.delete({ where: { id } })
  },

  async deleteExpiredStories() {
    return prisma.story.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    })
  },
}
