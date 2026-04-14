// GET /api/commerce/categories
import { productRepository } from '../../../repositories/product.repository'

export default defineEventHandler(async (event) => {
  const categories = await remember(
    'data:categories',
    3600, // 1 hour — categories almost never change at runtime
    () => productRepository.getCategories(),
  )
  setHeader(event, 'Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
  return { success: true, data: categories }
})
