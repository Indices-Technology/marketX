// POST /api/products/[id]/view — increment view count (no auth required)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

  const numId = parseInt(id, 10)
  if (isNaN(numId)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  try {
    await prisma.products.update({
      where: { id: numId },
      data: { viewCount: { increment: 1 } },
    })
    return { success: true }
  } catch {
    return { success: false }
  }
})
