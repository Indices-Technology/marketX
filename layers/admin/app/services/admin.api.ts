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
  getUsers(params: { search?: string; limit?: number; offset?: number }) {
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

  // ── Content moderation (inline, from any page) ───────────────────────────────
  moderateContent(type: 'POST' | 'PRODUCT' | 'COMMENT', id: string, status: 'ACTIVE' | 'HIDDEN' | 'REMOVED' | 'FLAGGED') {
    return this.request<any>(`/api/admin/content/${type}/${id}/moderate`, { method: 'PATCH', body: { status } })
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
