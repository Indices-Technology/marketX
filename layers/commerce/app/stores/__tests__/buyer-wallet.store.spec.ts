import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBuyerWalletStore } from '../buyer-wallet.store'

describe('buyer-wallet.store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('initialises with zero balance', () => {
    const store = useBuyerWalletStore()
    expect(store.balance).toBe(0)
    expect(store.wallet).toBeNull()
    expect(store.stats.totalEarned).toBe(0)
    expect(store.stats.totalSpent).toBe(0)
    expect(store.transactions).toHaveLength(0)
  })

  it('setWallet updates balance and stats', () => {
    const store = useBuyerWalletStore()
    store.setWallet({ id: 'w1', balance: 50000 }, { totalEarned: 75000, totalSpent: 0 })
    expect(store.balance).toBe(50000)
    expect(store.stats.totalEarned).toBe(75000)
    expect(store.wallet?.id).toBe('w1')
  })

  it('setTransactions stores list and total', () => {
    const store = useBuyerWalletStore()
    const txs = [
      { id: 't1', amount: 30000, type: 'AFFILIATE_CREDIT', description: 'Order #1', orderId: 1, created_at: '2025-01-01' },
      { id: 't2', amount: 20000, type: 'AFFILIATE_CREDIT', description: 'Order #2', orderId: 2, created_at: '2025-01-02' },
    ]
    store.setTransactions(txs, 2)
    expect(store.transactions).toHaveLength(2)
    expect(store.transactionsTotal).toBe(2)
  })

  it('addTransactions appends without replacing', () => {
    const store = useBuyerWalletStore()
    const first = [{ id: 't1', amount: 10000, type: 'AFFILIATE_CREDIT', description: 'a', orderId: 1, created_at: '' }]
    const second = [{ id: 't2', amount: 5000, type: 'AFFILIATE_CREDIT', description: 'b', orderId: 2, created_at: '' }]
    store.setTransactions(first, 2)
    store.addTransactions(second)
    expect(store.transactions).toHaveLength(2)
    expect(store.transactions[1].id).toBe('t2')
  })

  it('setLoading and setError update state', () => {
    const store = useBuyerWalletStore()
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    store.setError('fetch failed')
    expect(store.error).toBe('fetch failed')
    store.setLoading(false)
    store.setError(null)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })
})
