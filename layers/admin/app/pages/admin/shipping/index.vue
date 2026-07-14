<template>
  <div class="mx-auto max-w-2xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Carrier Simulation
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Test tool — inject a GIG scan to walk a booked order through its carrier
        states without a real parcel.
      </p>
    </div>

    <!-- How it works -->
    <div
      class="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-800/60 dark:bg-amber-950/10"
    >
      <p
        class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400"
      >
        <Icon name="solar:test-tube-linear" size="14" /> Admin test tool
      </p>
      <p class="text-xs text-gray-600 dark:text-neutral-400">
        Each button injects a status through the <strong>real</strong> transition
        path a live GIG scan takes (booking must already have a waybill).
        <strong>“Delivered” releases escrow to the seller</strong> — use on test
        orders only. Every call is logged server-side.
      </p>
    </div>

    <!-- Order picker -->
    <div
      class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label
        class="block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
      >
        Order ID
      </label>
      <input
        v-model.number="orderId"
        type="number"
        min="1"
        inputmode="numeric"
        placeholder="e.g. 1042"
        class="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />

      <p class="pt-1 text-[12px] font-semibold text-gray-600 dark:text-neutral-400">
        Inject scan
      </p>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="s in SIM_STEPS"
          :key="s.status"
          size="sm"
          :variant="s.status === 'DELIVERED' ? 'primary' : 'secondary'"
          :disabled="!validOrderId || !!simulating"
          :loading="simulating === s.status"
          @click="simulate(s.status)"
        >
          {{ s.label }}
        </BaseButton>
      </div>
      <p
        v-if="!validOrderId"
        class="text-[11px] text-gray-400 dark:text-neutral-500"
      >
        Enter an order ID to enable the controls.
      </p>
    </div>

    <!-- Result of the last injection -->
    <div
      v-if="lastResult"
      class="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p class="text-[12px] font-semibold text-gray-600 dark:text-neutral-400">
        Result · order #{{ lastResult.orderId }}
      </p>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <BaseBadge size="sm">{{ lastResult.from }}</BaseBadge>
        <Icon name="solar:arrow-right-linear" size="14" class="text-gray-400" />
        <BaseBadge :status="lastResult.changed ? 'success' : undefined" size="sm">
          {{ lastResult.to }}
        </BaseBadge>
        <span
          v-if="!lastResult.changed"
          class="text-[12px] text-gray-400 dark:text-neutral-500"
        >
          no change (out-of-order or duplicate scan)
        </span>
      </div>
      <ul class="space-y-1 pt-1 text-[12px] text-gray-600 dark:text-neutral-400">
        <li v-if="lastResult.toShipped" class="flex items-center gap-1.5">
          <Icon name="solar:box-linear" size="14" class="text-blue-500" />
          Order marked <strong>SHIPPED</strong> · buyer notified.
        </li>
        <li v-if="lastResult.toDelivered" class="flex items-center gap-1.5">
          <Icon name="solar:check-circle-linear" size="14" class="text-green-500" />
          Order marked <strong>DELIVERED</strong>.
        </li>
        <li v-if="lastResult.fundsReleased" class="flex items-center gap-1.5">
          <Icon name="solar:money-bag-linear" size="14" class="text-green-500" />
          Escrow <strong>released</strong> to the seller.
        </li>
        <li
          v-if="lastResult.toDelivered && !lastResult.fundsReleased"
          class="flex items-center gap-1.5"
        >
          <Icon name="solar:danger-triangle-linear" size="14" class="text-amber-500" />
          Delivered but funds <strong>held</strong> (open dispute or not paid).
        </li>
        <li v-if="lastResult.failed" class="flex items-center gap-1.5">
          <Icon name="solar:close-circle-linear" size="14" class="text-rose-500" />
          Returned/failed · funds held · seller alerted.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import type { ApplyResult } from '~~/server/services/carrierProgress'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const orderApi = useOrderApi()

// Walk an order through the carrier states without a real scan. Mirrors the
// statuses the real poller observes; the server runs the identical transition.
const SIM_STEPS = [
  { status: 'IN_TRANSIT', label: 'Picked up → Shipped' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered → release funds' },
  { status: 'RETURNED', label: 'Returned' },
] as const

const orderId = ref<number | null>(null)
const validOrderId = computed(() => !!orderId.value && orderId.value > 0)
const simulating = ref('')
const lastResult = ref<ApplyResult | null>(null)

async function simulate(status: string) {
  if (!validOrderId.value) return
  simulating.value = status
  try {
    const res: any = await orderApi.simulateScan(orderId.value!, status)
    lastResult.value = res?.data ?? null
    const to = lastResult.value?.to ?? status
    notify({
      type: 'success',
      text: lastResult.value?.changed
        ? `Order #${orderId.value} → ${to}`
        : `No change · order already past ${to}`,
    })
  } catch (e: any) {
    notify({ type: 'error', text: extractErrorMessage(e, 'Simulation failed') })
  } finally {
    simulating.value = ''
  }
}
</script>
