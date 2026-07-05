-- CreateEnum
CREATE TYPE "SupportTicketType" AS ENUM ('SUPPORT', 'DISPUTE');

-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'SELLER', 'PRODUCT', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportSource" AS ENUM ('WEB', 'EMAIL', 'CHECKOUT', 'ORDER');

-- CreateEnum
CREATE TYPE "SupportAuthorRole" AS ENUM ('REQUESTER', 'SELLER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('REFUND_BUYER', 'RELEASE_SELLER', 'PARTIAL_REFUND', 'REJECTED');

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticketNumber" SERIAL NOT NULL,
    "type" "SupportTicketType" NOT NULL DEFAULT 'SUPPORT',
    "category" "SupportCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "source" "SupportSource" NOT NULL DEFAULT 'WEB',
    "subject" TEXT NOT NULL,
    "requesterId" UUID,
    "guestEmail" TEXT,
    "assignedAgentId" UUID,
    "orderId" INTEGER,
    "productId" INTEGER,
    "sellerId" UUID,
    "resolution" TEXT,
    "disputeOutcome" "DisputeOutcome",
    "refundAmount" INTEGER,
    "lastMessageAt" TIMESTAMPTZ(6),
    "resolvedAt" TIMESTAMPTZ(6),
    "closedAt" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticketId" UUID NOT NULL,
    "authorId" UUID,
    "authorRole" "SupportAuthorRole" NOT NULL DEFAULT 'REQUESTER',
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "internalNote" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_created_at_idx" ON "SupportTicket"("status", "priority", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SupportTicket_requesterId_created_at_idx" ON "SupportTicket"("requesterId", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SupportTicket_assignedAgentId_status_idx" ON "SupportTicket"("assignedAgentId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_type_status_idx" ON "SupportTicket"("type", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_created_at_idx" ON "SupportMessage"("ticketId", "created_at");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
