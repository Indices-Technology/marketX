import { BaseApiClient } from "~~/layers/core/app/services/base.api"

export class OrderApiClient extends BaseApiClient {
  async getOrders(params?: { limit?: number; offset?: number }) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.request(`/api/commerce/orders${query}`, { method: 'GET' })
  }
  async getOrderById(id: number) {
    return this.request(`/api/commerce/orders/${id}`, { method: 'GET' })
  }
  async placeOrder(data: Record<string, unknown>) {
    return this.request('/api/commerce/orders', { method: 'POST', body: data })
  }
  async cancelOrder(id: number) {
    return this.request(`/api/commerce/orders/${id}/cancel`, { method: 'POST' })
  }
  async initializePayment(data: Record<string, unknown>): Promise<{
    success: boolean
    data: { purchaseGroupId: string; orderIds: number[]; reference: string; authorizationUrl: string; accessCode: string }
  }> {
    return this.request('/api/commerce/payments/initialize', {
      method: 'POST',
      body: data,
    })
  }
  async verifyPayment(reference: string) {
    return this.request('/api/commerce/payments/verify', {
      method: 'POST',
      body: { reference },
    })
  }
  async getSellerOrders(
    storeSlug: string,
    params?: { status?: string; limit?: number; offset?: number },
  ) {
    const entries = Object.entries({ storeSlug, ...params })
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)] as [string, string])
    const q = new URLSearchParams(entries).toString()
    return this.request(`/api/commerce/orders/seller?${q}`, { method: 'GET' })
  }
  async updateOrderStatus(
    id: number,
    body: { status: string; trackingNumber?: string; shipper?: string },
  ) {
    return this.request(`/api/commerce/orders/${id}/status`, {
      method: 'PATCH',
      body,
    })
  }
  async initializePayPal(data: Record<string, unknown>): Promise<{
    success: boolean
    data: { purchaseGroupId: string; orderIds: number[]; paypalOrderId: string; approvalUrl: string; amountUSD: number }
  }> {
    return this.request('/api/commerce/payments/paypal/create', {
      method: 'POST',
      body: data,
    })
  }
  async capturePayPal(data: { paypalOrderId: string; orderId?: number }) {
    return this.request('/api/commerce/payments/paypal/capture', {
      method: 'POST',
      body: data,
    })
  }
  async confirmReceipt(id: number) {
    return this.request(`/api/commerce/orders/${id}/confirm-receipt`, {
      method: 'POST',
    })
  }
  async initializePOD(data: Record<string, unknown>): Promise<{
    success: boolean
    data: { purchaseGroupId: string; orderIds: number[]; reference: string; authorizationUrl: string; accessCode: string; shippingCost: number; productAmount: number }
  }> {
    return this.request('/api/commerce/payments/pod-initialize', {
      method: 'POST',
      body: data,
    })
  }
  async verifyPOD(reference: string) {
    return this.request('/api/commerce/payments/pod-verify', {
      method: 'POST',
      body: { reference },
    })
  }
  async confirmCash(id: number) {
    return this.request(`/api/commerce/orders/${id}/confirm-cash`, {
      method: 'POST',
    })
  }
  async refuseDelivery(id: number, reason?: string) {
    return this.request(`/api/commerce/orders/${id}/refuse-delivery`, {
      method: 'POST',
      body: { reason },
    })
  }
}

let instance: OrderApiClient | null = null
export const useOrderApi = () => {
  if (!instance) instance = new OrderApiClient()
  return instance
}
