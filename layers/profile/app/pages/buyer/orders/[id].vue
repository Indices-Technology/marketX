<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <NuxtLink
          to="/buyer/orders"
          class="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <Icon name="solar:arrow-left-linear" size="22" />
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
                <Icon v-if="stepIndex > i" name="solar:check-circle-linear" size="14" />
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
              <div
                class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800"
              >
                <BaseImage
                  v-if="item.variant?.product?.media?.[0]?.url"
                  :src="item.variant.product.media[0].url"
                  alt=""
                  :width="64"
                  :height="64"
                  class="h-full w-full"
                />
              </div>
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
              <Icon name="solar:delivery-linear" size="14" />
              {{ order.shippingZone }}
              <span
                v-if="order.estimatedDays"
                class="text-gray-400 dark:text-neutral-500"
                >· Est. {{ order.estimatedDays }}</span
              >
            </div>
            <div
              v-if="order.waybill || order.trackingNumber"
              class="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400"
            >
              <Icon name="solar:sale-linear" size="14" />
              <span>{{ order.shipper }} · {{ order.waybill || order.trackingNumber }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Live tracking timeline (carrier scans) -->
        <BaseCard v-if="order.waybill || order.trackingNumber" title="Tracking">
          <div v-if="loadingTracking" class="space-y-3">
            <BaseSkeleton v-for="i in 3" :key="i" shape="line" width="80%" />
          </div>

          <div
            v-else-if="!trackingEvents.length"
            class="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400"
          >
            <Icon name="solar:clock-circle-linear" size="16" class="text-amber-500" />
            Booked with {{ order.shipper || 'the carrier' }} — waiting for the first scan.
          </div>

          <ol v-else class="relative space-y-4">
            <li
              v-for="(ev, i) in trackingEvents"
              :key="i"
              class="flex gap-3"
            >
              <div class="flex flex-col items-center">
                <span
                  class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  :class="i === 0 ? 'bg-brand' : 'bg-gray-300 dark:bg-neutral-600'"
                />
                <span
                  v-if="i < trackingEvents.length - 1"
                  class="mt-1 w-px flex-1 bg-gray-200 dark:bg-neutral-700"
                />
              </div>
              <div class="min-w-0 flex-1 pb-1">
                <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {{ prettyStatus(ev.status) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-neutral-400">
                  {{ ev.description }}
                </p>
                <p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
                  {{ formatDateTime(ev.timestamp) }}
                  <span v-if="ev.location"> · {{ ev.location }}</span>
                </p>
              </div>
            </li>
          </ol>
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
                <span
                  >Shipping
                  <span class="text-green-600 dark:text-green-400"
                    >(paid)</span
                  ></span
                >
                <span>{{ formatPrice(order.shippingCost) }}</span>
              </div>
              <div
                class="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-emerald-700 dark:border-neutral-800 dark:text-emerald-400"
              >
                <span>Due on delivery (cash)</span>
                <span>{{ formatPrice(order.totalAmount) }}</span>
              </div>
              <p class="text-xs text-gray-400 dark:text-neutral-500">
                Shipping paid via Paystack · Product amount due in cash on
                delivery
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
                <span>{{
                  formatPrice(order.totalAmount + (order.shippingCost || 0))
                }}</span>
              </div>
              <!-- Pay-on-delivery self-shipping: cash owed to the rider on
                   arrival, separate from the online total above. -->
              <div
                v-if="codDueKobo > 0"
                class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
              >
                <span class="flex items-center gap-1.5">
                  <Icon name="solar:wad-of-money-linear" size="15" />
                  Pay the rider on delivery (cash)
                </span>
                <span>{{ formatPrice(codDueKobo) }}</span>
              </div>
              <p class="text-xs text-gray-400 dark:text-neutral-500">
                Paid via {{ order.paymentMethod }}<template v-if="codDueKobo > 0"> · delivery fee paid in cash to the rider</template>
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

        <!-- Get help / open a dispute -->
        <BaseButton
          v-if="order"
          variant="secondary"
          size="lg"
          class="w-full"
          @click="showHelp = true"
        >
          {{
            canDispute
              ? 'Report a problem with this order'
              : 'Get help with this order'
          }}
        </BaseButton>
      </div>
    </div>

    <SupportNewTicketModal
      v-model="showHelp"
      :order-id="orderId"
      :dispute="canDispute"
      default-category="ORDER"
      :default-subject="`Help with Order #${orderId}`"
      @created="onHelpCreated"
    />
  </HomeLayout>
</template>

<script setup lang="ts">
import BaseImage from '~~/layers/ui/app/components/BaseImage.vue'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import SupportNewTicketModal from '~~/layers/support/app/components/SupportNewTicketModal.vue'

definePageMeta({ middleware: 'auth' })

useSeo().setOrdersPage()

const route = useRoute()
const orderApi = useOrderApi()

const orderId = computed(() => Number(route.params.id))
const order = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const cancelling = ref(false)

/** Cash owed to the rider on delivery (kobo) — pay-on-delivery self-shipping
 *  only; 0 for prepaid/carrier orders. */
const codDueKobo = computed((): number =>
  Number(order.value?.shippingBreakdown?.codAmountMinor ?? 0),
)

// Support / dispute — a paid order can be disputed; otherwise it's a plain help ticket.
const showHelp = ref(false)
const canDispute = computed(() => order.value?.paymentStatus === 'PAID')
function onHelpCreated(id: string) {
  showHelp.value = false
  if (id) navigateTo(`/support/${id}`)
}

const ORDER_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
const STEP_MAP: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
}
const stepIndex = computed(() => STEP_MAP[order.value?.status] ?? 0)

// ── Live carrier tracking ────────────────────────────────────────────────────
const trackingEvents = ref<
  Array<{ timestamp: string; status: string; description: string; location?: string }>
>([])
const loadingTracking = ref(false)

async function loadTracking() {
  if (!order.value?.waybill && !order.value?.trackingNumber) return
  loadingTracking.value = true
  try {
    const res: any = await orderApi.getOrderTracking(orderId.value)
    // Newest scan first for a top-down timeline.
    trackingEvents.value = (res?.data?.events ?? []).slice().reverse()
  } catch {
    // Non-fatal — the card falls back to "waiting for the first scan".
  } finally {
    loadingTracking.value = false
  }
}

const STATUS_LABELS: Record<string, string> = {
  PRE_TRANSIT: 'Shipment created',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  FAILURE: 'Delivery failed',
  UNKNOWN: 'Update',
}
const prettyStatus = (s: string) => STATUS_LABELS[s] ?? s

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

onMounted(async () => {
  try {
    const res: any = await orderApi.getOrderById(orderId.value)
    order.value = res?.data
    await loadTracking()
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
    notify({
      type: 'error',
      text: extractErrorMessage(e, 'Could not cancel order'),
    })
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
