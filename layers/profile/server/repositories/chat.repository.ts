// FILE PATH: server/layers/user/repositories/chat.repository.ts

// ── Shared select shapes ─────────────────────────────────────────────────────

/** Safe Profile fields — never include password_hash or sensitive data */
const profileSelect = {
  id: true,
  username: true,
  avatar: true,
  role: true,
} as const

/** Safe SellerProfile fields for conversation headers.
 *  `profileId` (the store owner's user id) is required so the service can
 *  authorize the owner as a conversation participant — without it the owner
 *  is 403'd on their own store conversations. */
const sellerSelect = {
  id: true,
  profileId: true,
  store_name: true,
  store_slug: true,
  store_logo: true,
  is_verified: true,
} as const

/** Product context surfaced in the conversation (banner + list) */
const productSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  bannerImageUrl: true,
  media: {
    where: { isBgMusic: false },
    select: { url: true, type: true },
    take: 1,
    orderBy: { created_at: 'asc' as const },
  },
} as const

/** Shared conversation include — used by all conversation queries */
const conversationInclude = {
  participant1: { select: profileSelect },
  participant2: { select: profileSelect },
  seller: { select: sellerSelect },
  currentProduct: { select: productSelect },
  messages: { take: 1, orderBy: { sentAt: 'desc' as const } },
} as const

/** Shared message include */
const messageInclude = {
  sender: { select: profileSelect },
} as const

// ── Repository ───────────────────────────────────────────────────────────────

export const chatRepository = {
  // ========== CONVERSATIONS ==========

  async createConversation(data: {
    participant1Id: string
    participant2Id?: string | null
    sellerId?: string | null
    currentProductId?: number | null
  }) {
    return await prisma.conversation.create({
      data: { id: crypto.randomUUID(), ...data },
    })
  },

  async getConversationById(conversationId: string) {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    })
  },

  async getConversationByParticipants(
    participant1Id: string,
    participant2Id: string,
  ) {
    return await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id, participant2Id },
          { participant1Id: participant2Id, participant2Id: participant1Id },
        ],
      },
    })
  },

  async getConversationByBuyerAndSeller(buyerId: string, sellerId: string) {
    return await prisma.conversation.findUnique({
      where: { participant1Id_sellerId: { participant1Id: buyerId, sellerId } },
    })
  },

  async getConversationsByUserId(
    userId: string,
    limit: number,
    offset: number,
  ) {
    return await prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      include: conversationInclude,
      take: limit,
      skip: offset,
      orderBy: { lastMessageAt: 'desc' },
    })
  },

  async getConversationCountByUserId(userId: string) {
    return await prisma.conversation.count({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
    })
  },

  async getConversationsBySellerId(
    sellerId: string,
    limit: number,
    offset: number,
  ) {
    return await prisma.conversation.findMany({
      where: { sellerId },
      include: conversationInclude,
      take: limit,
      skip: offset,
      orderBy: { lastMessageAt: 'desc' },
    })
  },

  async getConversationCountBySellerId(sellerId: string) {
    return await prisma.conversation.count({ where: { sellerId } })
  },

  async updateConversation(
    conversationId: string,
    data: { lastMessageAt?: Date; currentProductId?: number | null },
  ) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data,
    })
  },

  async deleteConversation(conversationId: string) {
    return await prisma.conversation.delete({ where: { id: conversationId } })
  },

  // ========== MESSAGES ==========

  async createMessage(data: {
    conversationId: string
    senderId: string
    content: string
    productId?: number | null
  }) {
    return await prisma.message.create({
      data: { id: crypto.randomUUID(), ...data },
      include: messageInclude,
    })
  },

  async getMessageById(messageId: string) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    })
  },

  async getConversationMessages(
    conversationId: string,
    limit: number,
    offset: number,
  ) {
    return await prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      take: limit,
      skip: offset,
      orderBy: { sentAt: 'asc' },
    })
  },

  async getMessageCountByConversation(conversationId: string) {
    return await prisma.message.count({ where: { conversationId } })
  },

  async deleteMessage(messageId: string) {
    return await prisma.message.delete({ where: { id: messageId } })
  },

  // ========== READ / UNREAD ==========

  /** Mark every message the reader DIDN'T send in this conversation as read. */
  async markConversationRead(conversationId: string, readerId: string) {
    return await prisma.message.updateMany({
      where: { conversationId, senderId: { not: readerId }, read: false },
      data: { read: true },
    })
  },

  /** Unread count per conversation (messages not sent by, and not yet read by, the user). */
  async unreadCountsByConversation(userId: string, conversationIds: string[]) {
    if (!conversationIds.length) return []
    return await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        read: false,
      },
      _count: { _all: true },
    })
  },

  /** Total unread across every conversation the user is part of (participant OR store owner). */
  async totalUnreadForUser(userId: string) {
    return await prisma.message.count({
      where: {
        senderId: { not: userId },
        read: false,
        conversation: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
            { seller: { profileId: userId } },
          ],
        },
      },
    })
  },
}
