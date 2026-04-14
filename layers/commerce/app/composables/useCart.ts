import { notify } from '@kyvg/vue3-notification'
import { useCartApi } from '../services/cart.api'
import { useCartStore } from '../stores/cart.store'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import type { ICartItem } from '../types/commerce.types'
import type { CartItem } from '../types/cart'

export const useCart = () => {
  const api = useCartApi()
  const store = useCartStore()
  const profileStore = useProfileStore()

  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)
  const cartCount = computed(() => store.cartCount)
  const cartTotal = computed(() => store.cartTotal)
  const items = computed(() => store.items)

  // ── fetchCart ─────────────────────────────────────────────────────────────
  const fetchCart = async () => {
    if (!profileStore.isLoggedIn) return
    store.setLoading(true)
    store.setError(null)
    try {
      const result: { data: { items: CartItem[] } } = await api.getCart()
      store.setItems(result.data?.items || [])
      return result.data
    } catch (e: unknown) {
      const err = e as Error
      store.setError(err.message || 'Failed to fetch cart')
      throw e
    } finally {
      store.setLoading(false)
    }
  }

  // ── addToCart ─────────────────────────────────────────────────────────────
  // Guests: fetch variant data from the public API, then store locally.
  //         The Pinia store is persisted to localStorage, so items survive navigation.
  // Authenticated: sync to server, update store from response.
  const addToCart = async (variantId: number, quantity = 1) => {
    if (!profileStore.isLoggedIn) {
      store.setLoading(true)
      try {
        // Public endpoint — no auth needed
        const res = await $fetch<{ success: boolean; data: any }>(
          `/api/commerce/products/variants/${variantId}`,
        )
        const localItem: ICartItem = {
          id: `guest_${variantId}_${Date.now()}`,
          variantId,
          quantity,
          variant: res.data,
        } as ICartItem
        store.addItem(localItem)
        return localItem
      } catch {
        // Fallback: add with no variant data — at least variantId + quantity are correct for checkout
        store.addItem({ id: `guest_${variantId}`, variantId, quantity } as ICartItem)
      } finally {
        store.setLoading(false)
      }
      return
    }

    store.setLoading(true)
    store.setError(null)
    try {
      const result: { data: CartItem } = await api.addToCart(variantId, quantity)
      store.addItem(result.data as ICartItem)
      return result.data
    } catch (e: unknown) {
      const err = e as Error
      store.setError(err.message || 'Failed to add to cart')
      notify({ type: 'error', text: err.message || 'Failed to add to cart' })
      throw e
    } finally {
      store.setLoading(false)
    }
  }

  // ── updateQuantity ────────────────────────────────────────────────────────
  const updateQuantity = async (variantId: number, quantity: number) => {
    store.updateItem(variantId, quantity)
    if (!profileStore.isLoggedIn) return

    try {
      const result: { data: CartItem } = await api.updateQuantity(variantId, quantity)
      return result.data
    } catch (e: unknown) {
      const err = e as Error
      await fetchCart()
      store.setError(err.message || 'Failed to update cart')
      notify({ type: 'error', text: err.message || 'Failed to update cart' })
      throw e
    }
  }

  // ── removeFromCart ────────────────────────────────────────────────────────
  const removeFromCart = async (variantId: number) => {
    store.removeItem(variantId)
    if (!profileStore.isLoggedIn) return

    try {
      await api.removeFromCart(variantId)
    } catch (e: unknown) {
      const err = e as Error
      await fetchCart()
      store.setError(err.message || 'Failed to remove from cart')
      notify({ type: 'error', text: err.message || 'Failed to remove from cart' })
      throw e
    }
  }

  // ── syncGuestCartToServer ─────────────────────────────────────────────────
  // After a guest authenticates at checkout, push local items to the server
  // then refresh from server state.
  const syncGuestCartToServer = async () => {
    const localItems = [...store.items]
    await Promise.allSettled(
      localItems.map((item) => api.addToCart(item.variantId, item.quantity)),
    )
    await fetchCart()
  }

  return {
    isLoading,
    error,
    cartCount,
    cartTotal,
    items,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    syncGuestCartToServer,
  }
}
