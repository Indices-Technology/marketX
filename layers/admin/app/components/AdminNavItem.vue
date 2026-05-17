<template>
  <NuxtLink
    v-if="!adminOnly || isAdmin"
    :to="to"
    :class="[
      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
      isActive
        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100',
    ]"
    v-bind="$attrs"
  >
    <Icon :name="icon" size="18" />
    <span class="flex-1">{{ label }}</span>
    <span
      v-if="badge && badge > 0"
      class="min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold"
    >{{ badge > 99 ? '99+' : badge }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

const props = defineProps<{
  to: string
  icon: string
  label: string
  badge?: number
  exact?: boolean
  adminOnly?: boolean
}>()

const route = useRoute()
const profile = useProfileStore()

const isAdmin = computed(() => profile.me?.role === 'admin')
const isActive = computed(() =>
  props.exact ? route.path === props.to : route.path.startsWith(props.to),
)
</script>
