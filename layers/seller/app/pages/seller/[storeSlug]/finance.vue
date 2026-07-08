<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-brand">
        Finance
      </p>
      <h1
        class="font-display text-2xl font-bold text-gray-900 dark:text-neutral-100"
      >
        {{ storeName || `@${storeSlug}` }}
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Balance, payouts and transactions for this store
      </p>
    </div>

    <!-- Balance card -->
    <div class="rounded-2xl bg-gradient-to-br from-brand to-[#c41230] p-6 text-white">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-white/80">Available balance</p>
          <p class="mt-0.5 font-display text-4xl font-bold">
            {{ formatKobo(wallet.balance) }}
          </p>
          <p class="mt-1 text-sm text-white/70">
            {{ formatKobo(wallet.pendingBalance) }} pending (releases on delivery)
          </p>
        </div>
        <Icon name="mdi:wallet" size="40" class="shrink-0 text-white/20" />
      </div>

      <div class="mt-5 flex gap-6 border-t border-white/15 pt-4">
        <div>
          <p class="text-xs text-white/70">Total earned</p>
          <p class="font-display text-lg font-bold">
            {{ formatKobo(wallet.totalEarned) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-white/70">Total spent</p>
          <p class="font-display text-lg font-bold">
            {{ formatKobo(wallet.totalSpent) }}
          </p>
        </div>
      </div>

      <button
        class="mt-5 w-full rounded-xl bg-white/20 py-2.5 text-sm font-bold transition-colors hover:bg-white/30 disabled:opacity-50 sm:w-auto sm:px-8"
        :disabled="wallet.balance <= 0"
        @click="showWithdraw = true"
      >
        Withdraw
      </button>
    </div>

    <!-- Payout accounts -->
    <div
      class="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-neutral-800"
      >
        <div class="flex items-center gap-2">
          <Icon name="mdi:bank-outline" size="20" class="text-brand" />
          <h2
            class="font-display text-base font-bold text-gray-900 dark:text-neutral-100"
          >
            Payout accounts
          </h2>
        </div>
        <BaseButton variant="ghost" size="xs" @click="showAddBank = !showAddBank">
          <Icon name="mdi:plus" size="14" />
          Add account
        </BaseButton>
      </div>

      <!-- List -->
      <div
        v-if="bankAccounts.length"
        class="divide-y divide-gray-100 dark:divide-neutral-800"
      >
        <div
          v-for="account in bankAccounts"
          :key="account.id"
          class="flex items-center justify-between p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
            >
              <Icon
                name="mdi:bank"
                size="16"
                class="text-gray-500 dark:text-neutral-400"
              />
            </div>
            <div>
              <p
                class="text-sm font-medium text-gray-900 dark:text-neutral-100"
              >
                {{ account.accountName }}
              </p>
              <p class="text-xs text-gray-400 dark:text-neutral-500">
                {{ account.bankName }} · ****{{
                  account.accountNumber.slice(-4)
                }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="account.isDefault"
              class="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint"
            >
              Default
            </span>
            <button
              v-else
              class="text-xs text-gray-400 hover:text-brand dark:text-neutral-500"
              @click="setDefault(account.id)"
            >
              Set default
            </button>
            <button
              class="rounded p-1 text-gray-300 hover:text-red-500 dark:text-neutral-600"
              title="Remove account"
              @click="removeAccount(account.id)"
            >
              <Icon name="mdi:trash-can-outline" size="16" />
            </button>
          </div>
        </div>
      </div>

      <BaseEmptyState
        v-else-if="!showAddBank"
        icon="mdi:bank-plus"
        title="No payout accounts yet"
        description="Add a bank account for this store to enable withdrawals."
        compact
      />

      <!-- Add form -->
      <div
        v-if="showAddBank"
        class="border-t border-gray-100 p-4 dark:border-neutral-800"
      >
        <p
          class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100"
        >
          Add bank account
        </p>
        <div class="space-y-3">
          <BaseSelect
            v-model="newBank.bankCode"
            label="Bank"
            placeholder="Select bank"
            :options="bankOptions"
          />
          <BaseInput
            v-model="newBank.accountNumber"
            label="Account number"
            maxlength="10"
            placeholder="10-digit account number"
          />
          <BaseInput
            v-model="newBank.accountName"
            label="Account name"
            placeholder="As it appears on your bank statement"
          />
          <div class="flex gap-2">
            <BaseButton
              variant="primary"
              size="sm"
              class="flex-1"
              :loading="savingBank"
              :disabled="savingBank || !canSaveBank"
              @click="saveBankAccount"
            >
              Save account
            </BaseButton>
            <BaseButton variant="secondary" size="sm" @click="showAddBank = false">
              Cancel
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <div
      class="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="border-b border-gray-100 p-4 dark:border-neutral-800">
        <h2
          class="font-display text-base font-bold text-gray-900 dark:text-neutral-100"
        >
          Transactions
        </h2>
      </div>

      <BaseEmptyState
        v-if="!transactions.length"
        icon="mdi:receipt-text-outline"
        title="No transactions yet"
        description="Payouts and earnings for this store will appear here."
        compact
      />

      <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="flex items-center justify-between p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full"
              :class="txIconBg(tx.type)"
            >
              <Icon :name="txIcon(tx.type)" size="20" :class="txColor(tx.type)" />
            </div>
            <div>
              <p
                class="text-sm font-medium text-gray-900 dark:text-neutral-100"
              >
                {{ tx.description }}
              </p>
              <div class="flex items-center gap-2">
                <p class="text-xs text-gray-500 dark:text-neutral-400">
                  {{ formatDate(tx.created_at) }}
                </p>
                <span
                  v-if="tx.type === 'CREDIT_PENDING'"
                  class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  PENDING
                </span>
              </div>
            </div>
          </div>
          <p class="font-display font-bold" :class="txColor(tx.type)">
            {{ TX_DEBIT_TYPES.has(tx.type) ? '-' : '+' }}{{ formatKobo(tx.amount) }}
          </p>
        </div>

        <div
          v-if="transactionsTotal > transactions.length"
          class="p-3 text-center"
        >
          <button
            class="text-[12px] font-semibold text-brand hover:underline disabled:opacity-50"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading…' : 'Load more' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Withdraw modal — scoped to this store -->
    <WithdrawModal
      v-if="showWithdraw"
      :balance="wallet.balance"
      :pending-balance="wallet.pendingBalance"
      :store-slug="storeSlug"
      :seller-id="wallet.storeId"
      @close="showWithdraw = false"
      @success="onWithdrawSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import WithdrawModal from '~~/layers/profile/app/components/profile/modals/WithdrawModal.vue'
import { useWalletApi } from '~~/layers/commerce/app/services/wallet.api'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

const route = useRoute()
const storeSlug = computed(() => String(route.params.storeSlug || ''))

const api = useWalletApi()
const { formatKobo } = useCurrency()

// ── Store wallet ──────────────────────────────────────────────────────────────
const wallet = reactive({
  storeId: '',
  storeName: '',
  balance: 0,
  pendingBalance: 0,
  totalEarned: 0,
  totalSpent: 0,
})
const storeName = computed(() => wallet.storeName)

const loadWallet = async () => {
  try {
    const res: any = await api.getStoreWallet(storeSlug.value)
    const w = res?.data
    if (w) {
      wallet.storeId = w.storeId ?? ''
      wallet.storeName = w.storeName ?? ''
      wallet.balance = w.balance ?? 0
      wallet.pendingBalance = w.pendingBalance ?? 0
      wallet.totalEarned = w.totalEarned ?? 0
      wallet.totalSpent = w.totalSpent ?? 0
    }
  } catch {
    /* handled by empty state */
  }
}

// ── Transactions ────────────────────────────────────────────────────────────
const transactions = ref<any[]>([])
const transactionsTotal = ref(0)
const loadingMore = ref(false)

const loadTransactions = async (offset = 0) => {
  const res: any = await api.getTransactions({
    limit: 20,
    offset,
    storeSlug: storeSlug.value,
  })
  if (offset === 0) {
    transactions.value = res?.data?.transactions ?? []
  } else {
    transactions.value = [...transactions.value, ...(res?.data?.transactions ?? [])]
  }
  transactionsTotal.value = res?.data?.total ?? 0
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    await loadTransactions(transactions.value.length)
  } finally {
    loadingMore.value = false
  }
}

// ── Payout accounts ─────────────────────────────────────────────────────────
const bankAccounts = ref<any[]>([])
const showAddBank = ref(false)
const savingBank = ref(false)
const newBank = reactive({ bankCode: '', accountNumber: '', accountName: '' })

const loadBankAccounts = async () => {
  try {
    const res: any = await api.getBankAccounts(storeSlug.value)
    bankAccounts.value = res?.data ?? []
  } catch {
    bankAccounts.value = []
  }
}

const canSaveBank = computed(
  () =>
    !!newBank.bankCode &&
    newBank.accountNumber.length === 10 &&
    newBank.accountName.trim().length > 1,
)

const saveBankAccount = async () => {
  const bank = NIGERIAN_BANKS.find((b) => b.code === newBank.bankCode)
  if (!bank || !wallet.storeId) return
  savingBank.value = true
  try {
    const res: any = await api.addBankAccount({
      sellerId: wallet.storeId,
      bankName: bank.name,
      bankCode: bank.code,
      accountNumber: newBank.accountNumber,
      accountName: newBank.accountName,
      isDefault: bankAccounts.value.length === 0,
    })
    bankAccounts.value.push(res.data)
    showAddBank.value = false
    newBank.bankCode = ''
    newBank.accountNumber = ''
    newBank.accountName = ''
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to save account')
  } finally {
    savingBank.value = false
  }
}

const setDefault = async (id: string) => {
  try {
    await api.setDefaultBankAccount(id)
    bankAccounts.value.forEach((a) => (a.isDefault = a.id === id))
  } catch {
    /* no-op */
  }
}

const removeAccount = async (id: string) => {
  if (!confirm('Remove this bank account?')) return
  try {
    await api.deleteBankAccount(id)
    bankAccounts.value = bankAccounts.value.filter((a) => a.id !== id)
  } catch {
    /* no-op */
  }
}

const onWithdrawSuccess = async () => {
  showWithdraw.value = false
  await Promise.all([loadWallet(), loadTransactions(0)])
}

const showWithdraw = ref(false)

// ── Transaction display helpers ───────────────────────────────────────────────
const TX_DEBIT_TYPES = new Set(['DEBIT', 'PLATFORM_FEE_DEBIT'])
const TX_PENDING_TYPES = new Set(['CREDIT_PENDING'])
const TX_REFUND_TYPES = new Set(['PLATFORM_FEE_REFUND'])

const txIconBg = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'bg-red-100 dark:bg-red-900/20'
  if (TX_PENDING_TYPES.has(type)) return 'bg-amber-100 dark:bg-amber-900/20'
  if (TX_REFUND_TYPES.has(type)) return 'bg-blue-100 dark:bg-blue-900/20'
  return 'bg-mint/10'
}
const txIcon = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'mdi:arrow-up'
  if (TX_PENDING_TYPES.has(type)) return 'mdi:clock-outline'
  if (TX_REFUND_TYPES.has(type)) return 'mdi:arrow-u-left-top'
  return 'mdi:arrow-down'
}
const txColor = (type: string) => {
  if (TX_DEBIT_TYPES.has(type)) return 'text-red-600 dark:text-red-400'
  if (TX_PENDING_TYPES.has(type)) return 'text-amber-600 dark:text-amber-400'
  if (TX_REFUND_TYPES.has(type)) return 'text-blue-600 dark:text-blue-400'
  return 'text-mint'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Guaranty Trust Bank (GTB)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '100004' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

const bankOptions = NIGERIAN_BANKS.map((b) => ({ label: b.name, value: b.code }))

onMounted(async () => {
  await loadWallet()
  await Promise.all([loadTransactions(0), loadBankAccounts()])
})

watch(storeSlug, async (slug, prev) => {
  if (slug && slug !== prev) {
    await loadWallet()
    await Promise.all([loadTransactions(0), loadBankAccounts()])
  }
})
</script>
