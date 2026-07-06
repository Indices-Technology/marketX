<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Payouts
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Review and settle seller withdrawal requests
      </p>
    </div>

    <!-- Filter tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        :class="[
          'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
          statusFilter === f.value
            ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'border border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
        ]"
        @click="statusFilter = f.value; offset = 0"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <!-- Skeleton (first load only) -->
      <div v-if="pending && !data" class="divide-y divide-gray-50 dark:divide-neutral-800">
        <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-4 py-4">
          <div class="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-neutral-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
            <div class="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
          </div>
          <div class="h-6 w-20 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!payouts.length"
        class="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-neutral-500"
      >
        <Icon name="mdi:cash-check" size="30" class="mb-2 opacity-40" />
        <p class="text-[13px]">No {{ (statusFilter || 'matching').toLowerCase() }} payouts</p>
      </div>

      <!-- Rows -->
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Amount</th>
            <th class="px-4 py-3">Bank</th>
            <th class="px-4 py-3">Requested</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="p in payouts" :key="p.id">
            <!-- Store -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img
                  :src="avatarSrc(p.wallet?.seller?.store_logo, p.wallet?.seller?.store_name)"
                  class="h-7 w-7 shrink-0 rounded-full object-cover"
                  alt=""
                />
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-900 dark:text-neutral-100">
                    {{ p.wallet?.seller?.store_name || 'Unknown store' }}
                  </p>
                  <p class="truncate text-[11px] text-gray-400 dark:text-neutral-500">
                    @{{ p.wallet?.seller?.store_slug || '—' }}
                  </p>
                </div>
              </div>
            </td>
            <!-- Amount -->
            <td class="px-4 py-3">
              <p class="font-semibold text-gray-900 dark:text-neutral-100">
                {{ formatNGN(p.amount) }}
              </p>
              <p v-if="netOf(p) != null" class="text-[11px] text-gray-400 dark:text-neutral-500">
                net {{ formatNGN(netOf(p)) }}
              </p>
            </td>
            <!-- Bank -->
            <td class="px-4 py-3">
              <p class="text-gray-700 dark:text-neutral-300">{{ p.bank_account?.name || '—' }}</p>
              <p class="text-[11px] text-gray-400 dark:text-neutral-500">
                {{ p.bank_account?.account_number || '—' }}
                <span v-if="p.bank_account?.bank_code"> · {{ p.bank_account.bank_code }}</span>
              </p>
            </td>
            <!-- Requested -->
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
              {{ formatDate(p.requested_at) }}
            </td>
            <!-- Status -->
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="statusClass(p.status)"
              >
                {{ p.status }}
              </span>
            </td>
            <!-- Actions -->
            <td class="px-4 py-3 text-right">
              <div v-if="p.status === 'PENDING'" class="flex justify-end gap-2">
                <BaseButton size="sm" variant="primary" @click="openModal(p, 'PAID')">
                  Mark paid
                </BaseButton>
                <BaseButton size="sm" variant="secondary" @click="openModal(p, 'REJECTED')">
                  Reject
                </BaseButton>
              </div>
              <span
                v-else-if="p.transaction_ref"
                class="text-[11px] text-gray-400 dark:text-neutral-500"
              >
                ref: {{ p.transaction_ref }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="hasMore || offset > 0" class="flex justify-between">
      <BaseButton size="sm" variant="secondary" :disabled="offset === 0" @click="offset = Math.max(0, offset - LIMIT)">
        Previous
      </BaseButton>
      <BaseButton size="sm" variant="secondary" :disabled="!hasMore" @click="offset += LIMIT">
        Next
      </BaseButton>
    </div>

    <!-- Action modal -->
    <BaseModal
      :model-value="modal.open"
      :title="modal.action === 'PAID' ? 'Mark payout as paid' : 'Reject payout'"
      max-width="sm"
      @update:model-value="(v) => !v && closeModal()"
    >
      <div v-if="modal.payout" class="space-y-4">
        <div class="rounded-xl bg-gray-50 p-3 text-[13px] dark:bg-neutral-800/50">
          <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-neutral-400">Store</span>
            <span class="font-medium text-gray-900 dark:text-neutral-100">
              {{ modal.payout.wallet?.seller?.store_name }}
            </span>
          </div>
          <div class="mt-1 flex items-center justify-between">
            <span class="text-gray-500 dark:text-neutral-400">Amount</span>
            <span class="font-semibold text-gray-900 dark:text-neutral-100">
              {{ formatNGN(modal.payout.amount) }}
            </span>
          </div>
          <div class="mt-1 flex items-center justify-between">
            <span class="text-gray-500 dark:text-neutral-400">Pay to</span>
            <span class="text-right text-gray-700 dark:text-neutral-300">
              {{ modal.payout.bank_account?.name }}<br />
              <span class="text-[11px] text-gray-400">
                {{ modal.payout.bank_account?.account_number }}
                <template v-if="modal.payout.bank_account?.bank_code">· {{ modal.payout.bank_account.bank_code }}</template>
              </span>
            </span>
          </div>
        </div>

        <template v-if="modal.action === 'PAID'">
          <BaseInput
            v-model="transferRef"
            label="Bank transfer reference (optional)"
            placeholder="e.g. FT250706XYZ"
          />
          <p class="text-[12px] text-gray-500 dark:text-neutral-400">
            Confirm only after you've completed the bank transfer. This records the
            payout as settled.
          </p>
        </template>
        <template v-else>
          <p class="rounded-lg bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            Rejecting returns
            <span class="font-semibold">{{ formatNGN(modal.payout.amount) }}</span>
            to the seller's wallet balance. The seller will be notified.
          </p>
        </template>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="closeModal">Cancel</BaseButton>
          <BaseButton
            :variant="modal.action === 'PAID' ? 'primary' : 'danger'"
            class="flex-1"
            :loading="submitting"
            :disabled="submitting"
            @click="confirm"
          >
            {{ modal.action === 'PAID' ? 'Confirm paid' : 'Reject & refund' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { avatarSrc } from '~~/layers/core/app/utils/cloudinary'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const FILTERS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
]

const LIMIT = 20
const route = useRoute()
const { formatNGN } = useCurrency()

const statusFilter = ref((route.query.status as string) || 'PENDING')
const offset = ref(0)

const adminApi = useAdminApi()
const { data, pending } = useAsyncData(
  'admin-payouts',
  () =>
    adminApi.getPayouts({
      status: statusFilter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [statusFilter, offset] },
)

const payouts = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch(statusFilter, () => {
  offset.value = 0
})

// Net amount the seller receives (gross minus fees), stored on the request.
function netOf(p: any): number | null {
  const n = p?.bank_account?.netAmount
  return typeof n === 'number' ? n : null
}

function statusClass(status: string) {
  if (status === 'PENDING')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (status === 'PAID')
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Action modal ────────────────────────────────────────────────────────────
const modal = reactive<{ open: boolean; action: 'PAID' | 'REJECTED'; payout: any }>({
  open: false,
  action: 'PAID',
  payout: null,
})
const transferRef = ref('')
const submitting = ref(false)

function openModal(payout: any, action: 'PAID' | 'REJECTED') {
  modal.payout = payout
  modal.action = action
  transferRef.value = ''
  modal.open = true
}

function closeModal() {
  if (submitting.value) return
  modal.open = false
}

async function confirm() {
  if (!modal.payout || submitting.value) return
  submitting.value = true
  const id = modal.payout.id
  const action = modal.action
  try {
    await adminApi.processPayout(id, {
      action,
      transactionRef: action === 'PAID' ? transferRef.value.trim() || undefined : undefined,
    })
    // Optimistic: a processed request leaves the Pending queue; otherwise patch.
    const items = (data.value as any)?.items
    if (items) {
      if (statusFilter.value === 'PENDING') {
        ;(data.value as any).items = items.filter((r: any) => r.id !== id)
      } else {
        const row = items.find((r: any) => r.id === id)
        if (row)
          Object.assign(row, {
            status: action,
            transaction_ref: action === 'PAID' ? transferRef.value.trim() || null : row.transaction_ref,
            completed_at: new Date().toISOString(),
          })
      }
    }
    modal.open = false
  } catch {
    // BaseApiClient surfaces the error toast
  } finally {
    submitting.value = false
  }
}
</script>
