/**
 * Support repository — all Prisma access for tickets + messages.
 */

import { prisma } from '~~/server/utils/db'
import type { Prisma } from '@prisma/client'

const ticketInclude = {
  requester: {
    select: { id: true, username: true, email: true, avatar: true },
  },
  assignedAgent: { select: { id: true, username: true, avatar: true } },
  seller: {
    select: {
      id: true,
      store_name: true,
      store_slug: true,
      store_logo: true,
      profileId: true,
    },
  },
  order: {
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      paymentMethod: true,
    },
  },
} satisfies Prisma.SupportTicketInclude

export const supportRepository = {
  createTicket(data: Prisma.SupportTicketCreateInput) {
    return prisma.supportTicket.create({ data, include: ticketInclude })
  },

  createMessage(data: Prisma.SupportMessageCreateInput) {
    return prisma.supportMessage.create({ data })
  },

  getTicketById(id: string) {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: {
        ...ticketInclude,
        messages: {
          orderBy: { created_at: 'asc' },
          include: {
            author: {
              select: { id: true, username: true, avatar: true, role: true },
            },
          },
        },
      },
    })
  },

  updateTicket(id: string, data: Prisma.SupportTicketUpdateInput) {
    return prisma.supportTicket.update({
      where: { id },
      data,
      include: ticketInclude,
    })
  },

  listByRequester(
    requesterId: string,
    opts: { status?: string; limit: number; offset: number },
  ) {
    const where: Prisma.SupportTicketWhereInput = { requesterId }
    if (opts.status) where.status = opts.status as never
    return prisma.supportTicket.findMany({
      where,
      include: ticketInclude,
      orderBy: { lastMessageAt: 'desc' },
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  countOpenByRequester(requesterId: string) {
    return prisma.supportTicket.count({
      where: {
        requesterId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_USER'] },
      },
    })
  },

  listForAgent(opts: {
    status?: string
    priority?: string
    type?: string
    assignedAgentId?: string
    unassigned?: boolean
    limit: number
    offset: number
  }) {
    const where: Prisma.SupportTicketWhereInput = {}
    if (opts.status) where.status = opts.status as never
    if (opts.priority) where.priority = opts.priority as never
    if (opts.type) where.type = opts.type as never
    if (opts.assignedAgentId) where.assignedAgentId = opts.assignedAgentId
    if (opts.unassigned) where.assignedAgentId = null
    return prisma.supportTicket.findMany({
      where,
      include: ticketInclude,
      // Open + urgent first, then oldest-waiting
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { created_at: 'asc' }],
      take: opts.limit + 1,
      skip: opts.offset,
    })
  },

  countForAgent(where: Prisma.SupportTicketWhereInput) {
    return prisma.supportTicket.count({ where })
  },

  /** An already-open dispute on the same order by the same buyer (dedupe). */
  findOpenDisputeForOrder(orderId: number, requesterId: string) {
    return prisma.supportTicket.findFirst({
      where: {
        orderId,
        requesterId,
        type: 'DISPUTE',
        status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_USER'] },
      },
    })
  },
}
