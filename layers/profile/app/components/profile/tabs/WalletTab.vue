<template>
  <div class="space-y-6 p-6">
    <!-- Loading State -->
    <div v-if="isLoading && !wallet" class="py-12 text-center">
      <Icon
        name="eos-icons:loading"
        size="32"
        class="animate-spin text-brand"
      />
    </div>

    <template v-else>
      <!-- ── BUYER WALLET (no seller stores) ──────────────────────────── -->
      <template v-if="storeWallets.length === 0">
        <!-- Affiliate earnings card -->
        <div
          class="rounded-xl bg-gradient-to-br from-brand to-[#c41230] p-6 text-white"
        >
          <div class="mb-4 flex items-center justify-between">
            <div class="flex-1">
              <p class="text-sm text-white/80">Affiliate Earnings</p>
              <h2 class="text-4xl font-bold">
                {{ formatAmount(buyerBalance) }}
              </h2>
            </div>
            <Icon name="solar:money-bag-linear" size="48" class="text-white/20" />
          </div>
          <div class="mb-4 rounded-lg bg-white/10 px-4 py-3">
            <div class="flex items-center gap-2">
              <Icon
                name="solar:info-circle-linear"
                size="16"
                class="text-white/70"
              />
              <p class="text-[12px] text-white/80">
                Earn commissions by sharing affiliate product links from the
                Affiliate tab
              </p>
            </div>
          </div>
          <NuxtLink
            to="/sellers/create"
            class="block w-full rounded-lg bg-white/20 py-2 text-center font-medium transition-colors hover:bg-white/30"
          >
            Open a Store to earn more →
          </NuxtLink>
        </div>

        <!-- Spending stats -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Icon
              name="solar:graph-up-linear"
              size="24"
              class="mb-2 text-brand"
            />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatAmount(buyerStats.totalEarned) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Total Earned
            </p>
          </div>
          <div
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Icon
              name="solar:money-bag-linear"
              size="24"
              class="mb-2 text-green-500"
            />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatAmount(buyerBalance) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Available Now
            </p>
          </div>
        </div>

        <!-- Buyer transaction history -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-gray-200 p-4 dark:border-neutral-800">
            <h3 class="font-semibold text-gray-900 dark:text-neutral-100">Earnings History</h3>
          </div>

          <div
            v-if="buyerTransactions.length === 0"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon name="solar:bill-list-linear" size="40" class="mx-auto mb-2" />
            <p class="text-sm">No earnings yet</p>
            <p class="mt-1 text-xs">Share affiliate links to earn commissions</p>
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
            <div
              v-for="tx in buyerTransactions"
              :key="tx.id"
              class="flex items-center justify-between p-4"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 dark:bg-brand/20">
                  <Icon name="solar:tag-bold" size="20" class="text-brand dark:text-brand/80" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {{ tx.description }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-neutral-400">
                    {{ formatDate(tx.created_at) }}
                  </p>
                </div>
              </div>
              <p class="font-semibold text-green-600 dark:text-green-400">
                +{{ formatAmount(tx.amount) }}
              </p>
            </div>

            <div
              v-if="buyerTransactionsTotal > buyerTransactions.length"
              class="border-t border-gray-200 p-3 text-center dark:border-neutral-800"
            >
              <button
                @click="loadMoreBuyerTx"
                :disabled="isLoading"
                class="text-[12px] font-semibold text-brand hover:underline disabled:opacity-50"
              >
                Load more
              </button>
            </div>
          </div>
        </div>

        <!-- Become a seller CTA -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center gap-4 p-5">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10"
            >
              <Icon
                name="solar:shop-2-linear"
                size="24"
                class="text-brand"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-900 dark:text-neutral-100">
                Ready to sell?
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                Open a store to accept payments, track earnings, and withdraw to
                your bank account.
              </p>
            </div>
            <NuxtLink
              to="/sellers/create"
              class="shrink-0 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand/25 transition-colors hover:bg-brand-dark"
            >
              Start →
            </NuxtLink>
          </div>
        </div>
      </template>

      <!-- ── SELLER WALLET ─────────────────────────────────────────────── -->
      <template v-else>
        <!-- Wallet Balance Card -->
        <div
          class="rounded-xl bg-gradient-to-br from-brand to-[#d81b36] p-6 text-white"
        >
          <div class="mb-4 flex items-center justify-between">
            <div class="flex-1">
              <p class="text-sm text-white/80">Total Available Balance</p>
              <h2 class="text-4xl font-bold">{{ formatAmount(balance) }}</h2>
            </div>
            <Icon name="solar:wallet-bold" size="48" class="text-white/20" />
          </div>
          <!-- Pending balance row — always visible -->
          <div class="mb-4 rounded-lg bg-white/10 px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon
                  name="solar:clock-circle-linear"
                  size="16"
                  class="text-white/70"
                />
                <span class="text-sm text-white/80">Pending (held)</span>
              </div>
              <span class="font-semibold">{{
                formatAmount(pendingBalance)
              }}</span>
            </div>
            <p class="mt-1 text-[11px] text-white/60">
              Released to balance when orders are marked delivered
            </p>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5">
            <Icon name="solar:info-circle-linear" size="16" class="shrink-0 text-white/70" />
            <p class="text-[12px] text-white/80">
              Withdrawals and payout accounts are managed per store — open a
              store's <span class="font-semibold">Finance</span> page below.
            </p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Icon
              name="solar:graph-up-linear"
              size="24"
              class="mb-2 text-green-500"
            />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatAmount(stats.totalEarned ?? 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Total Earned
            </p>
          </div>

          <div
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Icon
              name="solar:graph-down-linear"
              size="24"
              class="mb-2 text-red-500"
            />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatAmount(stats.totalSpent ?? 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Total Spent
            </p>
          </div>
        </div>

        <!-- Per-Store Breakdown (shown whenever user has at least one store) -->
        <div
          v-if="storeWallets.length >= 1"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-gray-200 p-4 dark:border-neutral-800">
            <h3 class="font-semibold text-gray-900 dark:text-neutral-100">
              Store Balances
            </h3>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-neutral-800">
            <NuxtLink
              v-for="store in storeWallets"
              :key="store.storeId"
              :to="`/seller/${store.storeSlug}/finance`"
              class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
            >
              <div>
                <p
                  class="text-sm font-medium text-gray-900 dark:text-neutral-100"
                >
                  {{ store.storeName || store.storeSlug }}
                </p>
                <p class="text-xs text-gray-400 dark:text-neutral-500">
                  @{{ store.storeSlug }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-right">
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ formatAmount(store.wallet?.balance ?? 0) }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-neutral-500">
                    <span class="text-amber-500 dark:text-amber-400">
                      {{ formatAmount(store.wallet?.pending_balance ?? 0) }}
                    </span>
                    pending
                  </p>
                </div>
                <Icon
                  name="solar:alt-arrow-right-linear"
                  size="18"
                  class="text-gray-300 dark:text-neutral-600"
                />
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Transaction History -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-gray-200 p-4 dark:border-neutral-800">
            <h3 class="font-semibold text-gray-900 dark:text-neutral-100">
              Transaction History
            </h3>
          </div>

          <div
            v-if="transactions.length === 0"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon
              name="solar:bill-list-linear"
              size="40"
              class="mx-auto mb-2"
            />
            <p class="text-sm">No transactions yet</p>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-neutral-800">
            <div
              v-for="transaction in transactions"
              :key="transaction.id"
              class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full"
                  :class="txIconBg(transaction.type)"
                >
                  <Icon
                    :name="txIcon(transaction.type)"
                    size="20"
                    :class="txIconColor(transaction.type)"
                  />
                </div>
                <div>
                  <p
                    class="text-sm font-medium text-gray-900 dark:text-neutral-100"
                  >
                    {{ transaction.description }}
                  </p>
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-gray-500 dark:text-neutral-400">
                      {{ formatDate(transaction.created_at) }}
                    </p>
                    <span
                      v-if="transaction.type === 'CREDIT_PENDING'"
                      class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    >
                      PENDING
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right" :class="txAmountColor(transaction.type)">
                <p class="font-semibold">
                  {{ TX_DEBIT_TYPES.has(transaction.type) ? '-' : '+' }}{{ formatAmount(transaction.amount) }}
                </p>
              </div>
            </div>
          </div>
        </div> </template
      ><!-- end seller wallet --> </template
    ><!-- end v-else (loaded) -->
  </div>
</template>

<script setup lang="ts">
import { useWallet } from '~~/layers/commerce/app/composables/useWallet'
import { useBuyerWallet } from '~~/layers/commerce/app/composables/useBuyerWallet'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'

const {
  wallet,
  isLoading,
  balance,
  pendingBalance,
  stats,
  transactions,
  storeWallets,
  fetchWallet,
  fetchTransactions,
} = useWallet()

const {
  balance: buyerBalance,
  stats: buyerStats,
  transactions: buyerTransactions,
  transactionsTotal: buyerTransactionsTotal,
  fetchWallet: fetchBuyerWallet,
  fetchTransactions: fetchBuyerTransactions,
} = useBuyerWallet()

const loadMoreBuyerTx = () => fetchBuyerTransactions(20, buyerTransactions.value.length)

const { formatKobo } = useCurrency()

onMounted(async () => {
  try {
    await Promise.all([
      fetchWallet(),
      fetchTransactions(),
      fetchBuyerWallet(),
      fetchBuyerTransactions(),
    ])
  } catch {
    // Wallet might not exist yet for non-sellers — handled gracefully
  }
})

const formatAmount = (amount: number) => formatKobo(amount)

const TX_DEBIT_TYPES = new Set(['DEBIT', 'PLATFORM_FEE_DEBIT'])
const TX_PENDING_TYPES = new Set(['CREDIT_PENDING'])
const TX_REFUND_TYPES = new Set(['PLATFORM_FEE_REFUND'])

const txIconBg = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'bg-red-100 dark:bg-red-900/20'
  if (TX_PENDING_TYPES.has(type)) return 'bg-amber-100 dark:bg-amber-900/20'
  if (TX_REFUND_TYPES.has(type)) return 'bg-blue-100 dark:bg-blue-900/20'
  return 'bg-green-100 dark:bg-green-900/20'
}
const txIcon = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'solar:arrow-up-linear'
  if (TX_PENDING_TYPES.has(type)) return 'solar:clock-circle-linear'
  if (TX_REFUND_TYPES.has(type)) return 'solar:arrow-left-linear'
  return 'solar:arrow-down-linear'
}
const txIconColor = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'text-red-600'
  if (TX_PENDING_TYPES.has(type)) return 'text-amber-600'
  if (TX_REFUND_TYPES.has(type)) return 'text-blue-600'
  return 'text-green-600'
}
const txAmountColor = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'text-red-600'
  if (TX_PENDING_TYPES.has(type)) return 'text-amber-600'
  if (TX_REFUND_TYPES.has(type)) return 'text-blue-600'
  return 'text-green-600'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
