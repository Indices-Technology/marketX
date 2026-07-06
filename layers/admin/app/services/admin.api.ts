import { BaseApiClient } from '~~/layers/core/app/services/base.api'

class AdminApiClient extends BaseApiClient {
  // ── Stats ────────────────────────────────────────────────────────────────────
  getStats() {
    return this.request<any>('/api/admin/stats')
  }

  // ── Reports ──────────────────────────────────────────────────────────────────
  getReports(params: { status?: string; contentType?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/reports', { params: this.cleanParams(params) })
  }

  resolveReport(id: string, body: { action: string; note?: string }) {
    return this.request<any>(`/api/admin/reports/${id}/resolve`, { method: 'POST', body })
  }

  // ── Users ────────────────────────────────────────────────────────────────────
  getUsers(params: { search?: string; status?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/users', { params: this.cleanParams(params) })
  }

  suspendUser(id: string, body: { reason: string; durationDays?: number }) {
    return this.request<any>(`/api/admin/users/${id}/suspend`, { method: 'POST', body })
  }

  unsuspendUser(id: string) {
    return this.request<any>(`/api/admin/users/${id}/unsuspend`, { method: 'POST' })
  }

  toggleUserActive(id: string, isActive: boolean) {
    return this.request<any>(`/api/admin/users/${id}/toggle`, { method: 'PATCH', body: { isActive } })
  }

  setUserRole(id: string, role: 'user' | 'moderator' | 'admin' | 'support_agent') {
    return this.request<any>(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } })
  }

  // ── Sellers ──────────────────────────────────────────────────────────────────
  getSellers(params: { search?: string; status?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/sellers', { params: this.cleanParams(params) })
  }

  verifySeller(id: string, status: 'VERIFIED' | 'REJECTED') {
    return this.request<any>(`/api/admin/sellers/${id}/verify`, { method: 'POST', body: { status } })
  }

  getSellerDocuments(id: string) {
    return this.request<any>(`/api/admin/sellers/${id}/documents`)
  }

  // ── Payouts ──────────────────────────────────────────────────────────────────
  getPayouts(params: { status?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/payouts', { params: this.cleanParams(params) })
  }

  processPayout(id: string, body: { action: 'PAID' | 'REJECTED'; transactionRef?: string }) {
    return this.request<any>(`/api/admin/payouts/${id}/process`, { method: 'POST', body })
  }

  // ── Squares ──────────────────────────────────────────────────────────────────
  getSquares(params: { status?: string; type?: string; search?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/squares', { params: this.cleanParams(params) })
  }

  setSquareStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.request<any>(`/api/admin/squares/${id}/status`, { method: 'POST', body: { status } })
  }

  // Create/update/delete reuse the admin-gated square endpoints (by slug).
  createSquare(body: Record<string, unknown>) {
    return this.request<any>('/api/squares', { method: 'POST', body })
  }

  updateSquare(slug: string, body: Record<string, unknown>) {
    return this.request<any>(`/api/squares/${slug}`, { method: 'PATCH', body })
  }

  deleteSquare(slug: string) {
    return this.request<any>(`/api/squares/${slug}`, { method: 'DELETE' })
  }

  // ── Finance / Orders ─────────────────────────────────────────────────────────
  getFinance(params: { days?: number } = {}) {
    return this.request<any>('/api/admin/finance', { params: this.cleanParams(params) })
  }

  getOrders(params: { paymentStatus?: string; search?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/orders', { params: this.cleanParams(params) })
  }

  // ── Content moderation (inline, from any page) ───────────────────────────────
  moderateContent(type: 'POST' | 'PRODUCT' | 'COMMENT', id: string, status: 'ACTIVE' | 'HIDDEN' | 'REMOVED' | 'FLAGGED') {
    return this.request<any>(`/api/admin/content/${type}/${id}/moderate`, { method: 'PATCH', body: { status } })
  }

  // ── Categories ───────────────────────────────────────────────────────────────
  getAdminCategories() {
    return this.request<any>('/api/admin/categories')
  }

  createCategory(body: { name: string; slug: string; thumbnailCatUrl?: string }) {
    return this.request<any>('/api/admin/categories', { method: 'POST', body })
  }

  updateCategory(id: number, body: Record<string, unknown>) {
    return this.request<any>(`/api/admin/categories/${id}`, { method: 'PATCH', body })
  }

  deleteCategory(id: number) {
    return this.request<any>(`/api/admin/categories/${id}`, { method: 'DELETE' })
  }

  // ── Broadcast / announcements ────────────────────────────────────────────────
  getBroadcastAudience() {
    return this.request<any>('/api/admin/broadcast')
  }

  sendBroadcast(body: { message: string; target: 'all' | 'sellers' | 'buyers' }) {
    return this.request<any>('/api/admin/broadcast', { method: 'POST', body })
  }

  // ── Audit logs ───────────────────────────────────────────────────────────────
  getAuditLogs(params: { eventType?: string; userId?: string; limit?: number; offset?: number }) {
    return this.request<any>('/api/admin/audit-logs', { params: this.cleanParams(params) })
  }

  // ── Public reports (any authenticated user) ──────────────────────────────────
  submitReport(body: { contentType: string; contentId: string; reason: string; note?: string }) {
    return this.request<any>('/api/reports', { method: 'POST', body })
  }
}

let _instance: AdminApiClient | null = null

export function useAdminApi() {
  if (!_instance) _instance = new AdminApiClient()
  return _instance
}
