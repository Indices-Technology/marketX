<template>
  <NuxtLink
    v-if="!adminOnly || isAdmin"
    :to="to"
    :class="[
      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
      isActive
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
    ]"
    v-bind="$attrs"
  >
    <Icon :name="icon" size="18" />
    <span class="flex-1">{{ label }}</span>
    <span
      v-if="badge && badge > 0"
      class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
      >{{ badge > 99 ? '99+' : badge }}</span
    >
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
