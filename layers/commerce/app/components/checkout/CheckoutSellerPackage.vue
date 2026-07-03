<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Seller header — only when the cart spans multiple sellers -->
    <NuxtLink
      v-if="displayStoreName"
      :to="`/sellers/profile/${displayStoreSlug}`"
      class="mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-3 dark:border-neutral-800"
    >
      <Icon
        name="mdi:storefront-outline"
        size="15"
        class="shrink-0 text-gray-400 dark:text-neutral-500"
      />
      <span
        class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100"
      >
        {{ displayStoreName }}
      </span>
      <span
        class="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-neutral-500"
      >
        {{ items.length }} item{{ items.length === 1 ? '' : 's' }}
      </span>
    </NuxtLink>

    <!-- This seller's products -->
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.variantId"
        class="flex items-start gap-3"
      >
        <div
          class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800"
        >
          <BaseImage
            v-if="item.variant?.product?.media?.[0]?.url"
            :src="item.variant.product.media[0].url"
            alt=""
            :width="56"
            :height="56"
            class="h-full w-full"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100"
          >
            {{ item.variant?.product?.title }}
          </p>
          <p class="text-xs text-gray-400 dark:text-neutral-500">
            {{ item.variant?.size }} × {{ item.quantity }}
          </p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
            {{ fmtP(effectiveUnitPrice(item) * item.quantity) }}
          </p>
          <p
            v-if="activeCurrency !== 'NGN'"
            class="text-[11px] text-gray-400 dark:text-neutral-500"
          >
            {{ fmtPNGN(effectiveUnitPrice(item) * item.quantity) }}
          </p>
          <p
            v-if="
              (item.variant?.price ?? item.variant?.product?.price ?? 0) >
              effectiveUnitPrice(item)
            "
            class="text-[10px] text-gray-400 line-through dark:text-neutral-500"
          >
            {{
              fmtP(
                (item.variant?.price ?? item.variant?.product?.price ?? 0) *
                  item.quantity,
              )
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- This seller's delivery options (rates depend on the address above) -->
    <div class="mt-4 border-t border-gray-100 pt-4 dark:border-neutral-800">
      <p
        class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
      >
        Delivery
      </p>
      <CheckoutShipping
        embedded
        :shipping-calculation="shippingCalculation"
        :live-rates="liveRates"
        :selected-rate="selectedRate"
        :is-loading-rates="isLoadingRates"
        :shipping-loading="shippingLoading"
        :rates-error="ratesError"
        :active-country="activeCountry"
        :active-currency="activeCurrency"
        @update:selected-rate="emit('update:selectedRate', $event)"
      />
    </div>

    <!-- Cost for this seller, in one place -->
    <div
      class="mt-4 space-y-1 border-t border-gray-100 pt-3 text-[13px] dark:border-neutral-800"
    >
      <div class="flex justify-between text-gray-500 dark:text-neutral-400">
        <span>Items</span>
        <span>{{ fmtP(subtotalMajor) }}</span>
      </div>
      <div class="flex justify-between text-gray-500 dark:text-neutral-400">
        <span>Shipping</span>
        <span>{{ shippingMajor === 0 ? 'Free' : fmtP(shippingMajor) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseImage from '~~/layers/ui/app/components/BaseImage.vue'
import CheckoutShipping from './CheckoutShipping.vue'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { effectiveUnitPrice } from '~~/layers/commerce/app/stores/cart.store'
import type { ICartItem } from '~~/layers/commerce/app/types/commerce.types'
import type { SupportedCurrency } from '~~/shared/utils/currency'
import type { ShippingCalculation } from '~~/layers/commerce/app/composables/useShipping'
import type { IShipmentRate } from '~~/layers/shipping/server/legacy/types'

const props = defineProps<{
  /** Empty when the cart has a single seller — hides the seller header. */
  storeName: string
  storeSlug: string
  store?: {
    name: string
    slug: string
  }
  items: ICartItem[]
  /** This seller's product subtotal (major NGN). */
  subtotalMajor: number
  /** This seller's chosen shipping (major NGN): selected rate, else flat fallback. */
  shippingMajor: number
  activeCurrency: SupportedCurrency
  // Shipping state — passed straight through to the embedded CheckoutShipping.
  shippingCalculation: ShippingCalculation | null
  liveRates: IShipmentRate[]
  selectedRate: IShipmentRate | null
  isLoadingRates: boolean
  shippingLoading: boolean
  ratesError: string | null
  activeCountry: string
}>()

const emit = defineEmits<{
  'update:selectedRate': [rate: IShipmentRate]
}>()

const displayStoreName = computed(() => props.store?.name ?? props.storeName)
const displayStoreSlug = computed(() => props.store?.slug ?? props.storeSlug)

const { formatPrice: formatProduct, formatProductNGN } = useCurrency()
const fmtP = (majorNGN: number) => formatProduct(majorNGN, props.activeCurrency)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
</script>
