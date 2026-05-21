import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { prisma } from '~~/server/utils/db'

// AES-256-GCM: key must be 32 bytes (set AI_CONFIG_ENCRYPTION_KEY as 64-char hex)
function getKey(): Buffer {
  const hex = process.env.AI_CONFIG_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error('AI_CONFIG_ENCRYPTION_KEY must be a 64-char hex string')
  return Buffer.from(hex, 'hex')
}

export function encryptApiKey(plaintext: string): string {
  const iv         = randomBytes(12)
  const cipher     = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag    = cipher.getAuthTag()
  // Format: iv(24):authTag(32):ciphertext(hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptApiKey(stored: string): string {
  const [ivHex, tagHex, ctHex] = stored.split(':')
  const iv         = Buffer.from(ivHex, 'hex')
  const authTag    = Buffer.from(tagHex, 'hex')
  const ct         = Buffer.from(ctHex, 'hex')
  const decipher   = createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(authTag)
  return decipher.update(ct) + decipher.final('utf8')
}

// ── DB helpers ────────────────────────────────────────────────────────────────

export const aiConfigService = {
  async get(profileId: string) {
    return prisma.userAIConfig.findUnique({ where: { profileId } })
  },

  async upsert(profileId: string, provider: string, model: string, apiKey: string) {
    const encryptedKey = encryptApiKey(apiKey)
    return prisma.userAIConfig.upsert({
      where:  { profileId },
      update: { provider, model, apiKey: encryptedKey },
      create: { profileId, provider, model, apiKey: encryptedKey },
    })
  },

  async delete(profileId: string) {
    return prisma.userAIConfig.deleteMany({ where: { profileId } })
  },

  /** Returns decrypted config for server-to-server use (Dassah API). */
  async getDecrypted(profileId: string): Promise<{ provider: string; model: string; apiKey: string } | null> {
    const row = await prisma.userAIConfig.findUnique({ where: { profileId } })
    if (!row) return null
    return { provider: row.provider, model: row.model, apiKey: decryptApiKey(row.apiKey) }
  },
}
