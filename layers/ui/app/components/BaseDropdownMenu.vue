<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      v-if="!$slots.trigger"
      type="button"
      :class="triggerClasses"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <Icon v-if="icon" :name="icon" size="16" />
      <span v-if="label">{{ label }}</span>
      <Icon name="mdi:chevron-down" size="16" />
    </button>
    <slot v-else name="trigger" :open="open" :toggle="toggle" :close="close" />

    <Transition name="dropdown">
      <div v-if="open" :class="menuClasses" role="menu">
        <slot :close="close">
          <button
            v-for="item in items"
            :key="item.value"
            type="button"
            role="menuitem"
            :disabled="item.disabled"
            :class="itemClasses(item)"
            @click="selectItem(item)"
          >
            <Icon
              v-if="item.icon"
              :name="item.icon"
              size="16"
              class="shrink-0"
            />
            <span class="min-w-0 flex-1 truncate text-left">{{
              item.label
            }}</span>
          </button>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

type DropdownItem = {
  label: string
  value: string
  icon?: string
  disabled?: boolean
  danger?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    items?: DropdownItem[]
    label?: string
    icon?: string
    placement?: 'left' | 'right'
    width?: 'sm' | 'md' | 'lg'
  }>(),
  {
    modelValue: undefined,
    items: () => [],
    icon: 'mdi:dots-horizontal',
    placement: 'right',
    width: 'md',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [item: DropdownItem]
}>()

const rootRef = ref<HTMLElement | null>(null)
const internalOpen = ref(false)
const isControlled = computed(() => props.modelValue !== undefined)
const open = computed(() =>
  isControlled.value ? !!props.modelValue : internalOpen.value,
)

const setOpen = (value: boolean) => {
  if (!isControlled.value) internalOpen.value = value
  emit('update:modelValue', value)
}

const toggle = () => setOpen(!open.value)
const close = () => setOpen(false)

const selectItem = (item: DropdownItem) => {
  if (item.disabled) return
  emit('select', item)
  close()
}

onClickOutside(rootRef, close)

watch(
  () => props.modelValue,
  (value) => {
    if (isControlled.value) internalOpen.value = !!value
  },
)

const triggerClasses = computed(() => [
  'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors',
  'hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
  'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800',
])

const menuClasses = computed(() => [
  'absolute top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-gray-200/70 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40',
  props.placement === 'right' ? 'right-0' : 'left-0',
  {
    sm: 'w-44',
    md: 'w-56',
    lg: 'w-72',
  }[props.width],
])

const itemClasses = (item: DropdownItem) => [
  'flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  item.danger
    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
    : 'text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800',
]
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
