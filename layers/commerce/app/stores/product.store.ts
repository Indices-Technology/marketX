/** Minimal shape every stored product must have. Superset types (ProductDetail, list items) are compatible. */
interface StoredProduct {
  id: number
  [key: string]: unknown
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Map<number, StoredProduct>>(new Map())
  const sellerProducts = ref<Map<string, number[]>>(new Map()) // storeSlug -> productIds
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getProductById = (id: number) => products.value.get(id)

  const getProductsBySellerSlug = (storeSlug: string) => {
    const ids = sellerProducts.value.get(storeSlug) || []
    return ids.map((id) => products.value.get(id)).filter(Boolean)
  }

  const addProducts = (newProducts: StoredProduct[], storeSlug?: string) => {
    newProducts.forEach((p) => products.value.set(p.id, p))
    if (storeSlug) {
      const existing = sellerProducts.value.get(storeSlug) || []
      const newIds = newProducts.map((p) => p.id)
      sellerProducts.value.set(storeSlug, [
        ...new Set([...existing, ...newIds]),
      ])
    }
  }

  const setProduct = (product: StoredProduct) => products.value.set(product.id, product)

  const removeProduct = (id: number) => {
    products.value.delete(id)
    sellerProducts.value.forEach((ids, slug) => {
      sellerProducts.value.set(
        slug,
        ids.filter((i) => i !== id),
      )
    })
  }

  return {
    products,
    sellerProducts,
    isLoading,
    error,
    getProductById,
    getProductsBySellerSlug,
    addProducts,
    setProduct,
    removeProduct,
    setLoading: (val: boolean) => {
      isLoading.value = val
    },
    setError: (val: string | null) => {
      error.value = val
    },
  }
})
