<template>
  <div
    class="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800"
  >
    <h2 class="font-semibold text-gray-900 dark:text-neutral-100">
      Basic Information
    </h2>

    <div>
      <BaseInput
        v-model="form.title"
        label="Product Title *"
        placeholder="e.g. Vintage Denim Jacket"
        required
      />
    </div>

    <div>
      <label
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
      >
        Description *
      </label>
      <ClientOnly>
        <HtmlDescriptionEditor
          v-model="form.description"
          placeholder="Describe your product…"
        />
        <template #fallback>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </template>
      </ClientOnly>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          Price (₦) *
        </label>
        <input
          v-model.number="form.price"
          type="number"
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div>
        <label
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          Discount (%)
        </label>
        <input
          v-model.number="form.discount"
          type="number"
          min="0"
          max="100"
          placeholder="0"
          class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
    </div>

    <!-- Affiliate Commission -->
    <div
      class="rounded-lg border border-brand/20 bg-brand/5 p-4 dark:border-brand/30 dark:bg-brand/10"
    >
      <label
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
      >
        Affiliate Commission (₦)
        <span
          class="ml-1 text-xs font-normal text-gray-400 dark:text-neutral-500"
        >
          — optional. Set this to let others earn by marketing your product.
        </span>
      </label>
      <input
        v-model.number="form.affiliateCommission"
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g. 500"
        class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand sm:w-1/2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <p
        v-if="form.affiliateCommission && form.affiliateCommission > 0"
        class="mt-1.5 text-xs text-brand dark:text-brand/80"
      >
        Marketers will see: "Earn ₦{{
          Number(form.affiliateCommission).toLocaleString()
        }}
        by selling this product"
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <BaseInput
          v-model="form.SKU"
          label="SKU"
          placeholder="Optional"
        />
      </div>
      <div>
        <label
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
          >Status</label
        >
        <select
          v-model="form.status"
          class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlDescriptionEditor from '~~/layers/seller/app/components/HtmlDescriptionEditor.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

defineProps<{
  form: {
    title: string
    description: string
    price: number | null
    discount: number | null
    affiliateCommission: number | null
    SKU: string
    status: string
  }
}>()
</script>
