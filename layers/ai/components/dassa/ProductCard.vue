<template>
  <div class="flex-shrink-0 w-40 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div class="w-full h-28 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300 dark:text-neutral-600 text-2xl">
        🛍️
      </div>
    </div>

    <div class="p-2 space-y-1">
      <p class="text-[12px] font-semibold text-gray-800 dark:text-neutral-100 line-clamp-2 leading-tight">{{ product.name }}</p>
      <p class="text-[10px] text-gray-400 dark:text-neutral-500 truncate">{{ product.seller }}</p>
      <p class="text-[13px] font-bold text-brand">₦{{ formatPrice(product.price) }}</p>

      <button
        :disabled="!product.inStock"
        @click.stop="$emit('addToCart', product)"
        class="w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
        :class="product.inStock
          ? 'bg-brand text-white hover:bg-[#d81b36] active:bg-[#c01020]'
          : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 cursor-not-allowed'"
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
