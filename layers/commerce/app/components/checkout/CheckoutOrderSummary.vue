<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h2
      class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
    >
      Order Summary
    </h2>
    <div class="space-y-5">
      <div v-for="group in groups" :key="group.slug" class="space-y-3">
        <!-- Seller header — only when the cart spans multiple sellers, so each
             product maps to its "Ships from {store}" package below. -->
        <div
          v-if="isMultiSeller"
          class="flex items-center gap-1.5 border-b border-gray-100 pb-2 dark:border-neutral-800"
        >
          <Icon
            name="mdi:storefront-outline"
            size="14"
            class="shrink-0 text-gray-400 dark:text-neutral-500"
          />
          <span
            class="truncate text-xs font-semibold text-gray-700 dark:text-neutral-300"
          >
            {{ group.storeName }}
          </span>
          <span class="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-neutral-500">
            {{ group.items.length }} item{{ group.items.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div
          v-for="item in group.items"
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

// Group the cart by seller so each line maps to its "Ships from {store}" package.
interface SummaryGroup {
  slug: string
  storeName: string
  items: ICartItem[]
}
const groups = computed<SummaryGroup[]>(() => {
  const map = new Map<string, SummaryGroup>()
  for (const it of props.items) {
    const seller = it.variant?.product?.seller
    const slug = seller?.store_slug || '_'
    const g =
      map.get(slug) ??
      { slug, storeName: seller?.store_name || 'Seller', items: [] }
    g.items.push(it)
    map.set(slug, g)
  }
  return [...map.values()]
})
const isMultiSeller = computed(() => groups.value.length > 1)

const { formatPrice: formatProduct, formatProductNGN } = useCurrency()
const fmtP = (majorNGN: number) => formatProduct(majorNGN, props.activeCurrency)
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
</script>
