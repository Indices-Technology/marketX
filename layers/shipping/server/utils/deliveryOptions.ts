/**
 * Public delivery-options summary for a seller.
 *
 * A buyer deciding whether to order wants to know *how it reaches them* before
 * they reach checkout — "can I pick it up?", "do I pay the rider?", "who
 * delivers?". Those answers live in `SellerProfile.shippingConfig` and
 * `pod_enabled`, neither of which a storefront can read: `shippingConfig` is in
 * SELLER_PRIVATE_OMIT, and it carries flat rates and per-zone pricing that are
 * the seller's commercial business, not a shop window.
 *
 * So this derives a small, safe shape instead of widening the omit list. Prices
 * are deliberately excluded — a real quote depends on the destination address
 * and comes from /api/shipping/rates at checkout. Promising a figure here that
 * the quote then contradicts is worse than promising nothing.
 */
import { isGigEnabled } from '../providers/gig/client'
import type { SellerShippingConfig } from './types'

/**
 * Pay-on-Delivery is paused platform-wide behind the same runtime flag checkout
 * reads (CheckoutPaymentMethod.vue: `useRuntimeConfig().public.podEnabled`).
 * A seller's own `pod_enabled` is their standing preference and is preserved,
 * but advertising POD while checkout refuses to offer it is a promise the
 * buyer discovers is false at the worst possible moment.
 */
function isPodEnabled(): boolean {
  return process.env.NUXT_PUBLIC_POD_ENABLED === 'true'
}

export type DeliveryOptionKey =
  | 'pickup'
  | 'seller_delivery'
  | 'pay_rider'
  | 'gig'
  | 'pod'

export interface DeliveryOption {
  key: DeliveryOptionKey
  label: string
  /** One short clarifying line, or null when the label says it all. */
  detail: string | null
  icon: string
}

export function deriveDeliveryOptions(seller: {
  shippingConfig?: unknown
  pod_enabled?: boolean | null
  pod_delivery_days?: number | null
}): DeliveryOption[] {
  const cfg = (seller.shippingConfig ?? null) as SellerShippingConfig | null
  const out: DeliveryOption[] = []

  // Pickup first: it is the cheapest for the buyer and the most reassuring for
  // a first-time customer, who can see the seller face to face.
  if (cfg?.pickupEnabled) {
    out.push({
      key: 'pickup',
      label: 'Pick up in store',
      detail:
        cfg.pickupNote?.trim() || 'Collect from the seller, no delivery fee',
      icon: 'solar:shop-2-linear',
    })
  }

  if (cfg?.selfEnabled) {
    // etaText is free text the seller typed and is often terse ("3-5"), which
    // reads as nothing on its own. Frame it rather than print it bare, and keep
    // their exact words — we do not know the units well enough to add "days".
    const eta = cfg.etaText?.trim()
    out.push({
      key: 'seller_delivery',
      label: 'Seller delivery',
      detail: eta
        ? `Delivered by the seller, ETA ${eta}`
        : 'Delivered by the seller',
      icon: 'solar:scooter-linear',
    })
  }

  // Distinct from `pod` below: this is the DELIVERY FEE paid in cash to the
  // rider. The goods are still escrowed. Conflating the two is how a buyer ends
  // up thinking the whole order is pay-on-delivery when only the fee is.
  if (cfg?.payDriverEnabled) {
    out.push({
      key: 'pay_rider',
      // Named away from "pay on delivery" deliberately. Only the DELIVERY FEE
      // is cash; the item itself is paid online and escrowed. The old wording
      // ("Pay the rider on delivery") read as Pay-on-Delivery to us reviewing
      // it, so it certainly reads that way to a buyer -- and POD is paused,
      // making that the one impression this line must not leave.
      label: 'Delivery fee paid on arrival',
      detail: 'Item is paid online. Cash to the rider covers delivery only.',
      icon: 'solar:wad-of-money-linear',
    })
  }

  // Seller-level default is ENABLED (only an explicit false opts out), but the
  // platform pause wins regardless — never advertise a carrier we cannot book.
  if (cfg?.gigEnabled !== false && isGigEnabled()) {
    out.push({
      key: 'gig',
      label: 'GIG Logistics',
      detail: 'Nationwide courier, tracked',
      icon: 'solar:box-linear',
    })
  }

  if (seller.pod_enabled && isPodEnabled()) {
    const days = seller.pod_delivery_days ?? 0
    out.push({
      key: 'pod',
      label: 'Pay on delivery',
      // ASCII only, like the other details above: an em dash in this file came
      // back through the API as U+FFFD, so the punctuation is not worth the risk.
      detail:
        days > 0
          ? `Pay for the item on arrival, about ${days} days`
          : 'Pay for the item on arrival',
      icon: 'solar:hand-money-linear',
    })
  }

  return out
}
