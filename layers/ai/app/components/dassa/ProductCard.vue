<template>
  <div
    class="w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Image -->
    <div class="relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <img
        v-if="product.imageUrl && !imgError"
        :src="product.imageUrl"
        :alt="product.name"
        class="h-full w-full object-cover"
        @error="imgError = true"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700"
      >
        <Icon name="mdi:shopping-outline" size="32" class="text-gray-300 dark:text-neutral-600" />
      </div>

      <!-- Discount badge -->
      <span
        v-if="product.discount"
        class="absolute left-2 top-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
      >
        -{{ product.discount }}%
      </span>

      <!-- Out of stock overlay -->
      <div
        v-if="!product.inStock"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
      >
        <span class="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700">
          Out of Stock
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="space-y-1 p-2.5">
      <p class="line-clamp-2 text-[12px] font-semibold leading-tight text-gray-900 dark:text-neutral-100">
        {{ product.name }}
      </p>
      <p v-if="product.seller" class="truncate text-[10.5px] text-gray-400 dark:text-neutral-500">
        {{ product.seller }}
      </p>

      <div class="flex items-baseline gap-1.5">
        <p class="text-[13px] font-bold text-brand">₦{{ formatPrice(discountedPrice) }}</p>
        <p v-if="product.discount" class="text-[10px] text-gray-400 line-through">
          ₦{{ formatPrice(product.price) }}
        </p>
      </div>

      <button
        :disabled="!product.inStock"
        class="mt-0.5 w-full rounded-xl py-1.5 text-[11px] font-bold transition-all active:scale-95"
        :class="
          product.inStock
            ? 'bg-brand text-white hover:bg-[#d81b36] shadow-sm shadow-brand/30'
            : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-neutral-800'
        "
        @click.stop="$emit('addToCart', product)"
      >
        {{ product.inStock ? 'Add to Cart' : 'Unavailable' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DassaProductItem } from '../../composables/useDassaChat'

const props = defineProps<{ product: DassaProductItem }>()
defineEmits<{ addToCart: [product: DassaProductItem] }>()

const imgError = ref(false)

const discountedPrice = computed(() => {
  if (!props.product.discount) return props.product.price
  return Math.round(props.product.price * (1 - props.product.discount / 100))
})

function formatPrice(price: number): string {
  return price.toLocaleString('en-NG')
}
</script>
