<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        :class="anchor === 'top' ? 'items-start' : 'items-end'"
        @click.self="onBackdropClick"
      >
        <Transition
          :name="anchor === 'top' ? 'modal-panel-top' : 'modal-panel'"
        >
          <div
            v-if="modelValue"
            :class="[
              'relative flex w-full flex-col bg-white dark:bg-neutral-900',
              anchor === 'top'
                ? 'rounded-b-3xl sm:rounded-2xl'
                : 'rounded-t-3xl sm:rounded-2xl',
              maxWidthClass,
              heightClass,
            ]"
          >
            <!-- Drag handle (mobile only) — omitted when top-anchored: the
                 drag-to-dismiss affordance this implies (pull toward the
                 anchor edge) doesn't read correctly for a sheet dropping
                 from the top. -->
            <div
              v-if="anchor !== 'top'"
              class="flex justify-center pb-1 pt-3 sm:hidden"
              aria-hidden="true"
            >
              <div
                class="h-1 w-10 rounded-full bg-gray-200 dark:bg-neutral-700"
              />
            </div>

            <!-- Header -->
            <div
              v-if="title || $slots.header || !hideClose"
              class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
            >
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <h2 v-if="title" class="t-heading truncate text-base">
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
    // Mobile sheet edge. 'bottom' (default) is the existing behavior used
    // everywhere else in the app — kept as-is. 'top' is opt-in, for cases
    // where a bottom sheet doesn't fit the content's own shape (e.g. a
    // search dock whose results grow downward — anchoring it to the bottom
    // pushes the input itself toward the middle of the screen with little
    // room left below for those results before hitting the viewport edge).
    // Desktop (sm:items-center, centered scale-in) is unaffected either way.
    anchor?: 'bottom' | 'top'
  }>(),
  {
    maxWidth: 'md',
    height: 'auto',
    hideClose: false,
    persistent: false,
    noPadding: false,
    anchor: 'bottom',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const maxWidthClass = computed(
  () =>
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
  transition:
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}
.modal-panel-leave-active {
  transition:
    transform 0.2s ease-in,
    opacity 0.15s ease;
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

/* Top-anchored variant (anchor="top") — same timing/easing as the default
   bottom-sheet transition above, mirrored to slide down from the top
   instead of up from the bottom. Desktop centering/scale-in is identical
   to the default variant since anchor only affects the mobile sheet edge. */
.modal-panel-top-enter-active {
  transition:
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}
.modal-panel-top-leave-active {
  transition:
    transform 0.2s ease-in,
    opacity 0.15s ease;
}
.modal-panel-top-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.modal-panel-top-leave-to {
  transform: translateY(-60px);
  opacity: 0;
}
@media (min-width: 640px) {
  .modal-panel-top-enter-from {
    transform: scale(0.95) translateY(0);
    opacity: 0;
  }
  .modal-panel-top-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
