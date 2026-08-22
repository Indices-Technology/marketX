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
        <Icon name="solar:wad-of-money-linear" size="30" class="mb-2 opacity-40" />
        <p class="text-[13px]">No {{ (statusFilter || 'matching').toLowerCase() }} payouts</p>
      </div>

      <!-- Rows -->
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Payable</th>
            <th class="px-4 py-3">Bank</th>
            <th class="px-4 py-3">Requested</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="p in payouts" :key="p.id">
            <!-- Payee: a store for a seller payout, a person for an affiliate
                 payout. Rendering only the store showed affiliate rows as
                 "Unknown store" — an anonymous bank account an admin would be
                 asked to send real money to. -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img
                  :src="avatarSrc(payeeOf(p).avatar, payeeOf(p).name)"
                  class="h-7 w-7 shrink-0 rounded-full object-cover"
                  alt=""
                />
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-900 dark:text-neutral-100">
                    {{ payeeOf(p).name }}
                  </p>
                  <p class="truncate text-[11px] text-gray-400 dark:text-neutral-500">
                    {{ payeeOf(p).handle }}
                  </p>
                </div>
                <span
                  v-if="payeeOf(p).isAffiliate"
                  class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  Affiliate
                </span>
              </div>
            </td>
            <!-- Amount: payable (net) is what the admin transfers; gross is what
                 was debited from the wallet. Both shown to avoid over-paying. -->
            <td class="px-4 py-3">
              <p class="font-semibold text-gray-900 dark:text-neutral-100">
                {{ formatNGN(payableOf(p)) }}
              </p>
              <p class="text-[11px] text-gray-400 dark:text-neutral-500">
                {{ formatNGN(p.amount) }} requested<template v-if="totalFeesOf(p) != null"> · {{ formatNGN(totalFeesOf(p)) }} fees</template>
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
            <span class="text-gray-500 dark:text-neutral-400">Paying</span>
            <span class="font-medium text-gray-900 dark:text-neutral-100">
              {{ payeeOf(modal.payout).name }}
            </span>
          </div>
          <div class="mt-1 flex items-center justify-between">
            <span class="text-gray-500 dark:text-neutral-400">Requested (debited)</span>
            <span class="text-gray-700 dark:text-neutral-300">
              {{ formatNGN(modal.payout.amount) }}
            </span>
          </div>
          <div
            v-if="feesOf(modal.payout).platformFee != null"
            class="mt-1 flex items-center justify-between"
          >
            <span class="text-gray-500 dark:text-neutral-400">Platform fee</span>
            <span class="text-gray-700 dark:text-neutral-300">
              −{{ formatNGN(feesOf(modal.payout).platformFee) }}
            </span>
          </div>
          <div
            v-if="feesOf(modal.payout).transferFee != null"
            class="mt-1 flex items-center justify-between"
          >
            <span class="text-gray-500 dark:text-neutral-400">Transfer fee</span>
            <span class="text-gray-700 dark:text-neutral-300">
              −{{ formatNGN(feesOf(modal.payout).transferFee) }}
            </span>
          </div>
          <div
            class="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-neutral-700"
          >
            <span class="font-medium text-gray-900 dark:text-neutral-100">
              {{ modal.action === 'PAID' ? 'Transfer to seller' : 'Net to seller' }}
            </span>
            <span class="text-base font-bold text-gray-900 dark:text-neutral-100">
              {{ formatNGN(payableOf(modal.payout)) }}
            </span>
          </div>
          <div class="mt-2 flex items-center justify-between">
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
            Transfer <span class="font-semibold text-gray-700 dark:text-neutral-300">{{ formatNGN(payableOf(modal.payout)) }}</span>
            to the seller's bank, then confirm. This records the payout as settled.
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
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
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

// Fee breakdown for the request (all in kobo).
//
// Source of truth is the typed `amountNet` / `platformFee` / `transferFee`
// columns. The `bank_account` JSON is read only as a fallback, for rows written
// before those columns existed — new withdrawals populate both.
function feesOf(p: any): { net: number | null; platformFee: number | null; transferFee: number | null } {
  const ba = p?.bank_account ?? {}
  const num = (v: unknown) => (typeof v === 'number' ? v : null)
  return {
    net: num(p?.amountNet) ?? num(ba.netAmount),
    platformFee: num(p?.platformFee) ?? num(ba.platformFee),
    transferFee: num(p?.transferFee) ?? num(ba.transferFee),
  }
}

// Who is being paid.
//
// A payout belongs to exactly one wallet: a seller's store, or a buyer wallet
// holding affiliate commission earned by someone with no store. The admin has
// to be able to tell which — they are about to send money to the bank account
// on this row, and "Unknown store" is not an identity.
function payeeOf(p: any): {
  name: string
  handle: string
  avatar: string | null
  isAffiliate: boolean
} {
  const seller = p?.wallet?.seller
  if (seller) {
    return {
      name: seller.store_name || 'Unnamed store',
      handle: seller.store_slug ? `@${seller.store_slug}` : '—',
      avatar: seller.store_logo ?? null,
      isAffiliate: false,
    }
  }
  const profile = p?.buyerWallet?.profile
  return {
    name: profile?.username || 'Affiliate',
    handle: profile?.username ? `@${profile.username}` : 'affiliate commission',
    avatar: profile?.avatar ?? null,
    isAffiliate: true,
  }
}

// Amount the admin should actually transfer to the seller (net of fees).
//
// The gross fallback is retained ONLY for historical rows whose net was never
// recorded. It is deliberately the last resort and it errs high, so it must
// never become the path for a live payout: a DB CHECK constraint now requires
// amountNet on anything PENDING, which is what keeps that true.
function payableOf(p: any): number {
  const { net } = feesOf(p)
  return net ?? p?.amount ?? 0
}

// Total fees withheld (platform + transfer), or null when not recorded.
function totalFeesOf(p: any): number | null {
  const { platformFee, transferFee } = feesOf(p)
  if (platformFee == null && transferFee == null) return null
  return (platformFee ?? 0) + (transferFee ?? 0)
}

// Amber = waiting on someone. Blue = money is in flight and its fate is not
// yet known, which is deliberately NOT green: PROCESSING must never read as
// settled. Green = confirmed paid. Red = terminal failure, funds returned.
function statusClass(status: string) {
  if (status === 'PENDING' || status === 'APPROVED')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (status === 'PROCESSING')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
