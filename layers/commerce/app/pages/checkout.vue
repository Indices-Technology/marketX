<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <Icon name="solar:arrow-left-linear" size="22" />
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
          Checkout
        </h1>
      </div>

      <!-- Auth step (guests only) -->
      <CheckoutAuthStep v-if="showAuthStep" @authenticated="onAuthenticated" />

      <!-- Logged in: show form immediately, lazy-load order summary -->
      <div v-else class="space-y-5">
        <!-- Delivery first — per-seller shipping rates depend on the address -->
        <CheckoutDelivery :form="form" @address-changed="onAddressChanged" />

        <!-- Skeleton while cart loads, empty state after, seller packages when ready -->
        <template v-if="!hasFetchedOnce">
          <div class="space-y-3">
            <div
              v-for="i in 2"
              :key="i"
              class="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="flex gap-3">
                <div
                  class="h-14 w-14 rounded-xl bg-gray-100 dark:bg-neutral-800"
                />
                <div class="flex-1 space-y-2">
                  <div
                    class="h-4 w-3/4 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                  <div
                    class="h-3 w-1/2 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="!items.length">
          <div class="py-16 text-center">
            <Icon
              name="solar:cart-large-2-linear"
              size="48"
              class="mb-3 text-gray-300 dark:text-neutral-600"
            />
            <p class="font-medium text-gray-600 dark:text-neutral-400">
              Your cart is empty
            </p>
            <NuxtLink
              to="/discover"
              class="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
            >
              Browse products
            </NuxtLink>
          </div>
        </template>
        <template v-else>
          <!-- Currency badge — shown when not NGN -->
          <div
            v-if="activeCurrency !== 'NGN'"
            class="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
          >
            <Icon name="solar:transfer-horizontal-linear" size="15" />
            <template v-if="paymentMethod === 'paypal'">
              Prices shown in <strong>{{ activeCurrency }}</strong
              >. Payment is charged in <strong>USD</strong> via PayPal.
            </template>
            <template v-else>
              Prices shown in <strong>{{ activeCurrency }}</strong
              >. Payment is charged in NGN via Paystack.
            </template>
          </div>

          <!-- One card per seller: their products + their shipping together -->
          <div class="space-y-3">
            <p
              v-if="sellerGroups.length > 1"
              class="px-1 text-[12px] font-medium text-gray-500 dark:text-neutral-400"
            >
              Ships in {{ sellerGroups.length }} packages
            </p>
            <CheckoutSellerPackage
              v-for="g in sellerGroups"
              :key="g.slug"
              :store-slug="g.slug"
              :store-name="sellerGroups.length > 1 ? g.storeName : ''"
              :items="g.items"
              :subtotal-major="g.subtotalMajor"
              :shipping-major="groupShippingMajor(g.slug)"
              :active-currency="activeCurrency"
              :shipping-calculation="shippingCalculation"
              :live-rates="shipBySeller[g.slug]?.rates ?? []"
              :selected-rate="shipBySeller[g.slug]?.selected ?? null"
              :is-loading-rates="shipBySeller[g.slug]?.loading ?? false"
              :shipping-loading="shippingLoading"
              :rates-error="shipBySeller[g.slug]?.error ?? null"
              :active-country="activeCountry"
              @update:selected-rate="
                (r) => {
                  const s = shipBySeller[g.slug]
                  if (s) s.selected = r
                }
              "
            />
          </div>
        </template>

        <!-- Order Total -->
        <div
          class="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div
            class="flex justify-between text-sm text-gray-600 dark:text-neutral-400"
          >
            <span>Subtotal</span>
            <div class="text-right">
              <span>{{ fmtP(cartTotal) }}</span>
              <span
                v-if="activeCurrency !== 'NGN'"
                class="ml-1 text-xs text-gray-400"
                >({{ fmtPNGN(cartTotal) }})</span
              >
            </div>
          </div>
          <div
            class="flex justify-between text-sm text-gray-600 dark:text-neutral-400"
          >
            <span>Shipping</span>
            <div class="text-right">
              <span>{{ shippingDisplay }}</span>
              <span
                v-if="
                  activeCurrency !== 'NGN' &&
                  activeCountry === 'NG' &&
                  shippingCalculation &&
                  shippingCalculation.cost > 0
                "
                class="ml-1 text-xs text-gray-400"
                >({{ fmtNGN(shippingCalculation.cost) }})</span
              >
            </div>
          </div>

          <!-- Insurance: subtle breakdown + opt-out (GIG carrier rates only) -->
          <label
            v-if="insurable"
            class="flex cursor-pointer items-center justify-between gap-2 text-[12px] text-gray-400 dark:text-neutral-500"
          >
            <span class="flex items-center gap-1.5">
              <input
                v-model="insureShipment"
                type="checkbox"
                class="h-3.5 w-3.5 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
              />
              Insure shipment against loss or damage
            </span>
            <span v-if="insureShipment && insuranceCostMajor > 0">
              incl. {{ fmtPNGN(insuranceCostMajor) }}
            </span>
          </label>
          <div
            class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-neutral-800 dark:text-neutral-100"
          >
            <span>Total</span>
            <div class="text-right">
              <span>{{ fmtP(grandTotalMajor) }}</span>
              <span
                v-if="activeCurrency !== 'NGN'"
                class="ml-1 text-xs font-normal text-gray-400"
                >({{ fmtPNGN(grandTotalMajor) }})</span
              >
            </div>
          </div>

          <!-- Pay-on-delivery heads-up: cash the buyer owes the rider on arrival,
               separate from the online total above. -->
          <div
            v-if="codDeliveryMajor > 0"
            class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          >
            <span class="flex items-center gap-1.5">
              <Icon name="solar:wad-of-money-linear" size="14" />
              Cash for the rider on delivery
            </span>
            <span class="font-semibold">+ {{ fmtP(codDeliveryMajor) }}</span>
          </div>
        </div>

        <CheckoutPaymentMethod
          v-model="paymentMethod"
          :country="form.country"
          :shipping-cost-major="shippingCostMajor"
          :pod-available="cartStore.podAvailable"
          :cart-total="cartTotal"
        />

        <!-- Error -->
        <div
          v-if="checkoutError"
          class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          {{ checkoutError }}
        </div>

        <!-- Pay button -->
        <button
          :disabled="isSubmitting || !isFormValid"
          class="flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl py-4 text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            paymentMethod === 'paypal'
              ? 'bg-[#0070ba] hover:bg-[#005ea6]'
              : paymentMethod === 'pod'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-brand hover:bg-brand/90'
          "
          @click="handleCheckout"
        >
          <Icon
            v-if="isSubmitting"
            name="eos-icons:loading"
            size="20"
            class="animate-spin"
          />
          <template v-else>
            <span class="text-base font-bold">
              <template v-if="paymentMethod === 'paypal'">
                Pay ${{
                  grandTotalUSD.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                with PayPal
              </template>
              <template v-else-if="paymentMethod === 'pod'">
                Pay {{ fmtPNGN(shippingCostMajor) }} shipping now
              </template>
              <template v-else>
                {{
                  activeCurrency === 'NGN'
                    ? `Pay ${fmtPNGN(grandTotalMajor)}`
                    : `Pay ${fmtP(grandTotalMajor)}`
                }}
              </template>
            </span>
            <span
              v-if="paymentMethod === 'pod'"
              class="text-[11px] font-normal opacity-80"
            >
              + {{ fmtPNGN(cartTotal) }} on delivery
            </span>
            <span
              v-else-if="paymentMethod !== 'paypal' && activeCurrency !== 'NGN'"
              class="text-[11px] font-normal opacity-80"
            >
              Charged as {{ fmtPNGN(grandTotalMajor) }}
            </span>
          </template>
          <span v-if="isSubmitting" class="text-sm"
            >Redirecting to payment…</span
          >
        </button>

        <p class="text-center text-xs text-gray-400 dark:text-neutral-500">
          {{
            paymentMethod === 'paypal'
              ? 'Secured by PayPal · USD payment'
              : paymentMethod === 'pod'
                ? 'Shipping secured by Paystack · Product paid cash on delivery'
                : 'Secured by Paystack · Your payment is encrypted'
          }}
        </p>
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
// Checkout depends on client-only auth state — SSR output would always mismatch
definePageMeta({ ssr: false })

import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { useShipping } from '~~/layers/commerce/app/composables/useShipping'
import { useRuntimeConfig } from '#app'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'
import { useSeo } from '~~/app/composables/useSeo'
import {
  useCartStore,
  effectiveUnitPrice,
} from '~~/layers/commerce/app/stores/cart.store'
import type { IShipmentRate } from '~~/layers/shipping/server/legacy/types'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import CheckoutAuthStep from '../components/checkout/CheckoutAuthStep.vue'
import CheckoutDelivery from '../components/checkout/CheckoutDelivery.vue'
import CheckoutSellerPackage from '../components/checkout/CheckoutSellerPackage.vue'
import CheckoutPaymentMethod from '../components/checkout/CheckoutPaymentMethod.vue'
import type { ICartItem } from '~~/layers/commerce/app/types/commerce.types'

const { setCheckoutPage } = useSeo()
setCheckoutPage()

const profileStore = useProfileStore()
const showAuthStep = computed(() => !profileStore.isLoggedIn)

const { items, cartTotal, fetchCart, hasFetchedOnce } = useCart()
const cartStore = useCartStore()

const {
  calculation: shippingCalculation,
  calculateShipping,
  isLoading: shippingLoading,
  fetchRatesFor,
} = useShipping()

const {
  getCurrencyForCountry,
  formatPrice: formatProduct,
  formatNGN,
  formatProductNGN,
} = useCurrency()

const orderApi = useOrderApi()
const { getStoredRef, clearStoredRef, captureAffiliateRef } = useAffiliate()
const config = useRuntimeConfig()

const isSubmitting = ref(false)
const paymentMethod = ref<'paystack' | 'paypal' | 'pod'>('paystack')
const checkoutError = ref('')

const form = reactive({
  name: '',
  email: '',
  address: '',
  county: '',
  state: '',
  zipcode: '',
  country: '',
  phone: '',
})

const DEFAULT_PARCEL = { weightKg: 0.5, lengthCm: 20, widthCm: 15, heightCm: 5 }

const activeCountry = computed(() => form.country)
const activeCurrency = computed(() => getCurrencyForCountry(form.country))

// ── Per-seller shipping (multi-vendor) ──────────────────────────────────────
// A cart can span several sellers; each ships its own parcel. We group the cart
// by seller, quote each seller independently, and sum the chosen options.
interface SellerGroup {
  slug: string
  storeName: string
  subtotalMajor: number
  items: ICartItem[]
}
const sellerGroups = computed<SellerGroup[]>(() => {
  const map = new Map<string, SellerGroup>()
  for (const it of items.value) {
    const seller = it.variant?.product?.seller
    const slug = seller?.store_slug
    if (!slug) continue
    const g = map.get(slug) ?? {
      slug,
      storeName: seller?.store_name || 'Seller',
      subtotalMajor: 0,
      items: [],
    }
    g.subtotalMajor += effectiveUnitPrice(it) * (it.quantity || 1)
    g.items.push(it)
    map.set(slug, g)
  }
  return [...map.values()]
})

interface SellerShip {
  rates: IShipmentRate[]
  selected: IShipmentRate | null
  loading: boolean
  error: string | null
}
const shipBySeller = reactive<Record<string, SellerShip>>({})

// Insure shipments for their value (carrier declared-value cover, ~1% at GIG).
// On by default for buyer protection; toggling re-quotes without the premium.
const insureShipment = ref(true)

const fetchSellerRates = async () => {
  // State drives carrier station resolution — for NG we must have it before quoting.
  const needsState = (form.country || 'NG') === 'NG'
  if (!form.address || !form.country || (needsState && !form.state)) return
  const to = {
    name: form.name || 'Customer',
    street1: form.address,
    city: form.county,
    state: form.state,
    zip: form.zipcode || '000000',
    country: form.country,
  }
  await Promise.all(
    sellerGroups.value.map(async (g) => {
      // Ensure the key exists, then read it back through the reactive proxy.
      // (Mutating the raw object created in the `??` would bypass reactivity and
      // leave `shippingCostMajor` frozen at its pre-rate fallback value.)
      if (!shipBySeller[g.slug])
        shipBySeller[g.slug] = {
          rates: [],
          selected: null,
          loading: false,
          error: null,
        }
      const s: SellerShip = shipBySeller[g.slug]!
      s.loading = true
      s.error = null
      const { rates, error } = await fetchRatesFor({
        storeSlug: g.slug,
        to,
        parcel: DEFAULT_PARCEL,
        subtotalMinor: Math.round(g.subtotalMajor * 100),
        insure: insureShipment.value,
      })
      s.rates = rates
      s.error = error
      // Pre-select the cheapest so a buyer can just pay; they can change it.
      s.selected = rates.length
        ? rates.reduce((a, b) => (a.amountNGN <= b.amountNGN ? a : b))
        : null
      s.loading = false
    }),
  )
}

const onAddressChanged = () => {
  calculateShipping(form.country)
  fetchSellerRates()
}

const onAuthenticated = ({ name }: { name: string; isNewUser: boolean }) => {
  if (name && !form.name) form.name = name
  // CheckoutDelivery loads saved addresses in its own onMounted once isLoggedIn is true
}

/** Chosen shipping for one seller (major NGN): selected rate, else flat fallback. */
const groupShippingMajor = (slug: string): number => {
  const s = shipBySeller[slug]
  if (s?.selected) return s.selected.amountNGN
  return (shippingCalculation.value?.cost ?? 0) / 100 // flat fallback per parcel
}

const shippingCostMajor = computed((): number =>
  sellerGroups.value.reduce((sum, g) => sum + groupShippingMajor(g.slug), 0),
)

// Total pass-through insurance across the chosen rates (major NGN) — for the
// subtle checkout breakdown.
const insuranceCostMajor = computed((): number =>
  sellerGroups.value.reduce(
    (sum, g) => sum + (shipBySeller[g.slug]?.selected?.insuranceNGN ?? 0),
    0,
  ),
)

// Insurance only applies to carrier (GIG) rates — show the opt-out only then.
const insurable = computed((): boolean =>
  sellerGroups.value.some(
    (g) => shipBySeller[g.slug]?.selected?.provider === 'gig',
  ),
)

// Re-quote every seller when the buyer toggles insurance on/off.
watch(insureShipment, () => fetchSellerRates())

const grandTotalMajor = computed(
  () => cartTotal.value + shippingCostMajor.value,
)

const grandTotalUSD = computed(
  () => Math.round((grandTotalMajor.value / 1600) * 100) / 100,
)

const shippingDisplay = computed(() => {
  const c = shippingCostMajor.value
  return c === 0 ? 'Free' : fmtP(c)
})

// Total delivery cash the buyer pays riders on arrival (pay-on-delivery
// self-shipping). Shown as a heads-up — it is NOT part of the online charge.
const codDeliveryMajor = computed((): number =>
  sellerGroups.value.reduce((sum, g) => {
    const sel = shipBySeller[g.slug]?.selected
    return sum + (sel?.payOnDelivery ? sel.codAmountNGN ?? 0 : 0)
  }, 0),
)

/** Per-seller shipping breakdown — sent with the order (Phase 2 splits on this). */
const shippingBreakdown = computed(() =>
  sellerGroups.value.map((g) => {
    const sel = shipBySeller[g.slug]?.selected
    return {
      storeSlug: g.slug,
      storeName: g.storeName,
      carrier: sel?.carrier ?? 'Standard',
      service: sel?.service ?? 'Flat',
      provider: sel?.provider ?? null,
      amount: Math.round(groupShippingMajor(g.slug) * 100), // kobo
      // Signed quote token — lets the server re-derive the shipping charge
      // instead of trusting `amount`.
      token: sel?.token,
      estimatedDays:
        sel?.estimatedDays ?? shippingCalculation.value?.estimatedDays ?? '',
    }
  }),
)

const fmtP = (majorNGN: number) => formatProduct(majorNGN, activeCurrency.value)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
const fmtNGN = (kobo: number) => formatNGN(kobo)

// Every seller group must have a chosen option (or a flat fallback available),
// and none still loading.
const shippingReady = computed(
  () =>
    sellerGroups.value.length > 0 &&
    sellerGroups.value.every((g) => {
      const s = shipBySeller[g.slug]
      return !s?.loading && (!!s?.selected || !!shippingCalculation.value)
    }),
)

const isFormValid = computed(
  () =>
    hasFetchedOnce.value &&
    items.value.length > 0 &&
    !!form.name.trim() &&
    !!form.address.trim() &&
    !!form.country &&
    // NG destinations must pick a state — the carrier can't ship without it.
    (form.country !== 'NG' || !!form.state) &&
    shippingReady.value,
)

const handleCheckout = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  checkoutError.value = ''
  isSubmitting.value = true

  const breakdown = shippingBreakdown.value
  const shippingCost = breakdown.reduce((sum, b) => sum + b.amount, 0) // kobo total
  const shippingZone =
    breakdown.length === 1
      ? `${breakdown[0]!.carrier} ${breakdown[0]!.service}`
      : `${breakdown.length} parcels`
  const estimatedDays = breakdown[0]?.estimatedDays
  const affiliateCode = getStoredRef() || undefined

  const orderPayload = {
    items: items.value.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    })),
    name: form.name,
    email: form.email || undefined,
    address: form.address,
    county: form.county,
    shipState: form.state || undefined,
    shipPhone: form.phone || undefined,
    zipcode: form.zipcode,
    country: form.country,
    shippingCost,
    shippingZone,
    estimatedDays,
    // Per-seller shipping selections — backend stores this; Phase 2 splits on it.
    shippingBreakdown: breakdown,
    ...(affiliateCode ? { affiliateCode } : {}),
  }

  try {
    if (paymentMethod.value === 'paypal') {
      const result = await orderApi.initializePayPal(orderPayload)
      if (!result?.data?.approvalUrl)
        throw new Error('PayPal did not return an approval URL')
      clearStoredRef()
      window.location.href = result.data.approvalUrl
    } else if (paymentMethod.value === 'pod') {
      const result = await orderApi.initializePOD({
        ...orderPayload,
        callback_url: `${config.public.baseURL}/buyer/orders?payment=pod`,
      })
      clearStoredRef()
      window.location.href = result.data.authorizationUrl
    } else {
      const result = await orderApi.initializePayment({
        ...orderPayload,
        currency: 'NGN',
        callback_url: `${config.public.baseURL}/buyer/orders?payment=success`,
      })
      clearStoredRef()
      window.location.href = result.data.authorizationUrl
    }
  } catch (e: unknown) {
    checkoutError.value = extractErrorMessage(
      e,
      'Failed to initialize payment. Please try again.',
    )
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  captureAffiliateRef()
  await fetchCart()
  if (profileStore.isLoggedIn) {
    const profileEmail = profileStore.me?.email
    const FAKE_TLDS = new Set(['test', 'demo', 'local', 'example', 'invalid'])
    const tld = profileEmail?.split('.').pop()?.toLowerCase() ?? ''
    if (profileEmail && !FAKE_TLDS.has(tld)) form.email = profileEmail
  }
})
</script>
