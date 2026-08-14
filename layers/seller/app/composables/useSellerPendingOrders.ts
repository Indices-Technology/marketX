/**
 * Seller's "orders awaiting action" count.
 *
 * Module-level state rather than per-component: the count survives the mounting
 * component being torn down and rebuilt (a layout swap, navigating away and
 * back), so returning to home does not refetch a number we already have.
 * Extracted when the mobile status strip needed the same value SellerHubDock
 * was fetching; the dock has since been removed, leaving the strip as the only
 * consumer — but the caching reason stands on its own, and a second surface
 * wanting this count is a matter of time.
 *
 * Same shape as useLayoutData's `_inflight` guard, for the same reason.
 */
import { ref } from 'vue'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'

const pendingOrders = ref(0)
/** Slug the current value belongs to — switching stores must invalidate it. */
let loadedFor: string | null = null
let inflight: Promise<void> | null = null

export const useSellerPendingOrders = () => {
  /**
   * @param slug   the store to count for; falsy resets to 0
   * @param force  re-fetch even if this slug is already loaded (used on
   *               navigation, where the seller may have just shipped something)
   */
  const loadPendingOrders = async (slug?: string | null, force = false) => {
    if (!slug) {
      pendingOrders.value = 0
      loadedFor = null
      return
    }
    if (!force && loadedFor === slug) return
    if (inflight) return inflight

    inflight = (async () => {
      try {
        const res = await useOrderApi().getSellerPendingCount(slug)
        pendingOrders.value = res?.data?.count ?? 0
        loadedFor = slug
      } catch {
        // A missing badge is strictly better than a broken dock.
        pendingOrders.value = 0
      } finally {
        inflight = null
      }
    })()
    return inflight
  }

  return { pendingOrders, loadPendingOrders }
}
