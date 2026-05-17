// GET /api/profile/settings — return current user's settings
import { requireAuth } from '~~/server/layers/shared/middleware/requireAuth'
import { prisma } from '~~/server/utils/db'
import { remember } from '~~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const settings = await remember(`profile:settings:${user.id}`, 300, async () => {
    // findUnique first — avoids a write on every GET request
    const existing = await prisma.userSettings.findUnique({ where: { user_id: user.id } })
    if (existing) return existing
    return prisma.userSettings.create({ data: { user_id: user.id } })
  })

  return { success: true, data: settings }
})
