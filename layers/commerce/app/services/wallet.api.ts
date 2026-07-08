import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export interface BankAccount {
  type?: string
  account_number: string
  bank_code: string
  name: string
  [key: string]: string | undefined
}

interface WalletResponse {
  success: boolean
  data: {
    wallet: { balance: number; pending_balance: number; [key: string]: unknown }
    stats: { totalEarned: number; totalSpent: number }
    stores: Array<{ id: string; balance: number; [key: string]: unknown }>
  }
}

interface TransactionsResponse {
  success: boolean
  data: {
    transactions: Array<{ id: string; amount: number; type: string; [key: string]: unknown }>
    total: number
  }
}

export class WalletApiClient extends BaseApiClient {
  async getWallet(): Promise<WalletResponse> {
    return this.request('/api/commerce/wallet', { method: 'GET' })
  }

  async getTransactions(params?: { limit?: number; offset?: number; storeSlug?: string }): Promise<TransactionsResponse> {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/commerce/wallet/transactions${query}`, {
      method: 'GET',
    })
  }

  async getStoreWallet(storeSlug: string) {
    return this.request(`/api/commerce/wallet/store/${storeSlug}`, {
      method: 'GET',
    })
  }

  async addFunds(amount: number) {
    return this.request('/api/commerce/wallet/add-funds', {
      method: 'POST',
      body: { amount },
    })
  }

  // storeSlug scopes the withdrawal to a specific store's wallet (per-store
  // finance page). Omitted on the legacy profile path.
  async withdraw(amount: number, bankAccount: BankAccount, storeSlug?: string) {
    return this.request('/api/commerce/wallet/withdraw', {
      method: 'POST',
      body: { amount, bankAccount, ...(storeSlug ? { storeSlug } : {}) },
    })
  }

  // ── Payout (bank) accounts — per store ────────────────────────────────────
  async getBankAccounts(storeSlug?: string) {
    const q = storeSlug ? `?storeSlug=${encodeURIComponent(storeSlug)}` : ''
    return this.request(`/api/seller/bank-accounts${q}`, { method: 'GET' })
  }

  async addBankAccount(payload: {
    sellerId: string
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
    isDefault?: boolean
  }) {
    return this.request('/api/seller/bank-accounts', {
      method: 'POST',
      body: payload,
    })
  }

  async setDefaultBankAccount(id: string) {
    return this.request(`/api/seller/bank-accounts/${id}/set-default`, {
      method: 'PATCH',
    })
  }

  async deleteBankAccount(id: string) {
    return this.request(`/api/seller/bank-accounts/${id}`, { method: 'DELETE' })
  }
}

let instance: WalletApiClient | null = null
export const useWalletApi = () => {
  if (!instance) instance = new WalletApiClient()
  return instance
}
