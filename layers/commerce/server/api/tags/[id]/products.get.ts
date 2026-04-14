// GET /api/tags/:id/products
import { tagRepository } from '~~/layers/commerce/server/repositories/tag.repository'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const tag = await tagRepository.getTagById(id)
  if (!tag) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

  const [products, total] = await Promise.all([
    tagRepository.getProductsByTag(id, limit, offset),
    tagRepository.countProductsByTag(id),
  ])

  return { success: true, data: { tag, products, total } }
})
