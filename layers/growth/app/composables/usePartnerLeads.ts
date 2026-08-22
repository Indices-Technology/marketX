/**
 * Client access to the partnership / API-waitlist API.
 *
 * Goes through BaseApiClient like every other data call in the app — the submit
 * endpoint is public, but routing it here keeps the CSRF header, the shared
 * error handling, and the "components never call $fetch directly" rule intact.
 */

import { BaseApiClient } from '~~/layers/core/app/services/base.api'

export type PartnerLeadType = 'PARTNERSHIP' | 'API'
export type PartnerLeadStatus = 'NEW' | 'CONTACTED' | 'APPROVED' | 'REJECTED'

export interface SubmitLeadPayload {
  type: PartnerLeadType
  contactName: string
  email: string
  phone?: string
  company: string
  website?: string
  role?: string
  useCase: string
  expectedVolume?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  /** Honeypot — always submitted empty by real users. */
  companyFax?: string
}

export interface PartnerLeadDTO {
  id: string
  type: PartnerLeadType
  status: PartnerLeadStatus
  created_at: string
}

class PartnerLeadApiClient extends BaseApiClient {
  submit(payload: SubmitLeadPayload) {
    return this.request('/api/partners/leads', {
      method: 'POST',
      body: payload,
    }) as Promise<{ success: boolean; data: PartnerLeadDTO | null }>
  }

  list(
    params: {
      type?: PartnerLeadType
      status?: PartnerLeadStatus
      limit?: number
      offset?: number
    } = {},
  ) {
    return this.request('/api/partners/leads', {
      params: this.cleanParams(params),
    })
  }

  updateStatus(id: string, status: PartnerLeadStatus, notes?: string) {
    return this.request(`/api/partners/leads/${id}`, {
      method: 'PATCH',
      body: { status, notes },
    })
  }
}

let client: PartnerLeadApiClient | null = null
const getClient = () => (client ??= new PartnerLeadApiClient())

export function usePartnerLeads() {
  const c = getClient()
  return {
    submit: (payload: SubmitLeadPayload) => c.submit(payload),
    list: (
      params: {
        type?: PartnerLeadType
        status?: PartnerLeadStatus
        limit?: number
        offset?: number
      } = {},
    ) => c.list(params),
    updateStatus: (id: string, status: PartnerLeadStatus, notes?: string) =>
      c.updateStatus(id, status, notes),
  }
}

/** Self-reported volume bands. Free text in the DB, fixed choices in the UI. */
export const VOLUME_BANDS = [
  'Just exploring',
  'Under 100 orders/mo',
  '100–1,000 orders/mo',
  '1,000–10,000 orders/mo',
  '10,000+ orders/mo',
] as const
