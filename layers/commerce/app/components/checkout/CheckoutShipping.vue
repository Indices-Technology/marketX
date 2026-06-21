<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h2
      class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
    >
      {{ storeName ? `Ships from ${storeName}` : 'Shipping' }}
    </h2>

    <!-- Loading -->
    <div
      v-if="shippingLoading || isLoadingRates"
      class="flex items-center gap-2 text-sm text-gray-400"
    >
      <Icon name="eos-icons:loading" size="16" class="animate-spin" />
      Fetching rates…
    </div>

    <template v-if="activeCountry">
      <!-- API error + flat-rate fallback -->
      <div v-if="ratesError" class="space-y-2">
        <div
          class="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
        >
          {{ ratesError }}
        </div>
        <div
          v-if="shippingCalculation"
          class="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-neutral-800"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
              {{ shippingCalculation.zoneName }}
              <span class="text-xs font-normal text-gray-400">(estimated)</span>
            </p>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              Est. {{ shippingCalculation.estimatedDays }}
            </p>
          </div>
          <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
            {{
              shippingCalculation.cost === 0
                ? 'Free'
                : fmtS(shippingCalculation.cost)
            }}
          </p>
        </div>
      </div>

      <!-- Live carrier rates -->
      <div v-else-if="liveRates.length" class="space-y-2">
        <button
          v-for="rate in liveRates"
          :key="rate.rateId"
          type="button"
          :class="
            selectedRate?.rateId === rate.rateId
              ? 'border-brand bg-brand/5 dark:bg-brand/10'
              : 'border-gray-200 hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700'
          "
          class="flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all"
          @click="emit('update:selectedRate', rate)"
        >
          <div
            class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
            :class="
              selectedRate?.rateId === rate.rateId
                ? 'border-brand'
                : 'border-gray-300 dark:border-neutral-600'
            "
          >
            <div
              v-if="selectedRate?.rateId === rate.rateId"
              class="h-2 w-2 rounded-full bg-brand"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-semibold text-gray-900 dark:text-neutral-100"
            >
              {{ rate.carrier }} — {{ rate.service }}
            </p>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              {{ rate.estimatedDays }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p
              class="text-sm font-semibold text-gray-900 dark:text-neutral-100"
            >
              {{ fmtP(rate.amountNGN) }}
            </p>
            <p
              v-if="activeCurrency !== 'NGN'"
              class="text-[11px] text-gray-400"
            >
              {{ fmtPNGN(rate.amountNGN) }}
            </p>
          </div>
        </button>
      </div>

      <!-- Flat-rate fallback (seller has no ship-from address set) -->
      <div
        v-else-if="shippingCalculation"
        class="flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
            {{ shippingCalculation.zoneName }}
          </p>
          <p class="text-xs text-gray-400 dark:text-neutral-500">
            Est. {{ shippingCalculation.estimatedDays }}
          </p>
        </div>
        <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
          {{
            shippingCalculation.cost === 0
              ? 'Free'
              : fmtS(shippingCalculation.cost)
          }}
        </p>
      </div>

      <div v-else class="text-sm text-gray-400 dark:text-neutral-500">
        Enter your delivery address to see shipping rates.
      </div>
    </template>

    <p v-else class="text-sm text-gray-400 dark:text-neutral-500">
      Select a country to see shipping rates.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import type { SupportedCurrency } from '~~/shared/utils/currency'
import type { ShippingCalculation } from '~~/layers/commerce/app/composables/useShipping'
import type { IShipmentRate } from '~~/layers/shipping/server/legacy/types'

const props = defineProps<{
  shippingCalculation: ShippingCalculation | null
  liveRates: IShipmentRate[]
  selectedRate: IShipmentRate | null
  isLoadingRates: boolean
  shippingLoading: boolean
  ratesError: string | null
  activeCountry: string
  activeCurrency: SupportedCurrency
  /** When set (multi-seller cart), shown as the card header "Ships from {storeName}". */
  storeName?: string
}>()

const emit = defineEmits<{
  'update:selectedRate': [rate: IShipmentRate]
}>()

const {
  formatPrice: formatProduct,
  formatKobo: format,
  formatProductNGN,
} = useCurrency()
const fmtP = (majorNGN: number) => formatProduct(majorNGN, props.activeCurrency)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
const fmtS = (kobo: number) => format(kobo, props.activeCurrency)
</script>
