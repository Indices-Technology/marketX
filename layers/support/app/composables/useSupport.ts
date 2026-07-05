/**
 * Client access to the support API. See docs/SUPPORT.md.
 */

import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export type SupportCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'ACCOUNT'
  | 'SELLER'
  | 'PRODUCT'
  | 'REFUND'
  | 'OTHER'

export interface CreateTicketPayload {
  subject: string
  message: string
  category: SupportCategory
  email?: string
  orderId?: number
  productId?: number
  sellerId?: string
  source?: 'WEB' | 'EMAIL' | 'CHECKOUT' | 'ORDER'
}

// All calls go through BaseApiClient so they carry the Bearer token + CSRF
// header (and get the shared 401-refresh/error handling). Raw $fetch does NOT
// attach auth, which is why the agent queue / create-ticket calls 401'd.
class SupportApiClient extends BaseApiClient {
  createTicket(payload: CreateTicketPayload) {
    return this.request('/api/support/tickets', { method: 'POST', body: payload })
  }
  listMyTickets(params: { status?: string; limit?: number; offset?: number } = {}) {
    return this.request('/api/support/tickets', { params: this.cleanParams(params) })
  }
  getTicket(id: string) {
    return this.request(`/api/support/tickets/${id}`)
  }
  reply(id: string, body: string, attachments?: Array<{ url: string; name: string }>) {
    return this.request(`/api/support/tickets/${id}/messages`, {
      method: 'POST',
      body: { body, attachments },
    })
  }
  closeTicket(id: string) {
    return this.request(`/api/support/tickets/${id}/close`, { method: 'POST' })
  }
  openDispute(orderId: number, payload: { message: string; category?: SupportCategory }) {
    return this.request(`/api/support/orders/${orderId}/dispute`, {
      method: 'POST',
      body: payload,
    })
  }
  // ── Agent ──────────────────────────────────────────────────────────────────
  agentListQueue(params: Record<string, string | number | boolean> = {}) {
    return this.request('/api/support/agent/tickets', { params: this.cleanParams(params) })
  }
  agentUpdate(id: string, patch: Record<string, unknown>) {
    return this.request(`/api/support/agent/tickets/${id}`, { method: 'PATCH', body: patch })
  }
  agentReply(id: string, payload: { body: string; internalNote?: boolean }) {
    return this.request(`/api/support/agent/tickets/${id}/reply`, { method: 'POST', body: payload })
  }
  agentResolve(
    id: string,
    payload: { resolution: string; disputeOutcome?: string; refundAmount?: number },
  ) {
    return this.request(`/api/support/agent/tickets/${id}/resolve`, { method: 'POST', body: payload })
  }
}

let client: SupportApiClient | null = null
const getClient = () => (client ??= new SupportApiClient())

export function useSupport() {
  const c = getClient()
  return {
    createTicket: (payload: CreateTicketPayload) => c.createTicket(payload),
    listMyTickets: (params: { status?: string; limit?: number; offset?: number } = {}) =>
      c.listMyTickets(params),
    getTicket: (id: string) => c.getTicket(id),
    reply: (id: string, body: string, attachments?: Array<{ url: string; name: string }>) =>
      c.reply(id, body, attachments),
    closeTicket: (id: string) => c.closeTicket(id),
    openDispute: (orderId: number, payload: { message: string; category?: SupportCategory }) =>
      c.openDispute(orderId, payload),
    agent: {
      listQueue: (params: Record<string, string | number | boolean> = {}) =>
        c.agentListQueue(params),
      update: (id: string, patch: Record<string, unknown>) => c.agentUpdate(id, patch),
      reply: (id: string, payload: { body: string; internalNote?: boolean }) =>
        c.agentReply(id, payload),
      resolve: (
        id: string,
        payload: { resolution: string; disputeOutcome?: string; refundAmount?: number },
      ) => c.agentResolve(id, payload),
    },
  }
}

// ── Shared display helpers ─────────────────────────────────────────────────────

export const SUPPORT_STATUS_META: Record<
  string,
  { label: string; variant: string }
> = {
  OPEN: { label: 'Open', variant: 'info' },
  IN_PROGRESS: { label: 'In progress', variant: 'brand' },
  PENDING_USER: { label: 'Awaiting you', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'muted' },
}

export const SUPPORT_PRIORITY_META: Record<
  string,
  { label: string; variant: string }
> = {
  LOW: { label: 'Low', variant: 'muted' },
  NORMAL: { label: 'Normal', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  URGENT: { label: 'Urgent', variant: 'danger' },
}

export const ticketRef = (n: number) => `MX-${n}`
