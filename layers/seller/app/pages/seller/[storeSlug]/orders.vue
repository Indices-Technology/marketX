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

            <!-- GIG orders: book a pickup ("ready to ship") OR drop the parcel at a
                 GIG centre yourself. Not marked shipped here — pickup flips to
                 SHIPPED when GIG scans it; drop-off when the seller adds the
                 Waybill from the counter. -->
            <template
              v-if="isGigOrder(order) && order.status === 'CONFIRMED' && !order.waybill && !order.dropoffDetails"
            >
              <BaseButton
                variant="primary"
                size="sm"
                :loading="bookingId === order.id"
                @click="bookGig(order)"
              >
                Book GIG pickup
              </BaseButton>
              <BaseButton
                variant="secondary"
                size="sm"
                @click="openDropoffPicker(order)"
              >
                Drop off at GIG
              </BaseButton>
            </template>

            <!-- Regular (non-GIG) orders: manual status update -->
            <select
              v-if="!isGigOrder(order) && order.paymentMethod !== 'pay_on_delivery' && order.status === 'CONFIRMED'"
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
            v-if="order.user?.avatar"
            :src="imgAvatar(order.user.avatar)"
            class="h-8 w-8 shrink-0 rounded-full bg-gray-100 object-cover dark:bg-neutral-800"
            loading="lazy"
            decoding="async"
          />
          <div
            v-else
            class="h-8 w-8 shrink-0 rounded-full bg-gray-100 dark:bg-neutral-800"
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
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
              <BaseImage
                v-if="item.variant?.product?.media?.[0]?.url"
                :src="item.variant.product.media[0].url"
                alt=""
                :width="48"
                :height="48"
                class="h-full w-full"
              />
            </div>
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

        <!-- Drop-off booked: tell the seller where to take the parcel + the ref,
             then let them add the Waybill GIG issues at the counter. -->
        <div
          v-if="order.dropoffDetails && !order.waybill"
          class="border-t border-blue-100 bg-blue-50 px-5 py-3 text-xs dark:border-blue-500/20 dark:bg-blue-500/10"
        >
          <p class="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
            <Icon name="solar:box-linear" size="14" />
            Drop this parcel at GIG
          </p>
          <p class="mt-1 font-medium text-gray-900 dark:text-neutral-100">
            {{ order.dropoffDetails.centre?.name || 'Your nearest GIG centre' }}
          </p>
          <p v-if="order.dropoffDetails.centre?.address" class="text-gray-500 dark:text-neutral-400">
            {{ order.dropoffDetails.centre.address }}
          </p>
          <p class="mt-1 text-gray-500 dark:text-neutral-400">
            Reference: <span class="font-mono font-semibold text-gray-900 dark:text-neutral-100">{{ order.dropoffDetails.tempCode }}</span>
          </p>
          <button
            @click="addTracking(order)"
            class="mt-2 text-[11px] font-semibold text-brand hover:underline"
          >
            + Add the Waybill after dropping off
          </button>
        </div>

        <!-- Pay-on-delivery: cash the seller's rider collects from the buyer.
             Not part of the MarketX-settled total below. -->
        <div
          v-if="codDueKobo(order) > 0"
          class="flex items-center gap-1.5 border-t border-amber-100 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
        >
          <Icon name="solar:wad-of-money-linear" size="14" />
          Collect {{ formatPrice(codDueKobo(order)) }} cash from the buyer on delivery
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between bg-gray-50 px-5 py-3 dark:bg-neutral-800/50"
        >
          <div
            v-if="order.waybill || order.trackingNumber"
            class="flex flex-col gap-1 text-xs text-gray-500 dark:text-neutral-400"
          >
            <span class="flex items-center gap-1.5">
              <Icon name="solar:sale-linear" size="14" />
              {{ order.shipper || 'Carrier' }} · {{ order.waybill || order.trackingNumber }}
            </span>
            <div class="flex items-center gap-2">
              <span
                v-if="order.carrierStatus"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="carrierStatusClass(order.carrierStatus)"
              >
                <Icon :name="carrierStatusIcon(order.carrierStatus)" size="12" />
                {{ prettyStatus(order.carrierStatus) }}
              </span>
              <button
                @click="toggleTracking(order)"
                class="text-[11px] font-medium text-brand hover:underline"
              >
                {{ trackingState[order.id]?.open ? 'Hide tracking' : 'Track order' }}
              </button>
            </div>
            <span
              v-if="isGigOrder(order) && order.status === 'CONFIRMED'"
              class="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
            >
              <Icon name="solar:clock-circle-linear" size="12" />
              Booked — hand the parcel to GIG. Marked shipped once they scan it.
            </span>
          </div>
          <button
            v-else-if="!isGigOrder(order) && order.status === 'SHIPPED'"
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

        <!-- Live carrier tracking timeline (lazy-loaded on demand) -->
        <div
          v-if="trackingState[order.id]?.open"
          class="border-t border-gray-200 px-5 py-4 dark:border-neutral-800"
        >
          <div
            v-if="trackingState[order.id]?.loading"
            class="text-xs text-gray-400 dark:text-neutral-500"
          >
            Loading tracking…
          </div>
          <div
            v-else-if="!trackingState[order.id]?.events?.length"
            class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400"
          >
            <Icon name="solar:clock-circle-linear" size="14" class="text-amber-500" />
            Booked with {{ order.shipper || 'the carrier' }} — waiting for the first scan.
          </div>
          <ol v-else class="relative space-y-3">
            <li
              v-for="(ev, i) in trackingState[order.id]!.events"
              :key="i"
              class="flex gap-3"
            >
              <div class="flex flex-col items-center">
                <span
                  class="mt-1 h-2 w-2 shrink-0 rounded-full"
                  :class="i === 0 ? 'bg-brand' : 'bg-gray-300 dark:bg-neutral-600'"
                />
                <span
                  v-if="i < trackingState[order.id]!.events.length - 1"
                  class="mt-1 w-px flex-1 bg-gray-200 dark:bg-neutral-700"
                />
              </div>
              <div class="min-w-0 flex-1 pb-1">
                <p class="text-xs font-medium text-gray-900 dark:text-neutral-100">
                  {{ prettyStatus(ev.status) }}
                </p>
                <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                  {{ ev.description }}
                </p>
                <p class="mt-0.5 text-[10px] text-gray-400 dark:text-neutral-500">
                  {{ formatDateTime(ev.timestamp) }}
                  <span v-if="ev.location"> · {{ ev.location }}</span>
                </p>
              </div>
            </li>
          </ol>
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
          name="solar:box-linear"
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
      :title="trackingModal && isGigOrder(trackingModal) ? 'Add GIG Waybill' : 'Add Tracking Info'"
      max-width="sm"
      @update:model-value="(v) => !v && (trackingModal = null)"
    >
      <div class="space-y-4">
        <BaseInput
          v-model="trackingForm.shipper"
          label="Courier / Rider"
          placeholder="e.g. GIG, DHL, or your own rider"
          hint="A courier company, or the name of the rider handling delivery."
        />
        <BaseInput
          v-if="trackingModal && isGigOrder(trackingModal)"
          v-model="trackingForm.trackingNumber"
          label="GIG Waybill"
          placeholder="e.g. 1349107274"
          hint="The Waybill number GIG printed when you dropped the parcel off. This starts live tracking."
        />
        <BaseInput
          v-else
          v-model="trackingForm.trackingNumber"
          label="Tracking number / Driver's phone"
          placeholder="Tracking no. — or the driver's phone number"
          hint="No tracking number? For your own delivery, enter the driver's phone number so the buyer can reach them."
        />
      </div>
      <template #footer>
        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="trackingModal = null">Cancel</BaseButton>
          <BaseButton variant="primary" class="flex-1" @click="saveTracking">Save</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Drop-off centre picker -->
    <BaseModal
      :model-value="!!dropoffPicker"
      title="Choose a GIG drop-off centre"
      max-width="sm"
      @update:model-value="(v) => !v && (dropoffPicker = null)"
    >
      <div v-if="dropoffPicker" class="space-y-3">
        <p class="text-xs text-gray-500 dark:text-neutral-400">
          Pick the GIG centre you'll take the parcel to. Nearest to your store first.
        </p>

        <div v-if="dropoffPicker.loading" class="space-y-2">
          <div
            v-for="i in 3"
            :key="i"
            class="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
          />
        </div>

        <div
          v-else-if="!dropoffPicker.centres.length"
          class="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        >
          No GIG centres found for your ship-from state. We'll use the nearest one automatically when you book.
        </div>

        <div v-else class="max-h-72 space-y-2 overflow-y-auto">
          <button
            v-for="c in dropoffPicker.centres"
            :key="c.id"
            type="button"
            class="flex w-full items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors"
            :class="
              dropoffPicker.selectedId === c.id
                ? 'border-brand bg-brand/5 dark:bg-brand/10'
                : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600'
            "
            @click="dropoffPicker.selectedId = c.id"
          >
            <Icon name="solar:map-point-linear" size="16" class="mt-0.5 shrink-0 text-brand" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">{{ c.name }}</p>
              <p v-if="c.address" class="text-[11px] text-gray-500 dark:text-neutral-400">{{ c.address }}</p>
            </div>
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="dropoffPicker = null">Cancel</BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1"
            :loading="dropoffId != null"
            :disabled="dropoffPicker?.loading"
            @click="confirmDropoff"
          >
            Book drop-off
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import BaseImage from '~~/layers/ui/app/components/BaseImage.vue'
import { useOrderApi } from '~~/layers/commerce/app/services/order.api'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

useSeo().setOrdersPage()

const route = useRoute()
const orderApi = useOrderApi()

const storeSlug = computed(() => route.params.storeSlug as string)
const orders = ref<any[]>([])
const total = ref(0)
const isLoading = ref(true)
const activeStatus = ref('')
const trackingModal = ref<any>(null)
const trackingForm = reactive({ shipper: '', trackingNumber: '' })
const bookingId = ref<number | null>(null)
const dropoffId = ref<number | null>(null)

/** GIG-fulfilled order → booked via the carrier API, not manual "mark shipped". */
const isGigOrder = (order: any): boolean =>
  order.shippingProvider === 'gig' ||
  /gig/i.test(`${order.shippingZone ?? ''} ${order.shipper ?? ''}`)

const bookGig = async (order: any) => {
  bookingId.value = order.id
  try {
    const res = await orderApi.bookShipment(order.id)
    const wb = res?.data?.waybill
    const o = orders.value.find((x) => x.id === order.id)
    if (o) {
      o.waybill = wb
      o.trackingNumber = wb
      o.shipper = 'GIG Logistics'
      o.shippingProvider = 'gig'
    }
    notify({
      type: 'success',
      text: res?.data?.alreadyBooked
        ? `Order #${order.id} was already booked · ${wb}`
        : `Booked with GIG · Waybill ${wb}. Hand the parcel over for pickup.`,
    })
  } catch {
    // BaseApiClient surfaces the error toast
  } finally {
    bookingId.value = null
  }
}

interface DropoffCentre { id: number; name: string; code: string; address?: string }
const dropoffPicker = ref<{
  order: any
  loading: boolean
  centres: DropoffCentre[]
  selectedId: number | null
} | null>(null)

/** Open the centre picker for a drop-off and lazy-load nearby GIG centres. */
const openDropoffPicker = async (order: any) => {
  dropoffPicker.value = { order, loading: true, centres: [], selectedId: null }
  try {
    const res = await orderApi.getDropoffCentres(order.id)
    if (dropoffPicker.value?.order.id !== order.id) return // picker changed/closed
    const centres: DropoffCentre[] = res?.data ?? []
    dropoffPicker.value.centres = centres
    dropoffPicker.value.selectedId = centres[0]?.id ?? null
  } catch {
    // BaseApiClient surfaces the error toast; booking still works with nearest.
  } finally {
    if (dropoffPicker.value) dropoffPicker.value.loading = false
  }
}

/** Book the drop-off with the picked centre (falls back to nearest if none). */
const confirmDropoff = async () => {
  if (!dropoffPicker.value) return
  const { order, selectedId } = dropoffPicker.value
  await bookDropoff(order, selectedId ?? undefined)
  dropoffPicker.value = null
}

const bookDropoff = async (order: any, dropoffCentreId?: number) => {
  dropoffId.value = order.id
  try {
    const res = await orderApi.bookDropoff(order.id, dropoffCentreId)
    const o = orders.value.find((x) => x.id === order.id)
    if (o) {
      o.dropoffDetails = { tempCode: res?.data?.tempCode, centre: res?.data?.centre }
      o.shipper = 'GIG Logistics'
      o.shippingProvider = 'gig'
      o.carrierStatus = 'PRE_TRANSIT'
    }
    const centre = res?.data?.centre?.name
    notify({
      type: 'success',
      text: res?.data?.alreadyBooked
        ? `Order #${order.id} already has a drop-off booked`
        : `Drop-off booked${centre ? ` · take it to ${centre}` : ''}. Add the Waybill after dropping off.`,
    })
  } catch {
    // BaseApiClient surfaces the error toast
  } finally {
    dropoffId.value = null
  }
}

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
  // GIG drop-off: the seller enters the Waybill printed at the counter, so
  // pre-fill the courier as GIG. Self-delivery leaves it blank for the rider.
  trackingForm.shipper = isGigOrder(order) ? 'GIG Logistics' : ''
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
  const order = trackingModal.value
  // GIG order → the number is a GIG Waybill, which must land in `waybill` so the
  // carrier poller tracks it. Self-delivery → it's a display-only trackingNumber.
  const isGig = isGigOrder(order)
  const payload = isGig
    ? { status: 'SHIPPED' as const, shipper: trackingForm.shipper, waybill: trackingForm.trackingNumber }
    : { status: 'SHIPPED' as const, shipper: trackingForm.shipper, trackingNumber: trackingForm.trackingNumber }
  try {
    await orderApi.updateOrderStatus(order.id, payload)
    const o = orders.value.find((o) => o.id === order.id)
    if (o) {
      o.status = 'SHIPPED'
      o.shipper = trackingForm.shipper
      if (isGig) o.waybill = trackingForm.trackingNumber
      else o.trackingNumber = trackingForm.trackingNumber
    }
    trackingModal.value = null
    notify({ type: 'success', text: isGig ? 'Waybill saved — tracking started' : 'Tracking info saved' })
  } catch {
    // BaseApiClient handles the error toast
  }
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
    cents / 100,
  )

/** Cash the rider collects from the buyer on delivery (kobo). Pay-on-delivery
 *  self-shipping only — 0 for prepaid/carrier orders. */
const codDueKobo = (order: any): number =>
  Number(order?.shippingBreakdown?.codAmountMinor ?? 0)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// ── Live carrier tracking (normalized status → label / colour / icon) ─────────
const STATUS_LABELS: Record<string, string> = {
  PRE_TRANSIT: 'Awaiting pickup',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  FAILURE: 'Delivery failed',
  UNKNOWN: 'Update',
}
const prettyStatus = (s: string) => STATUS_LABELS[s] ?? s

const carrierStatusClass = (s: string): string => {
  if (s === 'DELIVERED')
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
  if (s === 'RETURNED' || s === 'FAILURE')
    return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
  if (s === 'OUT_FOR_DELIVERY')
    return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
  if (s === 'PRE_TRANSIT')
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
  return 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300' // IN_TRANSIT / other
}
const carrierStatusIcon = (s: string): string => {
  if (s === 'DELIVERED') return 'solar:check-circle-linear'
  if (s === 'RETURNED' || s === 'FAILURE') return 'solar:danger-triangle-linear'
  if (s === 'OUT_FOR_DELIVERY') return 'solar:delivery-linear'
  if (s === 'PRE_TRANSIT') return 'solar:clock-circle-linear'
  return 'solar:box-linear'
}

interface TrackingEvent {
  timestamp: string
  status: string
  description: string
  location?: string
}
const trackingState = reactive<
  Record<number, { open: boolean; loading: boolean; events: TrackingEvent[] }>
>({})

/** Toggle the per-order timeline; lazy-load the scans from the carrier on first open. */
const toggleTracking = async (order: any) => {
  const existing = trackingState[order.id]
  if (existing) {
    existing.open = !existing.open
    return
  }
  const state = reactive({ open: true, loading: true, events: [] as TrackingEvent[] })
  trackingState[order.id] = state
  try {
    const res: any = await orderApi.getOrderTracking(order.id)
    // Newest scan first for a top-down timeline.
    state.events = (res?.data?.events ?? []).slice().reverse()
  } catch {
    // Non-fatal — the panel falls back to "waiting for the first scan".
  } finally {
    state.loading = false
  }
}

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
