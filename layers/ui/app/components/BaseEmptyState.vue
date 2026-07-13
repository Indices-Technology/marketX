<template>
  <div :class="classes">
    <div
      v-if="icon || $slots.icon"
      class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500"
    >
      <slot name="icon">
        <Icon :name="icon" size="24" />
      </slot>
    </div>

    <h3
      v-if="title"
      class="t-subheading"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 max-w-sm text-sm ink-soft leading-relaxed"
    >
      {{ description }}
    </p>

    <div
      v-if="$slots.actions"
      class="mt-5 flex flex-wrap items-center justify-center gap-2"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
    compact?: boolean
    align?: 'center' | 'left'
  }>(),
  {
    compact: false,
    align: 'center',
  },
)

const classes = computed(() => [
  'flex flex-col',
  props.align === 'center'
    ? 'items-center text-center'
    : 'items-start text-left',
  props.compact ? 'py-6' : 'py-10',
])
</script>
