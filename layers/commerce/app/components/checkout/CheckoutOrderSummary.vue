<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h2
      class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
    >
      Order Summary
    </h2>
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.variantId"
        class="flex items-start gap-3"
      >
        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
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
  </div>
</template>

<script setup lang="ts">
import BaseImage from '~~/layers/ui/app/components/BaseImage.vue'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import type { ICartItem } from '~~/layers/commerce/app/types/commerce.types'
import type { SupportedCurrency } from '~~/shared/utils/currency'
import { effectiveUnitPrice } from '~~/layers/commerce/app/stores/cart.store'

const props = defineProps<{
  items: ICartItem[]
  activeCurrency: SupportedCurrency
}>()

const { formatPrice: formatProduct, formatProductNGN } = useCurrency()
const fmtP = (majorNGN: number) => formatProduct(majorNGN, props.activeCurrency)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
</script>
