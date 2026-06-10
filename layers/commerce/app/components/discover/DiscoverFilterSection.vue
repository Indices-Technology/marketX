<template>
  <section>
    <p class="mb-2 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">
      {{ label }}
    </p>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
