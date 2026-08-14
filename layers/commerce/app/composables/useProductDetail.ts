import { ref } from 'vue'
import { useRouter } from '#imports'
import { useStorefront } from '~~/layers/seller/app/composables/useStorefront'
import type { IProduct } from '../types/commerce.types'

export const useProductDetail = () => {
  const router = useRouter()
  // Carries storefront context across the click. A no-op on the marketplace, so
  // every existing caller keeps its current behaviour; inside a seller's shop it
  // keeps the visitor in that shop instead of dropping them into the
  // marketplace product page with its competing rails.
  const { storeLink } = useStorefront()

  // Kept as stubs so existing template bindings (:product="selectedProduct" v-if="selectedProduct") compile and stay inert.
  const selectedProduct = ref<IProduct | null>(null)
  const detailLoading = ref(false)

  const prefetchProduct = (_id: number) => {}

  const openProduct = (productOrId: IProduct | number) => {
    const slug =
      typeof productOrId === 'object' ? (productOrId as IProduct).slug : null
    if (slug) {
      router.push(storeLink(`/product/${slug}`))
    } else {
      const id = typeof productOrId === 'number' ? productOrId : productOrId.id
      router.push(storeLink(`/product/${id}`))
    }
  }

  return { selectedProduct, detailLoading, openProduct, prefetchProduct }
}
