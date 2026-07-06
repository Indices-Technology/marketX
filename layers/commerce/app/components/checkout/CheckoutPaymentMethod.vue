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
      <!-- POD — disabled until GIG exposes a COD endpoint (POD_ENABLED flag) -->
      <button
        v-if="POD_ENABLED && country === 'NG' && shippingCostMajor > 0 && podAvailable"
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

    <!-- POD "how it works" — numbered steps so simple users grasp it at a glance -->
    <div
      v-if="modelValue === 'pod'"
      class="mt-2 space-y-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-900/10"
    >
      <p
        class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
      >
        How Pay on Delivery works
      </p>

      <!-- Step 1: pay shipping now -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white"
        >
          1
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[12.5px] font-semibold text-gray-800 dark:text-neutral-200"
          >
            Pay shipping now
          </p>
          <p class="text-[11px] text-gray-500 dark:text-neutral-400">
            Locks your order &amp; the courier
          </p>
        </div>
        <span
          class="shrink-0 font-display text-[14px] font-bold text-gray-900 dark:text-neutral-100"
        >
          {{ fmtPNGN(shippingCostMajor) }}
        </span>
      </div>

      <!-- Step 2: pay product on delivery -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 text-[12px] font-bold text-emerald-600 dark:text-emerald-400"
        >
          2
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[12.5px] font-semibold text-gray-800 dark:text-neutral-200"
          >
            Pay for the product on delivery
          </p>
          <p class="text-[11px] text-gray-500 dark:text-neutral-400">
            Cash to the courier when it arrives
          </p>
        </div>
        <span
          class="shrink-0 font-display text-[14px] font-bold text-gray-900 dark:text-neutral-100"
        >
          {{ fmtPNGN(cartTotal) }}
        </span>
      </div>

      <p
        class="flex items-start gap-1.5 border-t border-emerald-100 pt-2 text-[11px] text-emerald-700/80 dark:border-emerald-900/30 dark:text-emerald-400/80"
      >
        <Icon name="mdi:information-outline" size="13" class="mt-0.5 shrink-0" />
        The shipping fee isn't refunded if you refuse the delivery.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
defineProps<{
  modelValue: 'paystack' | 'paypal' | 'pod'
  country: string
  shippingCostMajor: number
  podAvailable: boolean
  cartTotal: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'paystack' | 'paypal' | 'pod']
}>()

// Pay-on-Delivery is gated by a runtime flag (paused). Set
// NUXT_PUBLIC_POD_ENABLED=true to re-enable across the app.
const POD_ENABLED = useRuntimeConfig().public.podEnabled === true

const { formatProductNGN } = useCurrency()
const fmtPNGN = (majorNGN: number) => formatProductNGN(majorNGN)
</script>
