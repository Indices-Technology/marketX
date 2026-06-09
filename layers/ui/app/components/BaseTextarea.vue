<template>
  <BaseFormField
    :id="id"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
  >
    <template #default="{ id: fieldId, describedBy }">
      <textarea
        :id="fieldId"
        ref="textareaRef"
        v-bind="textareaAttrs"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        :aria-describedby="describedBy"
        :class="textareaClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </template>
  </BaseFormField>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import BaseFormField from '~~/layers/ui/app/components/BaseFormField.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string
    id?: string
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    rows?: number
    resize?: 'none' | 'vertical' | 'both'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    modelValue: '',
    disabled: false,
    required: false,
    rows: 4,
    resize: 'vertical',
    size: 'md',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isFocused = ref(false)

const textareaAttrs = computed(() => ({ ...attrs }))

const sizeClasses = computed(() =>
  ({
    sm: 'min-h-20 px-3 py-2 text-xs',
    md: 'min-h-24 px-3.5 py-2.5 text-sm',
    lg: 'min-h-28 px-4 py-3 text-base',
  })[props.size],
)

const resizeClass = computed(() =>
  ({
    none: 'resize-none',
    vertical: 'resize-y',
    both: 'resize',
  })[props.resize],
)

const textareaClasses = computed(() => [
  'w-full rounded-xl border bg-white outline-none transition-all duration-150',
  'text-gray-900 placeholder-gray-400',
  'dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-600',
  sizeClasses.value,
  resizeClass.value,
  props.error
    ? 'border-red-400 ring-1 ring-red-300/40 dark:border-red-600'
    : isFocused.value
      ? 'border-brand ring-2 ring-brand/20'
      : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600',
  props.disabled ? 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-neutral-800' : '',
])

defineExpose({ focus: () => textareaRef.value?.focus() })
</script>
