<template>
  <div class="mt-2.5 flex flex-wrap gap-1.5">
    <button
      v-for="reply in replies"
      :key="reply"
      class="rounded-full border border-brand/25 bg-brand/5 px-3 py-1.5 text-[11.5px] font-semibold text-brand transition-all active:scale-95 hover:bg-brand/10 hover:border-brand/40 whitespace-nowrap"
      @click="$emit('select', reply)"
    >
      {{ reply }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ replies: string[] }>()
defineEmits<{ select: [reply: string] }>()
</script>
