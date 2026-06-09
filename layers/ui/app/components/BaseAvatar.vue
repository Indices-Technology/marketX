<template>
  <span :class="wrapperClasses">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="altText"
      class="h-full w-full object-cover"
      @error="imageError = true"
    />
    <span v-else class="font-bold uppercase leading-none">
      {{ initials }}
    </span>
    <span v-if="status" :class="statusClasses" aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    alt?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    status?: 'online' | 'offline' | 'busy'
  }>(),
  {
    size: 'md',
  },
)

const imageError = ref(false)

watch(
  () => props.src,
  () => {
    imageError.value = false
  },
)

const initials = computed(() => {
  const name = props.name?.trim()
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
})

const altText = computed(() => props.alt || props.name || 'Avatar')

const sizeClasses = computed(
  () =>
    ({
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-xl',
    })[props.size],
)

const statusSizeClasses = computed(
  () =>
    ({
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-3.5 w-3.5',
    })[props.size],
)

const statusColor = computed(
  () =>
    ({
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
    })[props.status || 'offline'],
)

const wrapperClasses = computed(() => [
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand ring-1 ring-black/5 dark:ring-white/10',
  sizeClasses.value,
])

const statusClasses = computed(() => [
  'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-neutral-900',
  statusSizeClasses.value,
  statusColor.value,
])
</script>
