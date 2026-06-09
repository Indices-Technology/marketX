<template>
  <BaseAvatar :src="imgAvatar(avatar)" :name="username" :size="mappedSize" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import BaseAvatar from '~~/layers/ui/app/components/BaseAvatar.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    username: string
    avatar?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  }>(),
  { size: 'md' },
)

// Avatar used 'sm'|'md'|'lg'|'xl'|'2xl' — all map 1-to-1 to BaseAvatar
const mappedSize = computed(() => props.size as 'sm' | 'md' | 'lg' | 'xl' | '2xl')
</script>
