// GET /api/squares/:slug/officers — list all officers (officer or admin only)
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { squareService } from '../../../../services/square.service'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  if (user.role !== 'admin') {
    const square = await prisma.square.findUnique({ where: { slug }, select: { id: true } })
    if (!square) throw createError({ statusCode: 404, statusMessage: 'Square not found' })

    const officer = await prisma.squareOfficer.findFirst({
      where: { squareId: square.id, profileId: user.id },
    })
    if (!officer)
      throw createError({ statusCode: 403, statusMessage: 'Officers only' })
  }

  const officers = await squareService.listOfficers(slug)
  return { success: true, data: officers }
})
