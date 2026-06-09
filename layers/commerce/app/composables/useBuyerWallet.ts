import { useBuyerWalletApi } from '../services/buyer-wallet.api'
import { useBuyerWalletStore } from '../stores/buyer-wallet.store'
import { extractErrorMessage } from '~~/layers/core/app/utils/errors'

export const useBuyerWallet = () => {
  const api = useBuyerWalletApi()
  const store = useBuyerWalletStore()

  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)
  const balance = computed(() => store.balance)
  const stats = computed(() => store.stats)
  const transactions = computed(() => store.transactions)
  const transactionsTotal = computed(() => store.transactionsTotal)

  const fetchWallet = async () => {
    store.setLoading(true)
    store.setError(null)
    try {
      const result = await api.getWallet()
      store.setWallet(result.data.wallet, result.data.stats)
      return result.data
    } catch (e: unknown) {
      store.setError(extractErrorMessage(e, 'Failed to fetch wallet'))
      throw e
    } finally {
      store.setLoading(false)
    }
  }

  const fetchTransactions = async (limit = 20, offset = 0) => {
    store.setLoading(true)
    store.setError(null)
    try {
      const result = await api.getTransactions({ limit, offset })
      if (offset === 0) {
        store.setTransactions(result.data.transactions, result.data.total)
      } else {
        store.addTransactions(result.data.transactions)
      }
      return result.data
    } catch (e: unknown) {
      store.setError(extractErrorMessage(e, 'Failed to fetch transactions'))
      throw e
    } finally {
      store.setLoading(false)
    }
  }

  return {
    isLoading,
    error,
    balance,
    stats,
    transactions,
    transactionsTotal,
    fetchWallet,
    fetchTransactions,
  }
}
