<template>
  <BaseCard variant="elevated" no-padding>
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800"
    >
      <div>
        <p class="text-sm text-gray-500 dark:text-neutral-400">
          Order #{{ order.id }}
        </p>
        <p class="text-xs text-gray-400 dark:text-neutral-500">
          {{ formatDate(order.created_at) }}
        </p>
      </div>
      <BaseBadge :status="order.status" size="sm" dot>
        {{ order.status }}
      </BaseBadge>
    </div>

    <!-- Items -->
    <div class="space-y-3 p-4">
      <div v-for="item in order.orderItem" :key="item.id" class="flex gap-3">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
          <BaseImage
            v-if="item.variant?.product?.media?.[0]?.url"
            :src="item.variant.product.media[0].url"
            :alt="item.variant?.product?.title || 'Product'"
            :width="64"
            :height="64"
            class="h-full w-full"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100"
          >
            {{ item.variant?.product?.title || 'Product' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-neutral-400">
            <span v-if="item.variant?.size || item.variant?.label">
              {{ item.variant?.size || item.variant?.label }} ·
            </span>
            Qty: {{ item.quantity }}
            <span v-if="item.price"> × {{ formatPrice(item.price) }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Tracking -->
    <div
      v-if="order.trackingNumber"
      class="flex items-center gap-1.5 border-t border-gray-200 px-4 py-2 text-xs text-brand dark:border-neutral-800"
    >
      <Icon name="mdi:truck-outline" size="14" />
      {{ order.shipper || 'Courier' }} · {{ order.trackingNumber }}
    </div>

    <!-- Auto-release notice -->
    <div
      v-if="order.status === 'SHIPPED' && !confirmed"
      class="flex items-start gap-1.5 border-t border-gray-200 px-4 py-2 text-xs text-amber-600 dark:border-neutral-800 dark:text-amber-400"
    >
      <Icon name="mdi:clock-alert-outline" size="14" class="mt-0.5 shrink-0" />
      Payment will be automatically released to the seller in 7 days. Confirm
      receipt above to release it now.
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between bg-gray-50 p-4 dark:bg-neutral-800"
    >
      <div class="text-sm">
        <span class="text-gray-500 dark:text-neutral-400">Total:</span>
        <span class="ml-2 font-bold text-gray-900 dark:text-neutral-100">
          {{
            formatPrice((order.totalAmount || 0) + (order.shippingCost || 0))
          }}
        </span>
      </div>

      <div class="flex gap-2">
        <!-- Track Button (if shipped) -->
        <BaseButton
          v-if="order.status === 'SHIPPED'"
          @click="emit('track', order.id)"
          variant="secondary"
          size="sm"
        >
          Track
        </BaseButton>

        <!-- Confirm Receipt (if shipped, buyer action) -->
        <BaseButton
          v-if="order.status === 'SHIPPED' && !confirmed"
          @click="confirmReceipt"
          size="sm"
          :loading="confirming"
          :disabled="confirming"
        >
          {{ confirming ? 'Confirming…' : 'Confirm Receipt' }}
        </BaseButton>
        <span
          v-if="confirmed"
          class="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
        >
          Received ✓
        </span>

        <!-- Cancel Button (if pending) -->
        <BaseButton
          v-if="order.status === 'PENDING'"
          @click="emit('cancel', order.id)"
          variant="danger"
          size="sm"
        >
          Cancel
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'

const props = defineProps<{
  order: any
}>()

const emit = defineEmits(['track', 'cancel'])

const orderApi = useOrderApi()
const confirming = ref(false)
const confirmed = ref(false)

const confirmReceipt = async () => {
  if (
    !confirm(
      'Confirm you have received this order? This will release payment to the seller.',
    )
  )
    return
  confirming.value = true
  try {
    await orderApi.confirmReceipt(props.order.id)
    confirmed.value = true
  } catch (e: any) {
    alert(e?.data?.statusMessage || e?.message || 'Failed to confirm receipt')
  } finally {
    confirming.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatPrice = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
    kobo / 100,
  )
</script>
