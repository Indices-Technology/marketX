<template>
  <div class="dassa-md text-[13.5px] leading-relaxed" v-html="rendered" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

const rendered = computed(() => {
  // Strip bullet lines — they surface as tappable QuickReply chips instead
  const stripped = props.content
    .split('\n')
    .filter((line) => !/^[-*]\s+.+/.test(line.trim()))
    .join('\n')
    .trim()

  let html = stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Numbered list
  html = html.replace(/^\d+\.\s+(.+)/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Paragraphs
  const paragraphs = html.split(/\n{2,}/)
  html = paragraphs
    .map((p) => {
      const t = p.trim()
      if (!t) return ''
      if (t.includes('<li')) return `<ol class="space-y-0.5 my-1">${t}</ol>`
      return `<p class="my-0.5">${t.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('')

  return html
})
</script>
