// localStorage-backed "recently viewed" products for the product page.
// Stores a slim product shape (enough for ProductCardMini) so no extra fetch.
const KEY = 'mx_recently_viewed'
const MAX = 12

export function useRecentlyViewed() {
  const get = (): any[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as any[]) : []
    } catch {
      return []
    }
  }

  const add = (product: any) => {
    if (!import.meta.client || !product?.id) return
    const slim = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      discount: product.discount ?? null,
      media: (product.media ?? []).slice(0, 1),
      seller: product.seller
        ? {
            store_name: product.seller.store_name,
            store_slug: product.seller.store_slug,
            is_verified: product.seller.is_verified ?? null,
            locationLabel: product.seller.locationLabel ?? null,
          }
        : undefined,
      square: product.square ?? null,
      averageRating: product.averageRating ?? null,
      totalReviews: product.totalReviews ?? null,
    }
    const next = [slim, ...get().filter((x) => x.id !== product.id)].slice(
      0,
      MAX,
    )
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return { get, add }
}
