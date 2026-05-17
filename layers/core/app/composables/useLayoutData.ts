import type { Seller } from '~~/shared/types/seller'
import type { Category } from '~~/shared/types/category'

// Module-level guard: reuse the same in-flight Promise across all callers
// so multiple components mounting simultaneously make exactly one HTTP request pair.
let _inflight: Promise<[PromiseSettledResult<{ data: Seller[] }>, PromiseSettledResult<{ data: Category[] }>]> | null = null

export const useLayoutData = () => {
  return useLazyAsyncData(
    'layout-data',
    async () => {
      if (!_inflight) {
        _inflight = Promise.allSettled([
          $fetch<{ data: Seller[] }>('/api/seller/featured'),
          $fetch<{ data: Category[] }>('/api/commerce/categories'),
        ])
        _inflight.finally(() => { _inflight = null })
      }
      const [sellersRes, categoriesRes] = await _inflight
      return {
        topSellers:
          sellersRes.status === 'fulfilled' ? sellersRes.value?.data ?? [] : [],
        categories:
          categoriesRes.status === 'fulfilled'
            ? categoriesRes.value?.data ?? []
            : [],
      }
    },
    {
      server: false,
      dedupe: 'defer',
      default: () => ({
        topSellers: [] as Seller[],
        categories: [] as Category[],
      }),
    },
  )
}
