// POST /api/stories/[id]/view — increment view count (no auth required)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

  try {
    await prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    return { success: true }
  } catch {
    return { success: false }
  }
})
