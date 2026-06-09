interface BuyerWalletData {
  id: string
  balance: number
}

interface BuyerWalletStats {
  totalEarned: number
  totalSpent: number
}

interface BuyerTransaction {
  id: string
  amount: number
  type: string
  description: string
  orderId: number | null
  created_at: string
}

export const useBuyerWalletStore = defineStore('buyer-wallet', () => {
  const wallet = ref<BuyerWalletData | null>(null)
  const stats = ref<BuyerWalletStats>({ totalEarned: 0, totalSpent: 0 })
  const transactions = ref<BuyerTransaction[]>([])
  const transactionsTotal = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const balance = computed(() => wallet.value?.balance ?? 0)

  return {
    wallet,
    stats,
    transactions,
    transactionsTotal,
    isLoading,
    error,
    balance,
    setWallet: (w: BuyerWalletData, s: BuyerWalletStats) => {
      wallet.value = w
      stats.value = s
    },
    setTransactions: (t: BuyerTransaction[], total: number) => {
      transactions.value = t
      transactionsTotal.value = total
    },
    addTransactions: (t: BuyerTransaction[]) => {
      transactions.value = [...transactions.value, ...t]
    },
    setLoading: (val: boolean) => { isLoading.value = val },
    setError: (val: string | null) => { error.value = val },
  }
})
