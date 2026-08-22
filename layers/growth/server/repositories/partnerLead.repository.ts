/**
 * Partner lead repository — all Prisma access for the partnership / API waitlist.
 */

import { prisma } from '~~/server/utils/db'
import type { Prisma, PartnerLeadStatus, PartnerLeadType } from '@prisma/client'

/** Fields safe to hand back to the public form. Never `notes`. */
const publicSelect = {
  id: true,
  type: true,
  status: true,
  created_at: true,
} satisfies Prisma.PartnerLeadSelect

export const partnerLeadRepository = {
  /**
   * Upsert on (email, type) — a second submission from the same applicant is
   * the same lead with better information, not a new one. Status and notes are
   * deliberately left out of the update so a re-submit can't reset a lead we
   * have already contacted or rejected back to NEW.
   */
  upsert(
    data: Omit<Prisma.PartnerLeadCreateInput, 'type'> & {
      type: PartnerLeadType
    },
  ) {
    const { email, type, ...rest } = data
    return prisma.partnerLead.upsert({
      where: { email_type: { email, type } },
      create: { email, type, ...rest },
      update: rest,
      select: publicSelect,
    })
  },

  list(params: {
    type?: PartnerLeadType
    status?: PartnerLeadStatus
    limit: number
    offset: number
  }) {
    return prisma.partnerLead.findMany({
      where: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: params.limit,
      skip: params.offset,
    })
  },

  count(params: { type?: PartnerLeadType; status?: PartnerLeadStatus }) {
    return prisma.partnerLead.count({
      where: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    })
  },

  updateStatus(id: string, status: PartnerLeadStatus, notes?: string) {
    return prisma.partnerLead.update({
      where: { id },
      data: {
        status,
        ...(notes === undefined ? {} : { notes }),
        // Stamp the moment we first reached out, so "how long did this sit in
        // the queue" is answerable later without a separate audit trail.
        ...(status === 'CONTACTED' ? { contactedAt: new Date() } : {}),
      },
    })
  },
}
