<template>
  <span :class="classes">
    <span
      v-if="dot"
      class="mr-1.5 h-1.5 w-1.5 rounded-full"
      :class="dotColor"
    />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Status =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PROCESSING'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'
  | 'brand'

const ORDER_STATUS_MAP: Record<string, Status> = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CANCELED: 'CANCELLED',
  RETURNED: 'RETURNED',
  PROCESSING: 'PROCESSING',
}

const props = withDefaults(
  defineProps<{
    status?: Status | string
    label?: string
    size?: 'xs' | 'sm'
    dot?: boolean
  }>(),
  { size: 'xs', dot: false },
)

const resolvedStatus = computed<Status>(() => {
  const s = props.status ?? ''
  return ORDER_STATUS_MAP[s] ?? (s as Status) ?? 'muted'
})

const colorMap: Record<Status, { bg: string; text: string }> = {
  PENDING: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  CONFIRMED: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  SHIPPED: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-400',
  },
  DELIVERED: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  CANCELLED: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  RETURNED: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  PROCESSING: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  muted: {
    bg: 'bg-gray-100 dark:bg-neutral-800',
    text: 'text-gray-500 dark:text-neutral-400',
  },
  brand: { bg: 'bg-brand/10', text: 'text-brand' },
}

const dotColorMap: Record<Status, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  SHIPPED: 'bg-sky-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  RETURNED: 'bg-orange-500',
  PROCESSING: 'bg-indigo-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  muted: 'bg-gray-400',
  brand: 'bg-brand',
}

const colors = computed(() => colorMap[resolvedStatus.value] ?? colorMap.muted)
const dotColor = computed(
  () => dotColorMap[resolvedStatus.value] ?? dotColorMap.muted,
)

const sizeClasses = computed(() =>
  props.size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-2xs',
)

const classes = computed(() => [
  'inline-flex items-center rounded-full font-semibold leading-none',
  sizeClasses.value,
  colors.value.bg,
  colors.value.text,
])
</script>
