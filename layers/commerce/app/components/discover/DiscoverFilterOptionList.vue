<template>
  <div class="flex flex-col gap-0.5">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="flex items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-[13px] transition-all"
      :class="
        active === opt.value
          ? 'border-brand bg-brand/5 font-semibold text-brand dark:bg-brand/10'
          : 'border-transparent font-medium text-gray-600 hover:bg-gray-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
      "
      :aria-pressed="active === opt.value"
      @click="$emit('select', opt.value)"
    >
      <Icon v-if="opt.icon" :name="opt.icon" size="13" class="shrink-0 opacity-70" />
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  options: Array<{ value: any; label: string; icon?: string }>
  active: any
}>()

defineEmits<{ select: [value: any] }>()
</script>
