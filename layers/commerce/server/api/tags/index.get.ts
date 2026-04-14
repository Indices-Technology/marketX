// GET /api/tags
import { tagRepository } from '~~/layers/commerce/server/repositories/tag.repository'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const search = String(query.search || '').trim()

  if (!search) {
    setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=120')
  }

  const tags = await tagRepository.getTags(search, limit)
  return { success: true, data: tags }
})
