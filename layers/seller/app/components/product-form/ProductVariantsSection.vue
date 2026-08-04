<template>
  <div
    class="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="font-semibold text-gray-900 dark:text-neutral-100">
          Stock &amp; Options
        </h2>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
          <template v-if="variants.length">
            Stock is tracked per option below.
          </template>
          <template v-else>
            How many do you have? Add options only if price or stock changes by
            size, colour, etc.
          </template>
        </p>
        <div v-if="!variants.length" class="mt-1.5 flex flex-wrap gap-1.5">
          <span
            v-for="ex in VARIANT_EXAMPLES"
            :key="ex"
            class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-neutral-700 dark:text-neutral-400"
          >
            {{ ex }}
          </span>
        </div>
      </div>
      <button
        v-if="variants.length"
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
        @click="addVariant"
      >
        <Icon name="solar:add-circle-linear" size="15" /> Add Variant
      </button>
    </div>

    <!-- Simple product: a single base stock, no options -->
    <div v-if="!variants.length" class="space-y-3">
      <div data-field="stock" class="max-w-[12rem]">
        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">
          Quantity in stock *
        </label>
        <input
          v-model.number="form.stock"
          type="number"
          min="0"
          placeholder="e.g. 10"
          class="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100"
          :class="
            error
              ? 'border-red-400 focus:border-red-400 dark:border-red-600'
              : 'border-gray-200 focus:border-brand dark:border-neutral-700'
          "
          @input="$emit('clear-error')"
        />
        <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
      </div>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-brand hover:text-brand dark:border-neutral-600 dark:text-neutral-400"
        @click="addVariant"
      >
        <Icon name="solar:add-circle-linear" size="15" />
        Add sizes / colours
      </button>
    </div>

    <!-- Options: per-variant stock & price -->
    <div v-else data-field="variants" class="space-y-2">
      <div
        v-for="(variant, i) in variants"
        :key="i"
        class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">
              Size / Name *
            </label>
            <input
              v-model="variant.size"
              placeholder="e.g. M, Red, 42"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              @input="$emit('clear-error')"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">
              Price (₦)
              <span class="font-normal opacity-60">— blank = base price</span>
            </label>
            <input
              v-model.number="variant.price"
              type="number"
              min="0"
              placeholder="Same as base"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">
              Stock
            </label>
            <input
              v-model.number="variant.stock"
              type="number"
              min="0"
              placeholder="0"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>
        <button
          type="button"
          class="mt-6 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          @click="removeVariant(i)"
        >
          <Icon name="solar:trash-bin-trash-linear" size="16" />
        </button>
      </div>
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  variants: Array<{ size: string; price: number | null; stock: number }>
  // Base stock for the simple-product case (no options). Bound in place, so the
  // parent form's `stock` updates directly.
  form: { stock: number }
  // Validation message for the stock / variants field (from the parent form).
  error?: string
}>()

defineEmits<{ 'clear-error': [] }>()

// Illustrative option types — helps sellers understand what a "variant" is.
const VARIANT_EXAMPLES = [
  'Size',
  'Colour',
  'Storage',
  'RAM',
  'Length',
  'Pack size',
]

const addVariant = () => {
  props.variants.push({ size: '', price: null, stock: 0 })
}

const removeVariant = (i: number) => {
  props.variants.splice(i, 1)
}
</script>
