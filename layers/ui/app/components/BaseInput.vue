<template>
  <BaseFormField
    :id="id"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
  >
    <template #default="{ id: fieldId, describedBy }">
      <div class="relative flex items-center">
        <div
          v-if="iconLeft"
          class="pointer-events-none absolute left-3 flex items-center"
        >
          <Icon
            :name="iconLeft"
            size="16"
            class="text-gray-400 dark:text-neutral-500"
            :class="{ 'text-brand dark:text-brand': isFocused }"
          />
        </div>

        <input
          :id="fieldId"
          ref="inputRef"
          v-bind="inputAttrs"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :autocomplete="autocomplete"
          :aria-describedby="describedBy"
          :class="inputClasses"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />

        <div
          v-if="iconRight || (type === 'password')"
          class="absolute right-3 flex items-center"
        >
          <button
            v-if="type === 'password'"
            type="button"
            class="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-neutral-200"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <Icon :name="showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'" size="16" />
          </button>
          <Icon
            v-else-if="iconRight"
            :name="iconRight"
            size="16"
            class="pointer-events-none text-gray-400 dark:text-neutral-500"
          />
        </div>
      </div>
    </template>
  </BaseFormField>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue'
import BaseFormField from '~~/layers/ui/app/components/BaseFormField.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    id?: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'number' | 'url'
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    iconLeft?: string
    iconRight?: string
    autocomplete?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    type: 'text',
    size: 'md',
    disabled: false,
    required: false,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const attrs = useAttrs()
const isFocused = ref(false)
const showPassword = ref(false)

const resolvedType = computed(() => {
  if (props.type === 'password' && showPassword.value) return 'text'
  return props.type
})

const inputAttrs = computed(() => ({
  ...attrs,
  type: resolvedType.value,
}))

const sizeClasses = computed(() =>
  ({
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  })[props.size],
)

const paddingClasses = computed(() => {
  const left = props.iconLeft ? 'pl-9' : 'pl-3.5'
  const right = props.iconRight || props.type === 'password' ? 'pr-9' : 'pr-3.5'
  return `${left} ${right}`
})

const inputClasses = computed(() => [
  'w-full rounded-xl border bg-white outline-none transition-all duration-150',
  'text-gray-900 placeholder-gray-400',
  'dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-600',
  sizeClasses.value,
  paddingClasses.value,
  props.error
    ? 'border-red-400 ring-1 ring-red-300/40 dark:border-red-600'
    : isFocused.value
      ? 'border-brand ring-2 ring-brand/20'
      : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600',
  props.disabled ? 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-neutral-800' : '',
])

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
