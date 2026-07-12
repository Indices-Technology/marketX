<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @click.self="onBackdropClick"
      >
        <Transition name="modal-panel">
          <div
            v-if="modelValue"
            :class="[
              'relative flex w-full flex-col bg-white dark:bg-neutral-900',
              'rounded-t-3xl sm:rounded-2xl',
              maxWidthClass,
              heightClass,
            ]"
          >
            <!-- Drag handle (mobile only) -->
            <div class="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
              <div class="h-1 w-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
            </div>

            <!-- Header -->
            <div
              v-if="title || $slots.header || !hideClose"
              class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
            >
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <h2
                    v-if="title"
                    class="truncate text-base font-semibold text-gray-900 dark:text-neutral-100"
                  >
                    {{ title }}
                  </h2>
                </slot>
              </div>
              <button
                v-if="!hideClose"
                class="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Close"
                @click="$emit('update:modelValue', false)"
              >
                <Icon name="solar:close-circle-linear" size="18" />
              </button>
            </div>

            <!-- Body -->
            <div
              class="min-h-0 flex-1 overflow-y-auto"
              :class="noPadding ? '' : 'p-5'"
            >
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-neutral-800"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    height?: 'auto' | 'screen'
    hideClose?: boolean
    persistent?: boolean
    noPadding?: boolean
  }>(),
  {
    maxWidth: 'md',
    height: 'auto',
    hideClose: false,
    persistent: false,
    noPadding: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const maxWidthClass = computed(() =>
  ({
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-full sm:w-full',
  })[props.maxWidth],
)

const heightClass = computed(() =>
  props.height === 'screen'
    ? 'max-h-[92dvh] sm:max-h-[85vh]'
    : 'max-h-[92dvh] sm:max-h-[80vh]',
)

const onBackdropClick = () => {
  if (!props.persistent) emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-panel-enter-active {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease;
}
.modal-panel-leave-active {
  transition: transform 0.2s ease-in, opacity 0.15s ease;
}

/* Mobile: slide up from bottom */
.modal-panel-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.modal-panel-leave-to {
  transform: translateY(60px);
  opacity: 0;
}

/* Desktop: scale in from center */
@media (min-width: 640px) {
  .modal-panel-enter-from {
    transform: scale(0.95) translateY(0);
    opacity: 0;
  }
  .modal-panel-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
