<template>
  <span :class="wrapperClasses" :style="fallbackStyle">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="altText"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover"
      @error="imageError = true"
    />
    <Icon
      v-else-if="variant === 'store'"
      name="mdi:store"
      :size="sz.icon"
      class="text-white/90"
    />
    <span v-else class="select-none font-bold uppercase leading-none">
      {{ initials }}
    </span>

    <span v-if="status" :class="statusClasses" aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string
    alt?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    variant?: 'user' | 'store'
    status?: 'online' | 'offline' | 'busy'
  }>(),
  {
    size: 'md',
    variant: 'user',
  },
)

const imageError = ref(false)
watch(
  () => props.src,
  () => { imageError.value = false },
)

// ── Text / initials ───────────────────────────────────────────────────────────
const initials = computed(() => {
  const n = props.name?.trim()
  if (!n) return '?'
  return n.split(/\s+/).slice(0, 2).map((p) => p[0]).join('')
})

const altText = computed(
  () => props.alt || props.name || (props.variant === 'store' ? 'Store' : 'Avatar'),
)

// ── Hash-based fallback colours ───────────────────────────────────────────────
const USER_PALETTE = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8',
  '#c084fc', '#e879f9',
]
const STORE_PALETTE = [
  '#f02c56', '#7c3aed', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
]

const bgColor = computed(() => {
  const label = props.name?.trim()
  if (!label) return props.variant === 'store' ? '#f02c56' : '#e2e8f0'
  const palette = props.variant === 'store' ? STORE_PALETTE : USER_PALETTE
  const hash = label.split('').reduce((acc, ch) => ch.charCodeAt(0) + ((acc << 5) - acc), 0)
  return palette[Math.abs(hash) % palette.length]
})

// Show bg color only when image is absent / broken
const fallbackStyle = computed(() =>
  !props.src || imageError.value ? { backgroundColor: bgColor.value } : undefined,
)

// ── Size tokens ───────────────────────────────────────────────────────────────
const SIZES = {
  xs:   { wrapper: 'h-6  w-6  text-[9px]',  icon: '12', dot: 'h-1.5 w-1.5', border: 'border' },
  sm:   { wrapper: 'h-8  w-8  text-[11px]', icon: '14', dot: 'h-2   w-2',   border: 'border-2' },
  md:   { wrapper: 'h-10 w-10 text-[13px]', icon: '16', dot: 'h-2.5 w-2.5', border: 'border-2' },
  lg:   { wrapper: 'h-12 w-12 text-sm',     icon: '20', dot: 'h-3   w-3',   border: 'border-2' },
  xl:   { wrapper: 'h-14 w-14 text-base',   icon: '22', dot: 'h-3.5 w-3.5', border: 'border-2' },
  '2xl':{ wrapper: 'h-20 w-20 text-xl',     icon: '28', dot: 'h-4   w-4',   border: 'border-2' },
} as const

const sz = computed(() => SIZES[props.size] ?? SIZES.md)

// ── Shape ─────────────────────────────────────────────────────────────────────
const shapeClass = computed(() =>
  props.variant === 'store'
    ? props.size === 'xs' || props.size === 'sm' ? 'rounded-lg' : 'rounded-xl'
    : 'rounded-full',
)

const wrapperClasses = computed(() => [
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
  'ring-1 ring-black/5 dark:ring-white/10',
  sz.value.wrapper,
  shapeClass.value,
])

// ── Status dot ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
} as const

const statusClasses = computed(() => [
  'absolute bottom-0 right-0 rounded-full border-white dark:border-neutral-900',
  sz.value.dot,
  sz.value.border,
  STATUS_COLOR[props.status ?? 'offline'],
])
</script>
