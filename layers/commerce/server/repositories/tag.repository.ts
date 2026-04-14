const tagProductInclude = {
  seller: {
    select: { store_name: true, store_slug: true, default_currency: true },
  },
  media: {
    where: { isBgMusic: false },
    take: 1,
    select: { url: true, type: true },
  },
  variants: {
    select: { id: true, stock: true, price: true, size: true },
  },
  _count: { select: { likes: true, comments: true } },
} as const

export const tagRepository = {
  async getTags(search: string, limit: number) {
    const where: any = {
      OR: [{ products: { some: {} } }, { posts: { some: {} } }],
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    return prisma.tag.findMany({
      where,
      select: {
        id: true,
        name: true,
        _count: { select: { products: true, posts: true } },
      },
      orderBy: { products: { _count: 'desc' } },
      take: limit,
    })
  },

  async getTagById(id: number) {
    return prisma.tag.findUnique({
      where: { id },
      select: { id: true, name: true },
    })
  },

  async getProductsByTag(tagId: number, limit: number, offset: number) {
    return prisma.products.findMany({
      where: { status: 'PUBLISHED', tags: { some: { tagId } } },
      include: tagProductInclude,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    })
  },

  async countProductsByTag(tagId: number): Promise<number> {
    return prisma.products.count({
      where: { status: 'PUBLISHED', tags: { some: { tagId } } },
    })
  },
}
