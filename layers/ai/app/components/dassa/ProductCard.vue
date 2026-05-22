<template>
  <div
    class="w-40 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="h-28 w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-2xl text-gray-300 dark:text-neutral-600"
      >
        🛍️
      </div>
    </div>

    <div class="space-y-1 p-2">
      <p
        class="line-clamp-2 text-[12px] font-semibold leading-tight text-gray-800 dark:text-neutral-100"
      >
        {{ product.name }}
      </p>
      <p class="truncate text-[10px] text-gray-400 dark:text-neutral-500">
        {{ product.seller }}
      </p>
      <p class="text-[13px] font-bold text-brand">
        ₦{{ formatPrice(product.price) }}
      </p>

      <button
        :disabled="!product.inStock"
        class="w-full rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
        :class="
          product.inStock
            ? 'bg-brand text-white hover:bg-[#d81b36] active:bg-[#c01020]'
            : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-neutral-800'
        "
        @click.stop="$emit('addToCart', product)"
      >
        {{ product.inStock ? 'Add to Cart' : 'Out of Stock' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DassaProductItem } from '../../composables/useDassaChat'

defineProps<{ product: DassaProductItem }>()
defineEmits<{ addToCart: [product: DassaProductItem] }>()

function formatPrice(price: number): string {
  return price.toLocaleString('en-NG')
}
</script>
