// Internal data service for Dassah AI — called via MarketX internal APIs.
// Handles: embedding upsert/search, user AI profiles, turn logs, guard events.
//
// Vector column (embedding vector(1536)) is NOT managed by Prisma — added via
// custom SQL migration. All vector ops use $executeRaw / $queryRaw.

import { prisma } from '~~/server/utils/db'
import type { Prisma } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbeddingUpsertInput {
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  contentHash: string
  vector: number[]
}

export interface EmbeddingSearchInput {
  vector: number[]
  entityType?: string
  limit?: number
  threshold?: number // max cosine distance (0 = identical, 2 = opposite); default 0.5
}

export interface EmbeddingSearchResult {
  entityType: string
  entityId: string
  metadata: unknown
  distance: number
}

export interface UserAIProfileData {
  measurements?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
  signals?: Record<string, unknown> | null
  rawContext?: string | null
}

export interface TurnLogInput {
  userId: string
  sessionId: string
  channel: string
  intent?: string
  userMessage: string
  assistantResponse: string
  toolsCalled: string[]
  ragHits?: number
  tokensPrompt?: number
  tokensCompletion?: number
  latencyMs?: number
  modelUsed?: string
  guardBlocked?: boolean
}

export interface GuardEventInput {
  userId: string
  type: string
  inputFragment?: string
}

// ── Embedding ─────────────────────────────────────────────────────────────────

async function upsertEmbedding(input: EmbeddingUpsertInput): Promise<void> {
  const { entityType, entityId, metadata, contentHash, vector } = input

  // Prisma upsert for all non-vector columns
  await prisma.embedding.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    create: { entityType, entityId, metadata, contentHash },
    update: { metadata, contentHash, updatedAt: new Date() },
  })

  // Write vector via raw SQL (pgvector column not in Prisma schema)
  const vectorLiteral = `[${vector.join(',')}]`
  await prisma.$executeRaw`
    UPDATE "Embedding"
    SET    embedding = ${vectorLiteral}::vector
    WHERE  "entityType" = ${entityType}
    AND    "entityId"   = ${entityId}
  `
}

async function searchEmbeddings(
  input: EmbeddingSearchInput,
): Promise<EmbeddingSearchResult[]> {
  const { vector, entityType, limit = 10, threshold = 0.5 } = input
  const vectorLiteral = `[${vector.join(',')}]`

  type RawRow = {
    entityType: string
    entityId: string
    metadata: unknown
    distance: number
  }

  let rows: RawRow[]

  if (entityType) {
    rows = await prisma.$queryRaw<RawRow[]>`
      SELECT "entityType", "entityId", metadata,
             (embedding <=> ${vectorLiteral}::vector) AS distance
      FROM   "Embedding"
      WHERE  embedding IS NOT NULL
      AND    "entityType" = ${entityType}
      AND    (embedding <=> ${vectorLiteral}::vector) < ${threshold}
      ORDER  BY distance
      LIMIT  ${limit}
    `
  } else {
    rows = await prisma.$queryRaw<RawRow[]>`
      SELECT "entityType", "entityId", metadata,
             (embedding <=> ${vectorLiteral}::vector) AS distance
      FROM   "Embedding"
      WHERE  embedding IS NOT NULL
      AND    (embedding <=> ${vectorLiteral}::vector) < ${threshold}
      ORDER  BY distance
      LIMIT  ${limit}
    `
  }

  return rows.map((r) => ({
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: r.metadata,
    distance: Number(r.distance),
  }))
}

// ── User AI Profile ───────────────────────────────────────────────────────────

async function getProfile(userId: string) {
  return prisma.userAIProfile.findUnique({ where: { userId } })
}

async function upsertProfile(userId: string, data: UserAIProfileData) {
  const payload = {
    measurements: data.measurements ?? undefined,
    preferences: data.preferences ?? undefined,
    signals: data.signals ?? undefined,
    rawContext: data.rawContext ?? undefined,
  } satisfies Prisma.UserAIProfileUpdateInput

  return prisma.userAIProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: { ...payload, updatedAt: new Date() },
  })
}

// ── Turn Logging (fire-and-forget) ────────────────────────────────────────────

function logTurn(input: TurnLogInput): void {
  prisma.aiTurnLog
    .create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        channel: input.channel,
        intent: input.intent,
        userMessage: input.userMessage,
        assistantResponse: input.assistantResponse,
        toolsCalled: input.toolsCalled,
        ragHits: input.ragHits ?? 0,
        tokensPrompt: input.tokensPrompt ?? 0,
        tokensCompletion: input.tokensCompletion ?? 0,
        latencyMs: input.latencyMs ?? 0,
        modelUsed: input.modelUsed,
        guardBlocked: input.guardBlocked ?? false,
      },
    })
    .catch((err) => console.error('[ai-data] logTurn failed:', err))
}

// ── Guard Rail Events (fire-and-forget) ───────────────────────────────────────

function logGuardEvent(input: GuardEventInput): void {
  prisma.guardRailEvent
    .create({
      data: {
        userId: input.userId,
        type: input.type,
        inputFragment: input.inputFragment,
      },
    })
    .catch((err) => console.error('[ai-data] logGuardEvent failed:', err))
}

// ── Exported service ──────────────────────────────────────────────────────────

export const aiDataService = {
  upsertEmbedding,
  searchEmbeddings,
  getProfile,
  upsertProfile,
  logTurn,
  logGuardEvent,
}
