<template>
  <div class="flex items-center justify-between">
    <!-- Sort dropdown -->
    <div ref="dropdownRoot" class="relative">
      <button
        class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
        @click.stop="open = !open"
      >
        <Icon :name="current.icon" size="14" class="text-gray-500 dark:text-neutral-400" />
        {{ current.label }}
        <Icon
          name="solar:alt-arrow-down-linear"
          size="13"
          class="text-gray-400 transition-transform dark:text-neutral-500"
          :class="open ? 'rotate-180' : ''"
        />
      </button>

      <Transition name="sort-menu">
        <div
          v-if="open"
          class="absolute left-0 top-[calc(100%+4px)] z-30 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          @click.stop
        >
          <button
            v-for="opt in OPTIONS"
            :key="opt.value"
            class="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors"
            :class="
              sort === opt.value
                ? 'bg-gray-50 text-brand dark:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
            "
            @click="select(opt.value)"
          >
            <Icon :name="opt.icon" size="14" />
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Layout toggle (optional) -->
    <div
      v-if="showLayoutToggle"
      class="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <button
        title="Card view"
        class="rounded-md p-1.5 transition-colors"
        :class="
          layout === 'card'
            ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-300'
        "
        @click="$emit('update:layout', 'card')"
      >
        <Icon name="solar:posts-carousel-vertical-linear" size="16" />
      </button>
      <button
        title="List view"
        class="rounded-md p-1.5 transition-colors"
        :class="
          layout === 'list'
            ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-300'
        "
        @click="$emit('update:layout', 'list')"
      >
        <Icon name="solar:list-linear" size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type SortMode = 'new' | 'best' | 'hot' | 'top' | 'rising'
export type LayoutMode = 'card' | 'list'

const props = withDefaults(
  defineProps<{
    sort: SortMode
    layout?: LayoutMode
    showLayoutToggle?: boolean
  }>(),
  { layout: 'card', showLayoutToggle: true },
)

const emit = defineEmits<{
  'update:sort': [value: SortMode]
  'update:layout': [value: LayoutMode]
}>()

const open = ref(false)
const dropdownRoot = ref<HTMLElement | null>(null)

const OPTIONS: Array<{ value: SortMode; label: string; icon: string }> = [
  { value: 'new',    label: 'New',    icon: 'solar:clock-circle-linear' },
  { value: 'best',   label: 'Best',   icon: 'solar:fire-bold' },
  { value: 'hot',    label: 'Hot',    icon: 'solar:graph-up-linear' },
  { value: 'top',    label: 'Top',    icon: 'solar:arrow-up-bold' },
  { value: 'rising', label: 'Rising', icon: 'solar:rocket-2-linear' },
]

const current = computed(() => OPTIONS.find((o) => o.value === props.sort) ?? OPTIONS[0]!)

const select = (value: SortMode) => {
  emit('update:sort', value)
  open.value = false
}

const onOutsideClick = (e: MouseEvent) => {
  if (dropdownRoot.value && !dropdownRoot.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onOutsideClick))
onUnmounted(() => document.removeEventListener('click', onOutsideClick))
</script>

<style scoped>
.sort-menu-enter-active,
.sort-menu-leave-active {
  transition:
    opacity 0.12s,
    transform 0.12s;
}
.sort-menu-enter-from,
.sort-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
