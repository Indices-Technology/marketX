/**
 * Partner lead service — partnership applications and API waitlist signups
 * submitted from the public /partners page.
 */

import type { PartnerLeadStatus, PartnerLeadType } from '@prisma/client'
import { partnerLeadRepository } from '../repositories/partnerLead.repository'
import { emailQueue } from '~~/server/queues/email.queue'

export interface SubmitLeadInput {
  type: PartnerLeadType
  contactName: string
  email: string
  phone?: string | null
  company: string
  website?: string | null
  role?: string | null
  useCase: string
  expectedVolume?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

const TYPE_LABEL: Record<PartnerLeadType, string> = {
  PARTNERSHIP: 'Partnership',
  API: 'API access',
}

export const partnerLeadService = {
  async submit(input: SubmitLeadInput) {
    const email = input.email.trim().toLowerCase()

    const lead = await partnerLeadRepository.upsert({
      type: input.type,
      email,
      contactName: input.contactName.trim(),
      phone: input.phone?.trim() || null,
      company: input.company.trim(),
      website: input.website?.trim() || null,
      role: input.role?.trim() || null,
      useCase: input.useCase.trim(),
      expectedVolume: input.expectedVolume?.trim() || null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
    })

    notify(lead.id, input, email)

    return lead
  },

  list(params: {
    type?: PartnerLeadType
    status?: PartnerLeadStatus
    limit: number
    offset: number
  }) {
    return Promise.all([
      partnerLeadRepository.list(params),
      partnerLeadRepository.count({ type: params.type, status: params.status }),
    ]).then(([items, total]) => ({ items, total }))
  },

  updateStatus(id: string, status: PartnerLeadStatus, notes?: string) {
    return partnerLeadRepository.updateStatus(id, status, notes)
  },
}

/**
 * Fire-and-forget: a mail failure must not fail the applicant's submission —
 * the lead row is already saved, which is the part that matters. Both sends are
 * dedupe-keyed on the lead id so a re-submit (which upserts the same row)
 * doesn't re-notify while the first job is still in flight.
 */
function notify(leadId: string, input: SubmitLeadInput, email: string) {
  const cfg = useRuntimeConfig()
  const siteName = cfg.public.siteName || 'MarketX'
  const desk = cfg.public.partnersEmail
  const label = TYPE_LABEL[input.type]

  const rows = [
    ['Type', label],
    ['Company', input.company],
    ['Contact', `${input.contactName}${input.role ? ` — ${input.role}` : ''}`],
    ['Email', email],
    ['Phone', input.phone || '—'],
    ['Website', input.website || '—'],
    ['Expected volume', input.expectedVolume || '—'],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(String(v))}</strong></td></tr>`,
    )
    .join('')

  emailQueue.enqueue(
    {
      to: desk,
      // Reply goes straight to the applicant — the desk should never have to
      // copy an address out of the body to answer.
      replyTo: email,
      subject: `${label} request — ${input.company}`,
      html: `<h2 style="font-family:sans-serif">New ${label.toLowerCase()} request</h2>
<table style="font-family:sans-serif;font-size:14px">${rows}</table>
<p style="font-family:sans-serif;font-size:14px"><strong>Use case</strong><br>${escapeHtml(input.useCase).replace(/\n/g, '<br>')}</p>`,
      type: 'GENERAL',
    },
    { dedupeKey: `partner-lead:desk:${leadId}` },
  )

  emailQueue.enqueue(
    {
      to: email,
      replyTo: desk,
      subject: `We received your ${label.toLowerCase()} request — ${siteName}`,
      html: `<p style="font-family:sans-serif;font-size:14px">Hi ${escapeHtml(input.contactName)},</p>
<p style="font-family:sans-serif;font-size:14px">Thanks for your interest in ${
        input.type === 'API'
          ? `the ${siteName} API`
          : `partnering with ${siteName}`
      }. We have your request for <strong>${escapeHtml(input.company)}</strong> and the team reviews these in the order they arrive.</p>
<p style="font-family:sans-serif;font-size:14px">If we need more detail before deciding, we'll reply to this address. You can reach us any time at ${desk}.</p>
<p style="font-family:sans-serif;font-size:14px">— The ${siteName} team</p>`,
      type: 'GENERAL',
    },
    { dedupeKey: `partner-lead:ack:${leadId}` },
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
