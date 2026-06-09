<template>
  <div :class="wrapperClasses" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="String(tab.value)"
      type="button"
      role="tab"
      :aria-selected="tab.value === modelValue"
      :disabled="tab.disabled"
      :class="tabClasses(tab)"
      @click="selectTab(tab)"
    >
      <Icon v-if="tab.icon" :name="tab.icon" :size="iconSize" class="shrink-0" />
      <span class="truncate">{{ tab.label }}</span>
      <BaseBadge
        v-if="tab.count !== undefined"
        status="muted"
        size="xs"
      >
        {{ tab.count }}
      </BaseBadge>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'

type TabOption = {
  label: string
  value: string | number
  icon?: string
  count?: number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    tabs: TabOption[]
    variant?: 'segmented' | 'underline'
    size?: 'sm' | 'md'
    ariaLabel?: string
  }>(),
  {
    variant: 'segmented',
    size: 'md',
    ariaLabel: 'Tabs',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [tab: TabOption]
}>()

const selectTab = (tab: TabOption) => {
  if (tab.disabled) return
  emit('update:modelValue', tab.value)
  emit('change', tab)
}

const iconSize = computed(() => props.size === 'sm' ? '14' : '16')

const wrapperClasses = computed(() =>
  props.variant === 'underline'
    ? 'flex items-center gap-4 border-b border-gray-200 dark:border-neutral-800'
    : 'inline-flex max-w-full items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-neutral-800',
)

const tabClasses = (tab: TabOption) => {
  const active = tab.value === props.modelValue
  const sizeClass = props.size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm'

  if (props.variant === 'underline') {
    return [
      'inline-flex items-center gap-2 border-b-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      sizeClass,
      active
        ? 'border-brand text-brand'
        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-100',
    ]
  }

  return [
    'inline-flex min-w-0 items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
    sizeClass,
    active
      ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100'
      : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100',
  ]
}
</script>
