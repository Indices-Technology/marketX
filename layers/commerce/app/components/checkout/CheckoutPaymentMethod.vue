<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <p
      class="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
    >
      Payment Method
    </p>
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        :class="
          modelValue === 'paystack'
            ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400'
        "
        class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all"
        @click="emit('update:modelValue', 'paystack')"
      >
        <Icon name="mdi:credit-card-outline" size="18" />
        Card
      </button>
      <button
        type="button"
        :class="
          modelValue === 'paypal'
            ? 'border-[#003087] bg-[#003087]/5 text-[#003087] dark:bg-[#003087]/10'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400'
        "
        class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all"
        @click="emit('update:modelValue', 'paypal')"
      >
        <Icon name="logos:paypal" size="18" />
        PayPal
      </button>
      <!-- POD — Nigerian address + non-zero shipping fee + every seller has opted in -->
      <button
        v-if="country === 'NG' && shippingCostMajor > 0 && podAvailable"
        type="button"
        :class="
          modelValue === 'pod'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400'
        "
        class="col-span-2 flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all"
        @click="emit('update:modelValue', 'pod')"
      >
        <div class="flex items-center gap-2">
          <Icon name="mdi:cash-multiple" size="18" />
          Pay on Delivery
        </div>
        <span class="text-[11px] font-normal opacity-70"
          >Pay shipping now · product on delivery</span
        >
      </button>
    </div>

    <!-- POD info banner -->
    <div
      v-if="modelValue === 'pod'"
      class="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-[12px] text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400"
    >
      <Icon name="mdi:information-outline" size="14" class="mt-0.5 shrink-0" />
      <span
        >Pay <strong>{{ fmtPNGN(shippingCostMajor) }}</strong> shipping now to
        confirm your order. Pay the product amount (<strong>{{
          fmtPNGN(cartTotal)
        }}</strong>) in cash when your delivery arrives. Shipping fee is
        non-refundable if you refuse delivery.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
const props = defineProps<{
  modelValue: 'paystack' | 'paypal' | 'pod'
  country: string
  shippingCostMajor: number
  podAvailable: boolean
  cartTotal: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'paystack' | 'paypal' | 'pod']
}>()

const { formatProductNGN } = useCurrency()
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
</script>
