<template>
  <span
    aria-hidden="true"
    :class="classes"
    :style="style"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    shape?: 'line' | 'block' | 'circle' | 'avatar'
    width?: string
    height?: string
    rounded?: string
  }>(),
  {
    shape: 'line',
  },
)

const shapeClasses = computed(() => {
  switch (props.shape) {
    case 'circle':
      return 'rounded-full'
    case 'avatar':
      return 'h-10 w-10 rounded-full'
    case 'block':
      return props.rounded || 'rounded-xl'
    case 'line':
    default:
      return props.rounded || 'rounded-md'
  }
})

const defaultSize = computed(() => {
  if (props.shape === 'line') return { width: '100%', height: '0.75rem' }
  if (props.shape === 'circle') return { width: '2.5rem', height: '2.5rem' }
  return {}
})

const style = computed(() => ({
  width: props.width || defaultSize.value.width,
  height: props.height || defaultSize.value.height,
}))

const classes = computed(() => [
  'block animate-pulse bg-gray-100 dark:bg-neutral-800',
  shapeClasses.value,
])
</script>
