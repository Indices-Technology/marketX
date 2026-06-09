<template>
  <div class="flex flex-col gap-1.5">
    <div v-if="label || $slots.label" class="flex items-center justify-between gap-3">
      <label
        :for="fieldId"
        class="text-xs font-semibold text-gray-600 dark:text-neutral-400"
      >
        <slot name="label">
          {{ label }}
          <span v-if="required" class="ml-0.5 text-brand" aria-hidden="true">*</span>
        </slot>
      </label>
      <slot name="label-actions" />
    </div>

    <slot :id="fieldId" :describedBy="describedBy" />

    <p
      v-if="error || hint || $slots.hint"
      :id="describedBy"
      class="text-2xs"
      :class="error ? 'text-red-500' : 'text-gray-400 dark:text-neutral-500'"
    >
      <slot name="hint">{{ error || hint }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    hint?: string
    error?: string
    required?: boolean
  }>(),
  {
    required: false,
  },
)

const generatedId = useId()
const slots = useSlots()
const fieldId = computed(() => props.id || generatedId)
const describedBy = computed(() =>
  props.error || props.hint || slots.hint ? `${fieldId.value}-description` : undefined,
)
</script>
