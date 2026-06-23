import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { recordQuery } from './dbMetrics'

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('[db] DATABASE_URL is not set in environment variables')
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })

  // Swallow idle-connection errors (e.g. the host dropping/suspending a socket).
  // Without this listener, Node.js throws an uncaughtException and crashes.
  pool.on('error', (err) => {
    console.warn('[db] pg pool idle connection dropped:', err.message)
  })

  // Warm one connection on startup so the first request isn't cold
  pool.connect().then((c) => c.release()).catch(() => {})

  const adapter = new PrismaPg(pool)

  // Count every operation against the current request (see server/utils/dbMetrics.ts).
  // Inert unless a per-request store is open, so production overhead is ~nil.
  return new PrismaClient({ adapter }).$extends({
    query: {
      $allOperations({ operation, args, query }) {
        recordQuery(operation)
        return query(args)
      },
    },
  })
}

type ExtendedPrisma = ReturnType<typeof createClient>
const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrisma | undefined }

export const prisma = globalForPrisma.prisma ?? createClient()

// Persist across HMR reloads in dev so we don't recreate the pool on every save
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
