<template>
  <!-- eslint-disable vue/no-v-html -->
  <span v-html="rendered" class="post-caption" @click="onCaptionClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  caption?: string | null
  mentions?: Array<{ type: 'seller' | 'user'; handle: string }> | null
  lineClamp?: number
}>()

const router = useRouter()

// The hashtag/mention links are raw <a> tags inside v-html. A plain click would
// (a) bubble up to the parent post card and open the post, AND (b) trigger a
// full-page navigation — so on a slow network the post flashes open before the
// profile/tags page loads. Intercept it: stop propagation and route client-side
// straight to the destination.
const onCaptionClick = (e: MouseEvent) => {
  const anchor = (e.target as HTMLElement).closest('a')
  if (!anchor) return // non-link text — let it bubble (opens the post as before)
  const href = anchor.getAttribute('href')
  if (!href) return
  e.preventDefault()
  e.stopPropagation()
  router.push(href)
}

const rendered = computed(() => {
  const text = props.caption?.trim()
  if (!text) return ''

  // Build mention handle → route map from structured mentions array
  const mentionMap = new Map<string, string>()
  for (const m of props.mentions ?? []) {
    const route = m.type === 'seller'
      ? `/sellers/profile/${m.handle}`
      : `/profile/${m.handle}`
    mentionMap.set(m.handle.toLowerCase(), route)
  }

  // 1. HTML-escape to prevent XSS before injecting any HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // 2. Hashtags → brand-coloured links to the Tags tab on discover
  const withTags = escaped.replace(
    /(?<!\w)#([a-zA-Z][a-zA-Z0-9_]{0,29})/g,
    (_, tag) =>
      `<a href="/discover?tab=tags&amp;tagName=${encodeURIComponent(tag.toLowerCase())}" class="text-brand font-medium hover:underline">#${tag}</a>`,
  )

  // 3. Mentions → profile/store links (uses mentions map if available, falls back to seller profile)
  const withMentions = withTags.replace(
    /(?<!\w)@([a-zA-Z0-9][a-zA-Z0-9_-]{0,49})/g,
    (_, handle) => {
      const route = mentionMap.get(handle.toLowerCase()) ?? `/sellers/profile/${handle}`
      return `<a href="${route}" class="text-brand font-medium hover:underline">@${handle}</a>`
    },
  )

  return withMentions
})
</script>

<style scoped>
.post-caption :deep(a) {
  cursor: pointer;
}
</style>
