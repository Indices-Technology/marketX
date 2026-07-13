<template>
  <div :class="classes">
    <div
      v-if="$slots.header || title"
      class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
    >
      <div>
        <p
          v-if="eyebrow"
          class="t-eyebrow mb-0.5"
        >
          {{ eyebrow }}
        </p>
        <h3
          v-if="title"
          class="t-subheading"
        >
          {{ title }}
        </h3>
        <slot name="header" />
      </div>
      <slot name="header-actions" />
    </div>

    <div :class="noPadding ? '' : 'p-5'">
      <slot />
    </div>

    <div
      v-if="$slots.footer"
      class="border-t border-gray-200 px-5 py-3.5 dark:border-neutral-800"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'flat' | 'elevated'
    title?: string
    eyebrow?: string
    noPadding?: boolean
  }>(),
  {
    variant: 'default',
    noPadding: false,
  },
)

const classes = computed(() => [
  'overflow-hidden rounded-2xl',
  {
    default:
      'border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none',
    flat: 'bg-gray-50 dark:bg-neutral-800/50',
    elevated:
      'border border-gray-200 bg-white shadow-md shadow-gray-200/60 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40',
  }[props.variant],
])
</script>
