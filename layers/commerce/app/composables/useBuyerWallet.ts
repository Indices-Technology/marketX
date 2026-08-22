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

  /**
   * Cash out affiliate commission.
   *
   * `amount` is the GROSS in kobo: fees are deducted from it, so the bank
   * receives the returned `breakdown.net`. Refetches the wallet afterwards so
   * the balance on screen reflects the debit immediately rather than after a
   * page change.
   */
  const withdraw = async (
    amount: number,
    bankAccount: { account_number: string; bank_code: string; name: string },
  ) => {
    store.setLoading(true)
    store.setError(null)
    try {
      const result = await api.withdraw({ amount, bankAccount })
      await fetchWallet()
      await fetchTransactions()
      return result.data
    } catch (e: unknown) {
      store.setError(extractErrorMessage(e, 'Withdrawal failed'))
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
    withdraw,
  }
}
