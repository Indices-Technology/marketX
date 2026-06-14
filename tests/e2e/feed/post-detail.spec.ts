// Post detail page — no "Post not found" flash, and caption tag/mention links
// route directly (no post-open detour).
import { test, expect } from '@playwright/test'

const T = { timeout: 15000 }

async function firstPostId(request: any): Promise<string | null> {
  // /api/feed/home returns { items, meta }; posts carry type: 'POST' with a UUID id
  const res = await request.get('/api/feed/home?limit=20')
  if (!res.ok()) return null
  const body = await res.json()
  const items = body?.items ?? body?.data?.items ?? []
  const post = items.find((i: any) => i.type === 'POST' && i.id)
  return post?.id ? String(post.id) : null
}

test.describe('Post detail page', () => {
  test('loads a real post without the "Post not found" flash', async ({ page, request }) => {
    const id = await firstPostId(request)
    test.skip(!id, 'no seeded post available')

    // Track whether the not-found copy ever appears during load
    let sawNotFound = false
    page.on('console', () => {}) // noop, keep page active
    await page.goto(`/post/${id}`, { waitUntil: 'commit' })
    // Poll briefly during hydration/fetch for the not-found text
    for (let i = 0; i < 8; i++) {
      if (await page.getByText('Post not found').isVisible().catch(() => false)) {
        sawNotFound = true
        break
      }
      await page.waitForTimeout(150)
    }
    expect(sawNotFound).toBe(false)

    // Article (or its media/details) should render, not the not-found state
    await expect(page.getByText('Post not found')).not.toBeVisible(T)
    await expect(page.locator('article, [class*="post"]').first()).toBeVisible(T)
  })

  test('unknown post id shows "Post not found" (after load, not a flash)', async ({ page }) => {
    await page.goto('/post/nonexistent-post-id-xyz')
    await expect(page.getByText('Post not found')).toBeVisible(T)
  })
})
