<template>
  <BaseFormField
    :id="id"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
  >
    <template #default="{ id: fieldId, describedBy }">
      <div class="relative">
        <select
          :id="fieldId"
          ref="selectRef"
          v-bind="selectAttrs"
          :value="modelValue"
          :disabled="disabled"
          :required="required"
          :aria-describedby="describedBy"
          :class="selectClasses"
          @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        >
          <option v-if="placeholder" value="" :disabled="placeholderDisabled">
            {{ placeholder }}
          </option>
          <slot>
            <option
              v-for="option in options"
              :key="String(option.value)"
              :value="option.value"
              :disabled="option.disabled"
            >
              {{ option.label }}
            </option>
          </slot>
        </select>
        <Icon
          name="mdi:chevron-down"
          size="18"
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
        />
      </div>
    </template>
  </BaseFormField>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import BaseFormField from '~~/layers/ui/app/components/BaseFormField.vue'

defineOptions({
  inheritAttrs: false,
})

type SelectOption = {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    options?: SelectOption[]
    id?: string
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    placeholderDisabled?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    options: () => [],
    disabled: false,
    required: false,
    placeholderDisabled: true,
    size: 'md',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const selectRef = ref<HTMLSelectElement | null>(null)
const isFocused = ref(false)

const selectAttrs = computed(() => ({ ...attrs }))

const sizeClasses = computed(() =>
  ({
    sm: 'h-8 pl-3 pr-9 text-xs',
    md: 'h-10 pl-3.5 pr-10 text-sm',
    lg: 'h-12 pl-4 pr-10 text-base',
  })[props.size],
)

const selectClasses = computed(() => [
  'w-full appearance-none rounded-xl border bg-white outline-none transition-all duration-150',
  'text-gray-900 dark:bg-neutral-900 dark:text-neutral-100',
  sizeClasses.value,
  props.error
    ? 'border-red-400 ring-1 ring-red-300/40 dark:border-red-600'
    : isFocused.value
      ? 'border-brand ring-2 ring-brand/20'
      : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600',
  props.disabled ? 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-neutral-800' : '',
])

defineExpose({ focus: () => selectRef.value?.focus() })
</script>
