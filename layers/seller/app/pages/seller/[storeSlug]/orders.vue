<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
          Orders
        </h1>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
          {{ total }} total orders
        </p>
      </div>
    </div>

    <!-- Status tabs -->
    <div
      class="scrollbar-hide -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
    >
      <button
        v-for="tab in STATUS_TABS"
        :key="tab.value"
        @click="activeStatus = tab.value; loadOrders()"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeStatus === tab.value
            ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !orders.length" class="space-y-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-24 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      />
    </div>

    <!-- Orders table -->
    <div v-else-if="orders.length" class="space-y-4">
      <BaseCard
        v-for="order in orders"
        :key="order.id"
        no-padding
      >
        <!-- Order header -->
        <div
          class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
        >
          <div>
            <p
              class="text-sm font-semibold text-gray-900 dark:text-neutral-100"
            >
              Order #{{ order.id }}
            </p>
            <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
              {{ formatDate(order.created_at) }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Payment badge for POD -->
            <BaseBadge v-if="order.paymentMethod === 'pay_on_delivery'" status="success" size="sm">POD</BaseBadge>
            <BaseBadge :status="order.status" :label="order.status" size="sm" />

            <!-- POD: Confirm Cash Received (only when SHIPPED) -->
            <BaseButton
              v-if="order.paymentMethod === 'pay_on_delivery' && order.status === 'SHIPPED'"
              variant="success"
              size="sm"
              @click="confirmCash(order.id)"
            >
              Cash Received
            </BaseButton>

            <!-- POD: Refuse Delivery (CONFIRMED or SHIPPED) -->
            <BaseButton
              v-if="order.paymentMethod === 'pay_on_delivery' && ['CONFIRMED', 'SHIPPED'].includes(order.status)"
              variant="danger"
              size="sm"
              @click="refuseDelivery(order.id)"
            >
              Refused
            </BaseButton>

            <!-- PENDING: confirm or cancel -->
            <select
              v-if="order.status === 'PENDING'"
              @change="(e) => updateStatus(order.id, (e.target as HTMLSelectElement).value)"
              class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="" disabled selected>Action</option>
              <option value="CONFIRMED">Confirm Order</option>
              <option value="CANCELLED">Cancel</option>
            </select>

            <!-- Regular orders: status update dropdown -->
            <select
              v-if="order.paymentMethod !== 'pay_on_delivery' && order.status === 'CONFIRMED'"
              @change="(e) => updateStatus(order.id, (e.target as HTMLSelectElement).value)"
              class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="" disabled selected>Update status</option>
              <option value="SHIPPED">Mark Shipped</option>
              <option value="CANCELLED">Cancel</option>
            </select>

            <!-- POD confirmed: ship it -->
            <select
              v-if="order.paymentMethod === 'pay_on_delivery' && order.status === 'CONFIRMED'"
              @change="(e) => updateStatus(order.id, (e.target as HTMLSelectElement).value)"
              class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="" disabled selected>Ship it</option>
              <option value="SHIPPED">Mark Shipped</option>
            </select>
          </div>
        </div>

        <!-- Customer info -->
        <div
          class="flex items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-neutral-800"
        >
          <img
            :src="order.user?.avatar || ''"
            class="h-8 w-8 shrink-0 rounded-full bg-gray-100 object-cover dark:bg-neutral-800"
          />
          <div class="min-w-0">
            <p
              class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100"
            >
              {{ order.name }}
            </p>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              {{ order.country }}
              <span v-if="order.shippingZone"> · {{ order.shippingZone }}</span>
            </p>
          </div>
        </div>

        <!-- Items -->
        <div class="flex gap-2 overflow-x-auto p-4">
          <div
            v-for="item in order.orderItem"
            :key="item.id"
            class="flex shrink-0 items-start gap-2"
          >
            <img
              :src="item.variant?.product?.media?.[0]?.url || ''"
              class="h-12 w-12 rounded-lg bg-gray-100 object-cover dark:bg-neutral-800"
            />
            <div class="min-w-0">
              <p
                class="w-28 truncate text-xs font-medium text-gray-800 dark:text-neutral-200"
              >
                {{ item.variant?.product?.title }}
              </p>
              <p class="text-[10px] text-gray-400">
                {{ item.variant?.size || item.variant?.label }} ×
                {{ item.quantity }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between bg-gray-50 px-5 py-3 dark:bg-neutral-800/50"
        >
          <div
            v-if="order.trackingNumber"
            class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400"
          >
            <Icon name="mdi:truck-outline" size="14" />
            {{ order.shipper }} · {{ order.trackingNumber }}
          </div>
          <button
            v-else-if="order.status === 'SHIPPED'"
            @click="addTracking(order)"
            class="text-xs font-medium text-brand hover:underline"
          >
            + Add tracking
          </button>
          <div v-else />
          <p class="text-sm font-bold text-gray-900 dark:text-neutral-100">
            {{ formatPrice(order.totalAmount + (order.shippingCost || 0)) }}
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
      >
        <Icon
          name="mdi:package-variant-closed-outline"
          size="32"
          class="text-gray-400 dark:text-neutral-500"
        />
      </div>
      <p class="font-medium text-gray-900 dark:text-neutral-100">
        No orders yet
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Orders for your store will appear here
      </p>
    </div>

    <!-- Tracking modal -->
    <BaseModal
      :model-value="!!trackingModal"
      title="Add Tracking Info"
      max-width="sm"
      @update:model-value="(v) => !v && (trackingModal = null)"
    >
      <div class="space-y-4">
        <BaseInput
          v-model="trackingForm.shipper"
          label="Courier / Shipper"
          placeholder="DHL, FedEx, etc."
        />
        <BaseInput
          v-model="trackingForm.trackingNumber"
          label="Tracking Number"
          placeholder="1Z999AA10123456784"
        />
      </div>
      <template #footer>
        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="trackingModal = null">Cancel</BaseButton>
          <BaseButton variant="primary" class="flex-1" @click="saveTracking">Save</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

const route = useRoute()
const orderApi = useOrderApi()

const storeSlug = computed(() => route.params.storeSlug as string)
const orders = ref<any[]>([])
const total = ref(0)
const isLoading = ref(true)
const activeStatus = ref('')
const trackingModal = ref<any>(null)
const trackingForm = reactive({ shipper: '', trackingNumber: '' })

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
]

const loadOrders = async () => {
  isLoading.value = true
  try {
    const params: any = { storeSlug: storeSlug.value, limit: 50 }
    if (activeStatus.value) params.status = activeStatus.value
    const res: any = await orderApi.getSellerOrders(storeSlug.value, params)
    orders.value = res?.data?.orders || []
    total.value = res?.data?.total || 0
  } catch {
    // BaseApiClient handles the error toast
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async (orderId: number, status: string) => {
  if (!status) return
  try {
    await orderApi.updateOrderStatus(orderId, { status })
    const o = orders.value.find((o) => o.id === orderId)
    if (o) o.status = status
    notify({ type: 'success', text: `Order #${orderId} marked as ${status}` })
  } catch {
    // BaseApiClient handles the error toast
  }
}

const addTracking = (order: any) => {
  trackingModal.value = order
  trackingForm.shipper = ''
  trackingForm.trackingNumber = ''
}

const confirmCash = async (orderId: number) => {
  try {
    await orderApi.confirmCash(orderId)
    const o = orders.value.find((o) => o.id === orderId)
    if (o) { o.status = 'DELIVERED'; o.paymentStatus = 'PAID' }
    notify({ type: 'success', text: `Cash confirmed for order #${orderId}. Wallet credited.` })
  } catch {
    // BaseApiClient handles the error toast
  }
}

const refuseDelivery = async (orderId: number) => {
  if (!confirm(`Mark order #${orderId} as delivery refused? The shipping fee will not be refunded to the buyer.`)) return
  try {
    await orderApi.refuseDelivery(orderId)
    const o = orders.value.find((o) => o.id === orderId)
    if (o) o.status = 'RETURNED'
    notify({ type: 'success', text: `Order #${orderId} marked as delivery refused.` })
  } catch {
    // BaseApiClient handles the error toast
  }
}

const saveTracking = async () => {
  if (!trackingModal.value || !trackingForm.trackingNumber) return
  try {
    await orderApi.updateOrderStatus(trackingModal.value.id, {
      status: 'SHIPPED',
      ...trackingForm,
    })
    const o = orders.value.find((o) => o.id === trackingModal.value.id)
    if (o) Object.assign(o, { ...trackingForm, status: 'SHIPPED' })
    trackingModal.value = null
    notify({ type: 'success', text: 'Tracking info saved' })
  } catch {
    // BaseApiClient handles the error toast
  }
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
    cents / 100,
  )

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

onMounted(loadOrders)

// Reload orders when an ORDER notification arrives via SSE
const notificationStore = useNotificationStore()
watch(
  () => notificationStore.notifications[0],
  (n) => {
    if (n?.type === 'ORDER') loadOrders()
  },
)
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
