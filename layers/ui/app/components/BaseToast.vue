<template>
  <div :class="classes" role="status">
    <div :class="iconClasses">
      <Icon :name="iconName" size="18" />
    </div>

    <div class="min-w-0 flex-1">
      <p
        v-if="title"
        class="text-sm font-semibold text-gray-900 dark:text-neutral-100"
      >
        {{ title }}
      </p>
      <p v-if="message" class="text-sm text-gray-600 dark:text-neutral-300">
        {{ message }}
      </p>
      <slot />
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="ml-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      aria-label="Dismiss notification"
      @click="$emit('dismiss')"
    >
      <Icon name="solar:close-circle-linear" size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'success' | 'error' | 'warning' | 'warn' | 'info'
    title?: string
    message?: string
    dismissible?: boolean
  }>(),
  {
    type: 'info',
    dismissible: true,
  },
)

defineEmits<{
  dismiss: []
}>()

const iconName = computed(
  () =>
    ({
      success: 'solar:check-circle-linear',
      error: 'solar:danger-circle-linear',
      warning: 'solar:danger-triangle-linear',
      warn: 'solar:danger-triangle-linear',
      info: 'solar:info-circle-linear',
    })[props.type],
)

const iconClasses = computed(() => [
  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
  {
    success:
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    warning:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    warn: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }[props.type],
])

const classes = computed(() => [
  'flex w-full max-w-sm items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-200/70 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40',
])
</script>
