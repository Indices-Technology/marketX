<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    :class="[
      'rounded-xl p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex flex-col gap-2',
      to ? 'hover:border-gray-200 dark:hover:border-neutral-700 transition-colors cursor-pointer' : '',
    ]"
  >
    <div :class="`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20`">
      <Icon :name="icon" size="18" :class="`text-${color}-500`" />
    </div>
    <div>
      <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100 tabular-nums">
        {{ value.toLocaleString() }}
      </p>
      <p class="text-[12px] text-gray-400 dark:text-neutral-500 mt-0.5">{{ label }}</p>
    </div>
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

defineProps<{
  label: string
  value: number
  icon: string
  color: string
  to?: string
}>()
</script>
