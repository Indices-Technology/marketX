<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    max-width="sm"
    :persistent="loading"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="flex gap-3">
        <div :class="iconClasses">
          <Icon :name="iconName" size="22" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm leading-6 text-gray-600 dark:text-neutral-300">
            <slot>{{ message }}</slot>
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="loading"
          @click="cancel"
        >
          {{ cancelLabel }}
        </BaseButton>
        <BaseButton
          :variant="danger ? 'danger' : 'primary'"
          size="sm"
          :loading="loading"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    danger?: boolean
    icon?: string
  }>(),
  {
    title: 'Confirm action',
    message: 'Are you sure you want to continue?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    loading: false,
    danger: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const iconName = computed(
  () =>
    props.icon ||
    (props.danger ? 'solar:danger-triangle-linear' : 'solar:question-circle-linear'),
)

const iconClasses = computed(() => [
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
  props.danger
    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-brand/10 text-brand',
])

const cancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>
