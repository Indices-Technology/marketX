import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export interface BuyerWalletResponse {
  success: boolean
  data: {
    wallet: { id: string; balance: number }
    stats: { totalEarned: number; totalSpent: number }
  }
}

export interface BuyerTransactionsResponse {
  success: boolean
  data: {
    transactions: Array<{
      id: string
      amount: number
      type: string
      description: string
      orderId: number | null
      created_at: string
    }>
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export class BuyerWalletApiClient extends BaseApiClient {
  getWallet(): Promise<BuyerWalletResponse> {
    return this.request('/api/commerce/buyer-wallet', { method: 'GET' })
  }

  getTransactions(params?: { limit?: number; offset?: number }): Promise<BuyerTransactionsResponse> {
    const query = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/commerce/buyer-wallet/transactions${query}`, { method: 'GET' })
  }
}

let instance: BuyerWalletApiClient | null = null
export const useBuyerWalletApi = () => {
  if (!instance) instance = new BuyerWalletApiClient()
  return instance
}
