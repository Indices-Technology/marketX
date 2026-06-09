<template>
  <component
    :is="resolvedTag"
    v-bind="attrs"
    :class="classes"
    :disabled="isButton && (disabled || loading)"
  >
    <span
      v-if="loading"
      class="btn-spinner"
      :class="spinnerColor"
      aria-hidden="true"
    />
    <Icon
      v-if="iconLeft && !loading"
      :name="iconLeft"
      :size="iconPx"
      class="shrink-0"
      :class="hasLabel ? '-ml-0.5' : ''"
    />
    <span v-if="hasLabel" :class="loading ? 'invisible' : ''">
      <slot />
    </span>
    <Icon
      v-if="iconRight && !loading"
      :name="iconRight"
      :size="iconPx"
      class="shrink-0"
      :class="hasLabel ? '-mr-0.5' : ''"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots, resolveComponent } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'icon'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    tag?: string
    type?: 'button' | 'submit' | 'reset'
    iconLeft?: string
    iconRight?: string
    href?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    tag: 'button',
    type: 'button',
  },
)

const forwardedAttrs = useAttrs()
const slots = useSlots()
const hasLabel = computed(() => !!slots.default)

const resolvedTag = computed(() => {
  if (props.tag === 'NuxtLink') return resolveComponent('NuxtLink')
  return props.tag
})

const isButton = computed(() => props.tag === 'button')

const attrs = computed(() => {
  const a: Record<string, unknown> = { ...forwardedAttrs }
  if (isButton.value) a.type = props.type
  if (props.href) a.href = props.href
  return a
})

// Size → padding, text, min-width
const sizeClasses = computed(() => {
  if (props.variant === 'icon') {
    return {
      xs: 'h-7 w-7',
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
      lg: 'h-11 w-11',
    }[props.size]
  }
  return {
    xs: 'h-7 px-2.5 gap-1 text-xs',
    sm: 'h-8 px-3 gap-1.5 text-xs',
    md: 'h-9 px-4 gap-2 text-sm',
    lg: 'h-11 px-5 gap-2 text-base',
  }[props.size]
})

const iconPx = computed(
  () => ({ xs: '12', sm: '14', md: '15', lg: '17' })[props.size],
)

// Variant → colors
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-dark active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2'
    case 'secondary':
      return 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
    case 'ghost':
      return 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
    case 'danger':
      return 'bg-red-500 text-white shadow-sm shadow-red-500/20 hover:bg-red-600 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2'
    case 'success':
      return 'bg-mint text-white shadow-sm shadow-mint/20 hover:bg-mint-dark active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2'
    case 'icon':
      return 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 active:scale-[0.93] focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
    default:
      return ''
  }
})

const spinnerColor = computed(() => {
  switch (props.variant) {
    case 'primary':
    case 'danger':
      return 'border-white/30 border-t-white'
    default:
      return 'border-gray-300 border-t-gray-600 dark:border-neutral-600 dark:border-t-neutral-300'
  }
})

const classes = computed(() => [
  // Base
  'relative inline-flex items-center justify-center font-semibold',
  'rounded-xl outline-none transition-all duration-150',
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Shape
  sizeClasses.value,
  // Variant
  variantClasses.value,
  // Loading cursor
  props.loading ? 'cursor-wait' : '',
])
</script>

<style scoped>
.btn-spinner {
  @apply absolute h-4 w-4 animate-spin rounded-full border-2;
}
</style>
