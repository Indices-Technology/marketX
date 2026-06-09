<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <NuxtLink
          to="/buyer/orders"
          class="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <Icon name="mdi:arrow-left" size="22" />
        </NuxtLink>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
            Order #{{ orderId }}
          </h1>
          <p
            v-if="order"
            class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500"
          >
            {{ formatDate(order.created_at) }}
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      >
        {{ error }}
      </div>

      <div v-else-if="order" class="space-y-5">
        <!-- Status Card -->
        <BaseCard>
          <div class="mb-4 flex items-center justify-between">
            <p
              class="text-sm font-semibold text-gray-700 dark:text-neutral-300"
            >
              Status
            </p>
            <BaseBadge :status="order.status" :label="order.status" size="sm" />
          </div>

          <!-- Progress bar -->
          <div class="flex items-center gap-0">
            <div
              v-for="(step, i) in ORDER_STEPS"
              :key="step"
              class="flex flex-1 flex-col items-center"
            >
              <div
                class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
                :class="
                  stepIndex >= i
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-400 dark:bg-neutral-800'
                "
              >
                <Icon v-if="stepIndex > i" name="mdi:check" size="14" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <p class="mt-1 text-center text-[9px] text-gray-400">
                {{ step }}
              </p>
              <div v-if="i < ORDER_STEPS.length - 1" class="hidden" />
            </div>
          </div>
        </BaseCard>

        <!-- Items -->
        <BaseCard no-padding :title="`Items (${order.orderItem.length})`">
          <div class="divide-y divide-gray-100 dark:divide-neutral-800">
            <div
              v-for="item in order.orderItem"
              :key="item.id"
              class="flex items-start gap-3 p-4"
            >
              <img
                :src="item.variant?.product?.media?.[0]?.url || ''"
                class="h-16 w-16 shrink-0 rounded-xl bg-gray-100 object-cover dark:bg-neutral-800"
              />
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100"
                >
                  {{ item.variant?.product?.title }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
                  {{ item.variant?.size || item.variant?.label }} · Qty
                  {{ item.quantity }}
                </p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                  Sold by
                  {{
                    item.variant?.product?.seller?.store_name ||
                    item.variant?.product?.seller?.store_slug
                  }}
                </p>
              </div>
              <p
                class="shrink-0 text-sm font-semibold text-gray-900 dark:text-neutral-100"
              >
                {{ formatPrice(item.price) }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Delivery info -->
        <BaseCard title="Delivery">
          <div class="space-y-1.5 text-sm text-gray-600 dark:text-neutral-400">
            <p class="font-medium text-gray-900 dark:text-neutral-100">
              {{ order.name }}
            </p>
            <p>{{ order.address }}, {{ order.county }}</p>
            <p>{{ order.zipcode }}, {{ order.country }}</p>
            <div
              v-if="order.shippingZone"
              class="mt-2 flex items-center gap-1.5 text-xs text-brand"
            >
              <Icon name="mdi:truck-outline" size="14" />
              {{ order.shippingZone }}
              <span
                v-if="order.estimatedDays"
                class="text-gray-400 dark:text-neutral-500"
                >· Est. {{ order.estimatedDays }}</span
              >
            </div>
            <div
              v-if="order.trackingNumber"
              class="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400"
            >
              <Icon name="mdi:barcode" size="14" />
              <span>{{ order.shipper }} · {{ order.trackingNumber }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Price breakdown -->
        <BaseCard>
          <div class="space-y-2">
          <!-- POD split view -->
          <template v-if="order.paymentMethod === 'pay_on_delivery'">
            <div
              v-if="order.shippingCost"
              class="flex justify-between text-sm text-gray-500 dark:text-neutral-400"
            >
              <span>Shipping <span class="text-green-600 dark:text-green-400">(paid)</span></span>
              <span>{{ formatPrice(order.shippingCost) }}</span>
            </div>
            <div
              class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-emerald-700 dark:border-neutral-800 dark:text-emerald-400"
            >
              <span>Due on delivery (cash)</span>
              <span>{{ formatPrice(order.totalAmount) }}</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              Shipping paid via Paystack · Product amount due in cash on delivery
            </p>
          </template>

          <!-- Standard payment -->
          <template v-else>
            <div
              class="flex justify-between text-sm text-gray-500 dark:text-neutral-400"
            >
              <span>Subtotal</span>
              <span>{{ formatPrice(order.totalAmount) }}</span>
            </div>
            <div
              v-if="order.shippingCost"
              class="flex justify-between text-sm text-gray-500 dark:text-neutral-400"
            >
              <span>Shipping</span>
              <span>{{ formatPrice(order.shippingCost) }}</span>
            </div>
            <div
              class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-neutral-800 dark:text-neutral-100"
            >
              <span>Total</span>
              <span>{{ formatPrice(order.totalAmount + (order.shippingCost || 0)) }}</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              Paid via {{ order.paymentMethod }}
            </p>
          </template>
          </div>
        </BaseCard>

        <!-- Cancel button (only if PENDING) -->
        <BaseButton
          v-if="order.status === 'PENDING'"
          variant="danger"
          size="lg"
          class="w-full"
          :loading="cancelling"
          :disabled="cancelling"
          @click="handleCancel"
        >
          Cancel Order
        </BaseButton>
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orderApi = useOrderApi()

const orderId = computed(() => Number(route.params.id))
const order = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const cancelling = ref(false)

const ORDER_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
const STEP_MAP: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
}
const stepIndex = computed(() => STEP_MAP[order.value?.status] ?? 0)

onMounted(async () => {
  try {
    const res: any = await orderApi.getOrderById(orderId.value)
    order.value = res?.data
  } catch (e: any) {
    error.value = extractErrorMessage(e, 'Order not found')
  } finally {
    isLoading.value = false
  }
})

const handleCancel = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  cancelling.value = true
  try {
    const res: any = await orderApi.cancelOrder(orderId.value)
    order.value = res?.data
    notify({ type: 'success', text: 'Order cancelled' })
  } catch (e: any) {
    notify({ type: 'error', text: extractErrorMessage(e, 'Could not cancel order') })
  } finally {
    cancelling.value = false
  }
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
    cents / 100,
  )

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
</script>
