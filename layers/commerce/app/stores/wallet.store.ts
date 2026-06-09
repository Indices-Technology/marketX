interface WalletData {
  balance: number
  pending_balance: number
  [key: string]: unknown
}

interface WalletStats {
  totalEarned: number
  totalSpent: number
}

interface StoreWalletData {
  id: string
  balance: number
  [key: string]: unknown
}

interface WalletTransaction {
  id: string
  amount: number
  type: string
  [key: string]: unknown
}

export const useWalletStore = defineStore('wallet', () => {
  const wallet = ref<WalletData | null>(null)
  const stats = ref<WalletStats>({ totalEarned: 0, totalSpent: 0 })
  const storeWallets = ref<StoreWalletData[]>([])
  const transactions = ref<WalletTransaction[]>([])
  const transactionsTotal = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const balance = computed(() => wallet.value?.balance ?? 0)
  const pendingBalance = computed(() => wallet.value?.pending_balance ?? 0)

  return {
    wallet,
    stats,
    storeWallets,
    transactions,
    transactionsTotal,
    isLoading,
    error,
    balance,
    pendingBalance,
    setWallet: (w: WalletData, s: WalletStats, stores?: StoreWalletData[]) => {
      wallet.value = w
      stats.value = s
      storeWallets.value = stores ?? []
    },
    setTransactions: (t: WalletTransaction[], total: number) => {
      transactions.value = t
      transactionsTotal.value = total
    },
    addTransactions: (t: WalletTransaction[]) => {
      transactions.value = [...transactions.value, ...t]
    },
    setLoading: (val: boolean) => {
      isLoading.value = val
    },
    setError: (val: string | null) => {
      error.value = val
    },
  }
})
