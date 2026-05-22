<template>
  <div class="flex flex-wrap gap-1.5 mt-2">
    <button
      v-for="reply in replies"
      :key="reply"
      @click="$emit('select', reply)"
      class="px-2.5 py-1 bg-gray-50 dark:bg-neutral-800 text-brand border border-brand/20 rounded-full text-[11px] font-semibold hover:bg-brand/5 active:bg-brand/10 transition-colors whitespace-nowrap"
    >
      {{ reply }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ replies: string[] }>()
defineEmits<{ select: [reply: string] }>()
</script>
