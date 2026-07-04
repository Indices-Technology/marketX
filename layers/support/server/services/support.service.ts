/**
 * Support service — orchestrates tickets, threads, and dispute rulings.
 * See docs/SUPPORT.md.
 */

import { prisma } from '~~/server/utils/db'
import type { Prisma } from '@prisma/client'
import { UserError } from '~~/layers/profile/server/types/user.types'
import { notificationQueue } from '~~/server/queues/notification.queue'
import { emailQueue } from '~~/server/queues/email.queue'
import {
  buildSupportTicketCreatedEmail,
  buildSupportReplyEmail,
} from '~~/server/utils/email/emailService'
import { walletService } from '~~/layers/commerce/server/services/wallet.service'
import { orderRepository } from '~~/layers/commerce/server/repositories/order.repository'
import { supportRepository } from '../repositories/support.repository'
import {
  canTransition,
  categoryToPriority,
  ticketRef,
  isOpenStatus,
  MAX_OPEN_TICKETS,
  type SupportCategory,
  type SupportStatus,
  type SupportPriority,
  type SupportTicketType,
  type SupportSource,
  type DisputeOutcome,
} from '../utils/types'

const SUPPORT_REPLY_TO = process.env.SUPPORT_EMAIL || 'support@marketx.app'

type TicketWithParties = Awaited<
  ReturnType<typeof supportRepository.getTicketById>
>

/** Fan a notification out to every support agent + admin. */
async function notifyAgents(message: string, orderId?: number) {
  const agents = await prisma.profile.findMany({
    where: { role: { in: ['support_agent', 'admin'] }, isActive: true },
    select: { id: true },
    take: 50,
  })
  for (const a of agents) {
    notificationQueue.enqueue({
      userId: a.id,
      type: 'SUPPORT',
      message,
      orderId,
    })
  }
}

export const supportService = {
  // ── Requester actions ──────────────────────────────────────────────────────

  async createTicket(input: {
    requesterId?: string | null
    guestEmail?: string | null
    subject: string
    message: string
    category: SupportCategory
    type?: SupportTicketType
    source?: SupportSource
    orderId?: number | null
    productId?: number | null
    sellerId?: string | null
  }) {
    if (!input.requesterId && !input.guestEmail)
      throw new UserError(
        'NO_IDENTITY',
        'A logged-in user or an email is required',
        400,
      )

    // Spam guard — cap simultaneously-open tickets per account.
    if (input.requesterId) {
      const open = await supportRepository.countOpenByRequester(
        input.requesterId,
      )
      if (open >= MAX_OPEN_TICKETS)
        throw new UserError(
          'TOO_MANY_OPEN',
          `You already have ${MAX_OPEN_TICKETS} open tickets. Please wait for a reply before opening another.`,
          429,
        )
    }

    const priority = categoryToPriority(input.category)
    const now = new Date()

    const ticket = await supportRepository.createTicket({
      type: input.type ?? 'SUPPORT',
      category: input.category,
      priority,
      source: input.source ?? 'WEB',
      subject: input.subject,
      guestEmail: input.guestEmail ?? undefined,
      lastMessageAt: now,
      ...(input.requesterId
        ? { requester: { connect: { id: input.requesterId } } }
        : {}),
      ...(input.orderId ? { order: { connect: { id: input.orderId } } } : {}),
      ...(input.productId ? { productId: input.productId } : {}),
      ...(input.sellerId
        ? { seller: { connect: { id: input.sellerId } } }
        : {}),
      messages: {
        create: {
          authorRole: 'REQUESTER',
          body: input.message,
          ...(input.requesterId
            ? { author: { connect: { id: input.requesterId } } }
            : {}),
        },
      },
    })

    const ref = ticketRef(ticket.ticketNumber)

    // Notify agents in-app.
    await notifyAgents(
      `🎫 New ${ticket.type === 'DISPUTE' ? 'dispute' : 'support ticket'} ${ref}: ${ticket.subject}`,
      input.orderId ?? undefined,
    )

    // Acknowledge the requester by email (covers guests with no in-app inbox).
    const to = ticket.requester?.email || ticket.guestEmail
    if (to) {
      const mail = buildSupportTicketCreatedEmail(ref, ticket.subject)
      emailQueue.enqueue({
        to,
        ...mail,
        type: 'GENERAL',
        replyTo: SUPPORT_REPLY_TO,
      })
    }

    return ticket
  },

  async listMyTickets(
    requesterId: string,
    opts: { status?: string; limit: number; offset: number },
  ) {
    const rows = await supportRepository.listByRequester(requesterId, opts)
    const hasMore = rows.length > opts.limit
    return {
      items: (hasMore ? rows.slice(0, opts.limit) : rows).map(stripInternal),
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  /** Load a thread and authorize the viewer. Non-agents never see internal notes. */
  async getTicketForViewer(id: string, viewer: { id: string; role: string }) {
    const ticket = await supportRepository.getTicketById(id)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)

    const isAgent = viewer.role === 'support_agent' || viewer.role === 'admin'
    const isRequester = ticket.requesterId === viewer.id
    const isSellerParty = ticket.seller?.profileId === viewer.id
    if (!isAgent && !isRequester && !isSellerParty)
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    return isAgent ? ticket : stripInternal(ticket)
  },

  /** Requester or seller-party posts a reply. */
  async addReply(input: {
    ticketId: string
    user: { id: string; role: string }
    body: string
    attachments?: unknown
  }) {
    const ticket = await supportRepository.getTicketById(input.ticketId)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)

    const isRequester = ticket.requesterId === input.user.id
    const isSellerParty = ticket.seller?.profileId === input.user.id
    if (!isRequester && !isSellerParty)
      throw new UserError('FORBIDDEN', 'Access denied', 403)

    if (ticket.status === 'CLOSED')
      throw new UserError(
        'CLOSED',
        'This ticket is closed. Open a new one to continue.',
        409,
      )

    await supportRepository.createMessage({
      ticket: { connect: { id: ticket.id } },
      author: { connect: { id: input.user.id } },
      authorRole: isSellerParty ? 'SELLER' : 'REQUESTER',
      body: input.body,
      attachments: (input.attachments as never) ?? undefined,
    })

    // A user reply moves a waiting/resolved ticket back into the agent queue.
    const nextStatus: SupportStatus =
      ticket.status === 'PENDING_USER' || ticket.status === 'RESOLVED'
        ? 'IN_PROGRESS'
        : (ticket.status as SupportStatus)

    const updated = await supportRepository.updateTicket(ticket.id, {
      lastMessageAt: new Date(),
      status: nextStatus,
    })

    const ref = ticketRef(ticket.ticketNumber)
    // Notify the assigned agent (or the whole queue if unassigned).
    if (ticket.assignedAgentId) {
      notificationQueue.enqueue({
        userId: ticket.assignedAgentId,
        type: 'SUPPORT',
        actorId: input.user.id,
        message: `💬 New reply on ${ref}: ${ticket.subject}`,
        orderId: ticket.orderId ?? undefined,
      })
    } else {
      await notifyAgents(
        `💬 New reply on ${ref}: ${ticket.subject}`,
        ticket.orderId ?? undefined,
      )
    }

    // In a dispute, also nudge the other party.
    if (ticket.type === 'DISPUTE') {
      const otherPartyId = isSellerParty
        ? ticket.requesterId
        : ticket.seller?.profileId
      if (otherPartyId) {
        notificationQueue.enqueue({
          userId: otherPartyId,
          type: 'SUPPORT',
          actorId: input.user.id,
          message: `💬 New reply on dispute ${ref}`,
          orderId: ticket.orderId ?? undefined,
        })
      }
    }

    return updated
  },

  async closeByRequester(ticketId: string, userId: string) {
    const ticket = await supportRepository.getTicketById(ticketId)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)
    if (ticket.requesterId !== userId)
      throw new UserError(
        'FORBIDDEN',
        'Only the requester can close this ticket',
        403,
      )
    if (ticket.status === 'CLOSED') return ticket
    return supportRepository.updateTicket(ticketId, {
      status: 'CLOSED',
      closedAt: new Date(),
    })
  },

  // ── Disputes ────────────────────────────────────────────────────────────────

  /** Buyer opens a dispute on one of their paid orders. */
  async openDispute(input: {
    orderId: number
    userId: string
    userEmail?: string
    category?: SupportCategory
    message: string
  }) {
    const order = await prisma.orders.findUnique({
      where: { id: input.orderId },
      include: {
        orderItem: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    seller: {
                      select: { id: true, profileId: true, store_name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    if (!order) throw new UserError('NOT_FOUND', 'Order not found', 404)
    if (order.userId !== input.userId)
      throw new UserError('FORBIDDEN', 'This is not your order', 403)
    if (order.paymentStatus !== 'PAID')
      throw new UserError('NOT_PAID', 'Only paid orders can be disputed', 400)

    const dup = await supportRepository.findOpenDisputeForOrder(
      input.orderId,
      input.userId,
    )
    if (dup)
      throw new UserError(
        'DUPLICATE',
        'You already have an open dispute for this order',
        409,
      )

    const seller = order.orderItem[0]?.variant?.product?.seller
    if (!seller)
      throw new UserError(
        'NO_SELLER',
        'Could not resolve the seller for this order',
        400,
      )

    const ticket = await this.createTicket({
      requesterId: input.userId,
      subject: `Dispute — Order #${order.id}`,
      message: input.message,
      category: input.category ?? 'ORDER',
      type: 'DISPUTE',
      source: 'ORDER',
      orderId: order.id,
      sellerId: seller.id,
    })

    // Nudge the seller directly (createTicket already notified agents).
    notificationQueue.enqueue({
      userId: seller.profileId,
      type: 'SUPPORT',
      actorId: input.userId,
      message: `⚠️ A buyer opened a dispute on order #${order.id} (${ticketRef(ticket.ticketNumber)}).`,
      orderId: order.id,
    })

    return ticket
  },

  // ── Agent actions ────────────────────────────────────────────────────────────

  async listQueue(opts: {
    status?: string
    priority?: string
    type?: string
    assignedAgentId?: string
    unassigned?: boolean
    limit: number
    offset: number
  }) {
    const rows = await supportRepository.listForAgent(opts)
    const hasMore = rows.length > opts.limit
    return {
      items: hasMore ? rows.slice(0, opts.limit) : rows,
      meta: { limit: opts.limit, offset: opts.offset, hasMore },
    }
  },

  /** Assign / re-prioritise / move status. */
  async agentUpdate(
    ticketId: string,
    agent: { id: string },
    patch: {
      status?: SupportStatus
      priority?: SupportPriority
      assignToMe?: boolean
      assignToId?: string | null
    },
  ) {
    const ticket = await supportRepository.getTicketById(ticketId)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)

    const data: Prisma.SupportTicketUpdateInput = {}

    if (patch.status) {
      if (!canTransition(ticket.status as SupportStatus, patch.status))
        throw new UserError(
          'BAD_TRANSITION',
          `Cannot move ${ticket.status} → ${patch.status}`,
          400,
        )
      data.status = patch.status
      if (patch.status === 'RESOLVED') data.resolvedAt = new Date()
      if (patch.status === 'CLOSED') data.closedAt = new Date()
    }
    if (patch.priority) data.priority = patch.priority
    if (patch.assignToMe) {
      data.assignedAgent = { connect: { id: agent.id } }
      if (
        isOpenStatus(ticket.status as SupportStatus) &&
        ticket.status === 'OPEN'
      )
        data.status = 'IN_PROGRESS'
    } else if (patch.assignToId === null) {
      data.assignedAgent = { disconnect: true }
    } else if (patch.assignToId) {
      data.assignedAgent = { connect: { id: patch.assignToId } }
    }

    return supportRepository.updateTicket(ticketId, data)
  },

  /** Agent posts a reply (public or internal note). */
  async agentReply(input: {
    ticketId: string
    agent: { id: string }
    body: string
    internalNote?: boolean
    attachments?: unknown
  }) {
    const ticket = await supportRepository.getTicketById(input.ticketId)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)

    await supportRepository.createMessage({
      ticket: { connect: { id: ticket.id } },
      author: { connect: { id: input.agent.id } },
      authorRole: 'AGENT',
      body: input.body,
      internalNote: !!input.internalNote,
      attachments: (input.attachments as never) ?? undefined,
    })

    // Internal notes don't change state or notify anyone outside the agent team.
    if (input.internalNote) {
      return supportRepository.updateTicket(ticket.id, {
        lastMessageAt: new Date(),
      })
    }

    // A public agent reply typically waits on the user.
    const nextStatus: SupportStatus =
      ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
        ? 'PENDING_USER'
        : (ticket.status as SupportStatus)

    const updated = await supportRepository.updateTicket(ticket.id, {
      lastMessageAt: new Date(),
      status: nextStatus,
      ...(ticket.assignedAgentId
        ? {}
        : { assignedAgent: { connect: { id: input.agent.id } } }),
    })

    await this.notifyRequesterOfReply(ticket, input.body)
    return updated
  },

  /** Resolve a ticket; for disputes, apply the money outcome. */
  async resolveTicket(input: {
    ticketId: string
    agent: { id: string }
    resolution: string
    disputeOutcome?: DisputeOutcome
    refundAmount?: number
  }) {
    const ticket = await supportRepository.getTicketById(input.ticketId)
    if (!ticket) throw new UserError('NOT_FOUND', 'Ticket not found', 404)

    // Apply dispute money effects before flipping to RESOLVED.
    if (ticket.type === 'DISPUTE' && input.disputeOutcome && ticket.orderId) {
      await this.applyDisputeOutcome(ticket.orderId, input.disputeOutcome)
    }

    const updated = await supportRepository.updateTicket(ticket.id, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution: input.resolution,
      disputeOutcome: input.disputeOutcome ?? undefined,
      refundAmount: input.refundAmount ?? undefined,
      ...(ticket.assignedAgentId
        ? {}
        : { assignedAgent: { connect: { id: input.agent.id } } }),
    })

    // Record the resolution in the thread + notify both parties.
    await supportRepository.createMessage({
      ticket: { connect: { id: ticket.id } },
      author: { connect: { id: input.agent.id } },
      authorRole: 'AGENT',
      body: `✅ Resolved: ${input.resolution}`,
    })

    await this.notifyRequesterOfReply(
      ticket,
      `Your ${ticket.type === 'DISPUTE' ? 'dispute' : 'ticket'} was resolved: ${input.resolution}`,
    )
    if (ticket.type === 'DISPUTE' && ticket.seller?.profileId) {
      notificationQueue.enqueue({
        userId: ticket.seller.profileId,
        type: 'SUPPORT',
        message: `⚖️ Dispute ${ticketRef(ticket.ticketNumber)} resolved: ${input.resolution}`,
        orderId: ticket.orderId ?? undefined,
      })
    }

    return updated
  },

  /**
   * Money effects of a dispute ruling. The seller's *pending* wallet credit is
   * reversed on-platform; the buyer's card refund itself is executed out-of-band
   * via Paystack until paymentService.refund exists (see docs/SUPPORT.md §4).
   */
  async applyDisputeOutcome(orderId: number, outcome: DisputeOutcome) {
    if (outcome === 'RELEASE_SELLER' || outcome === 'REJECTED') return

    if (outcome === 'REFUND_BUYER') {
      // Reverse the seller's not-yet-released credit, cancel the order, restore stock.
      await walletService.reverseOrderCredit(orderId)
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: { orderItem: { select: { variantId: true, quantity: true } } },
      })
      if (order && !['CANCELLED', 'RETURNED'].includes(order.status)) {
        await prisma.orders.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        })
        await orderRepository.restoreStock(order.orderItem)
      }
    }
    // PARTIAL_REFUND: the intended amount is recorded on the ticket (refundAmount);
    // the wallet/gateway movement is handled manually until partial-refund is wired.
  },

  // ── Helpers ────────────────────────────────────────────────────────────────

  async notifyRequesterOfReply(
    ticket: NonNullable<TicketWithParties>,
    body: string,
  ) {
    const ref = ticketRef(ticket.ticketNumber)
    if (ticket.requesterId) {
      notificationQueue.enqueue({
        userId: ticket.requesterId,
        type: 'SUPPORT',
        message: `💬 ${ref}: ${body.slice(0, 120)}`,
        orderId: ticket.orderId ?? undefined,
      })
    }
    const to = ticket.requester?.email || ticket.guestEmail
    if (to) {
      const mail = buildSupportReplyEmail(ref, body)
      emailQueue.enqueue({
        to,
        ...mail,
        type: 'GENERAL',
        replyTo: SUPPORT_REPLY_TO,
      })
    }
  },
}

/** Remove agent-only internal notes from a ticket before returning to non-agents. */
function stripInternal<
  T extends { messages?: Array<{ internalNote: boolean }> },
>(ticket: T): T {
  if (!ticket?.messages) return ticket
  return { ...ticket, messages: ticket.messages.filter((m) => !m.internalNote) }
}
