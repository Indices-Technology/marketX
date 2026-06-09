<template>
  <BaseAvatar
    :src="imgAvatar(logo)"
    :name="storeName"
    variant="store"
    :size="size"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import BaseAvatar from '~~/layers/ui/app/components/BaseAvatar.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    storeName?: string
    logo?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)
</script>
