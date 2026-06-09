<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <Icon name="mdi:arrow-left" size="22" />
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
          Checkout
        </h1>
      </div>

      <!-- Auth step (guests only) -->
      <CheckoutAuthStep v-if="showAuthStep" @authenticated="onAuthenticated" />

      <!-- Logged in: show form immediately, lazy-load order summary -->
      <div v-else class="space-y-5">
        <!-- Order summary: skeleton while cart loads, empty state after, real items when ready -->
        <template v-if="!hasFetchedOnce">
          <div class="space-y-3">
            <div
              v-for="i in 2"
              :key="i"
              class="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="flex gap-3">
                <div class="h-14 w-14 rounded-xl bg-gray-100 dark:bg-neutral-800" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 rounded bg-gray-100 dark:bg-neutral-800" />
                  <div class="h-3 w-1/2 rounded bg-gray-100 dark:bg-neutral-800" />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="!items.length">
          <div class="py-16 text-center">
            <Icon name="mdi:cart-outline" size="48" class="mb-3 text-gray-300 dark:text-neutral-600" />
            <p class="font-medium text-gray-600 dark:text-neutral-400">Your cart is empty</p>
            <NuxtLink to="/discover" class="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
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
            <Icon name="mdi:swap-horizontal" size="15" />
            <template v-if="paymentMethod === 'paypal'">
              Prices shown in <strong>{{ activeCurrency }}</strong
              >. Payment is charged in <strong>USD</strong> via PayPal.
            </template>
            <template v-else>
              Prices shown in <strong>{{ activeCurrency }}</strong
              >. Payment is charged in NGN via Paystack.
            </template>
          </div>

          <CheckoutOrderSummary
            :items="items"
            :active-currency="activeCurrency"
          />
        </template>

        <!-- Delivery form: always visible — buyer can fill address while cart loads -->
        <CheckoutDelivery :form="form" @address-changed="onAddressChanged" />

        <CheckoutShipping
          :shipping-calculation="shippingCalculation"
          :live-rates="liveRates"
          :selected-rate="selectedRate"
          :is-loading-rates="isLoadingRates"
          :shipping-loading="shippingLoading"
          :rates-error="ratesError"
          :active-country="activeCountry"
          :active-currency="activeCurrency"
          @update:selected-rate="selectedRate = $event"
        />

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
// Checkout depends on client-only auth state — SSR output would always mismatch
definePageMeta({ ssr: false })

import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { useShipping } from '~~/layers/commerce/app/composables/useShipping'
import { useRuntimeConfig } from '#app'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'
import { useSeo } from '~~/app/composables/useSeo'
import { useCartStore } from '~~/layers/commerce/app/stores/cart.store'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import CheckoutAuthStep from '../components/checkout/CheckoutAuthStep.vue'
import CheckoutOrderSummary from '../components/checkout/CheckoutOrderSummary.vue'
import CheckoutDelivery from '../components/checkout/CheckoutDelivery.vue'
import CheckoutShipping from '../components/checkout/CheckoutShipping.vue'
import CheckoutPaymentMethod from '../components/checkout/CheckoutPaymentMethod.vue'

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
  liveRates,
  selectedRate,
  isLoadingRates,
  ratesError,
  fetchLiveRates,
} = useShipping()

const {
  getCurrencyForCountry,
  formatPrice: formatProduct,
  formatKobo: format,
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

const primarySellerSlug = computed(() => {
  const counts = new Map<string, number>()
  for (const item of items.value) {
    const slug = item.variant?.product?.seller?.store_slug
    if (slug) counts.set(slug, (counts.get(slug) || 0) + (item.quantity || 1))
  }
  let max = 0
  let primary = ''
  for (const [slug, count] of counts) {
    if (count > max) {
      max = count
      primary = slug
    }
  }
  return primary || null
})

const triggerLiveRates = async () => {
  if (!form.address || !form.county || !form.country) return
  await fetchLiveRates({
    storeSlug: primarySellerSlug.value || undefined,
    to: {
      name: form.name || 'Customer',
      street1: form.address,
      city: form.county,
      state: form.state || form.county,
      zip: form.zipcode || '000000',
      country: form.country,
    },
    parcel: DEFAULT_PARCEL,
  })
}

const onAddressChanged = () => {
  calculateShipping(form.country)
  triggerLiveRates()
}

const onAuthenticated = ({ name }: { name: string; isNewUser: boolean }) => {
  if (name && !form.name) form.name = name
  // CheckoutDelivery loads saved addresses in its own onMounted once isLoggedIn is true
}

const shippingCostMajor = computed((): number => {
  if (selectedRate.value) return selectedRate.value.amountNGN
  return (shippingCalculation.value?.cost ?? 0) / 100
})

const grandTotalMajor = computed(
  () => cartTotal.value + shippingCostMajor.value,
)

const grandTotalUSD = computed(
  () => Math.round((grandTotalMajor.value / 1600) * 100) / 100,
)

const shippingDisplay = computed(() => {
  if (selectedRate.value) return fmtP(selectedRate.value.amountNGN)
  if (!shippingCalculation.value) return '—'
  return shippingCalculation.value.cost === 0
    ? 'Free'
    : fmtS(shippingCalculation.value.cost)
})

const fmtP = (majorNGN: number) => formatProduct(majorNGN, activeCurrency.value)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
const fmtS = (kobo: number) => format(kobo, activeCurrency.value)
const fmtNGN = (kobo: number) => formatNGN(kobo)

const isFormValid = computed(
  () =>
    hasFetchedOnce.value &&
    items.value.length > 0 &&
    form.name.trim() &&
    form.address.trim() &&
    form.country &&
    (!!selectedRate.value ||
      !!shippingCalculation.value ||
      isLoadingRates.value),
)

const handleCheckout = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  checkoutError.value = ''
  isSubmitting.value = true

  const shippingCost = selectedRate.value
    ? Math.round(selectedRate.value.amountNGN * 100)
    : shippingCalculation.value?.cost ?? 0
  const shippingZone = selectedRate.value
    ? `${selectedRate.value.carrier} ${selectedRate.value.service}`
    : shippingCalculation.value?.zoneName
  const estimatedDays = selectedRate.value
    ? selectedRate.value.estimatedDays
    : shippingCalculation.value?.estimatedDays
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
    zipcode: form.zipcode,
    country: form.country,
    shippingCost,
    shippingZone,
    estimatedDays,
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
