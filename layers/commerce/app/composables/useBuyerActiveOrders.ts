/**
 * Count of the buyer's in-flight orders, for the mobile home panel.
 *
 * Module-level state with an in-flight guard, matching useSellerPendingOrders
 * and useLayoutData: the number is fetched once per session and re-read by any
 * surface that wants it, rather than once per mounting component.
 *
 * This is the one value on the panel that is NOT already hydrated at boot, so
 * it is a single count query — see buyer-active-count.get.ts for why a count
 * and not a slice of the order list.
 */
import { ref } from 'vue'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'

const activeOrders = ref(0)
let loaded = false
let inflight: Promise<void> | null = null

export const useBuyerActiveOrders = () => {
  /** @param force re-fetch even if already loaded (e.g. after placing an order) */
  const loadActiveOrders = async (force = false) => {
    if (!force && loaded) return
    if (inflight) return inflight

    inflight = (async () => {
      try {
        const res = await useOrderApi().getBuyerActiveCount()
        activeOrders.value = res?.data?.count ?? 0
        loaded = true
      } catch {
        // A missing tile beats a broken panel.
        activeOrders.value = 0
      } finally {
        inflight = null
      }
    })()
    return inflight
  }

  /** Clear on logout so the next account does not inherit this one's count. */
  const resetActiveOrders = () => {
    activeOrders.value = 0
    loaded = false
  }

  return { activeOrders, loadActiveOrders, resetActiveOrders }
}
