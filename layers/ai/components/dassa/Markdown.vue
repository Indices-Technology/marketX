<template>
  <div class="dassa-md text-[14px] leading-relaxed" v-html="rendered" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ content: string; dark?: boolean }>()

const rendered = computed(() => {
  let html = props.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^[-*] (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/^\d+\. (.+)/gm, '<li class="ml-4 list-decimal">$1</li>')

  const paragraphs = html.split(/\n{2,}/)
  html = paragraphs
    .map((p) => {
      if (p.includes('<li')) return `<ul class="space-y-0.5 my-1">${p}</ul>`
      return `<p class="my-0">${p.replace(/\n/g, '<br>')}</p>`
    })
    .join('')

  return html
})
</script>
