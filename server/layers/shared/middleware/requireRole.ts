import type { H3Event } from 'h3'
import { requireAuth } from './requireAuth'

export async function requireModerator(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'moderator' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

// Support agents are a dedicated role (separate from content moderators). Admins
// are a superset and may also work tickets. See docs/SUPPORT.md §1.
export async function requireSupportAgent(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'support_agent' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
