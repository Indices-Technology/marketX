/**
 * Shared open-state for the cart drawer (CartSidebar). The drawer lives in
 * HomeLayout, but any page — a product page, a rail card — needs to open it, so
 * the flag is a `useState` singleton rather than a layout-local ref. Mirrors
 * useDassaPanel. SSR-safe (useState hydrates one value per request).
 */
export const useCartDrawer = () => {
  const isOpen = useState('cart-drawer-open', () => false)
  return {
    isOpen,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    },
    toggle: () => {
      isOpen.value = !isOpen.value
    },
  }
}
