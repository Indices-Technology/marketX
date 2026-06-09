// PATCH /api/squares/:slug — platform admin OR square Chairman updates a Square
import { ZodError } from 'zod'
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { updateSquareSchema } from '../../../schemas/square.schema'
import { squareService } from '../../../services/square.service'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug required' })

  // Allow platform admins OR the square's own Chairman
  if (user.role !== 'admin') {
    const square = await prisma.square.findUnique({ where: { slug }, select: { id: true } })
    if (!square) throw createError({ statusCode: 404, statusMessage: 'Square not found' })

    const officer = await prisma.squareOfficer.findFirst({
      where: { squareId: square.id, profileId: user.id, role: 'CHAIRMAN' },
    })
    if (!officer)
      throw createError({ statusCode: 403, statusMessage: 'Only the Chairman or a platform admin can edit square settings' })
  }

  try {
    const body = await readBody(event)
    const data = updateSquareSchema.parse(body)
    const square = await squareService.updateSquare(slug, data)
    return { success: true, data: square }
  } catch (e) {
    if (e instanceof ZodError)
      throw createError({ statusCode: 400, statusMessage: 'Validation error', data: e.errors })
    throw e
  }
})
