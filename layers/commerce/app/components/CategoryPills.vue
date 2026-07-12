<template>
  <!-- Hidden measurement row — identical markup, gives real pill widths -->
  <div
    ref="measureRow"
    class="pointer-events-none invisible absolute flex flex-nowrap gap-2"
    aria-hidden="true"
  >
    <button
      class="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
    >
      All
    </button>
    <button
      v-for="cat in categories"
      :key="`m-${cat.id}`"
      class="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
    >
      <!-- Same size as the real chip icon so measurement is accurate -->
      <span
        class="shrink-0 rounded-full"
        :class="cat.thumbnailCatUrl ? 'h-3.5 w-3.5' : 'h-3 w-3'"
      />
      {{ cat.name }}
    </button>
    <!-- Reserve space for the "more" button -->
    <button
      class="flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
    >
      00 more
    </button>
  </div>

  <!-- Visible pill bar -->
  <div
    ref="pillBar"
    v-bind="$attrs"
    class="scrollbar-hide -mx-4 flex flex-nowrap gap-2 overflow-hidden px-4 pb-1"
  >
    <button
      class="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all"
      :class="
        modelValue === null
          ? 'bg-brand text-white shadow-sm shadow-brand/30'
          : 'border border-gray-200 text-gray-600 hover:border-gray-400 dark:border-neutral-700 dark:text-neutral-400'
      "
      @click="emit('update:modelValue', null)"
    >
      All
    </button>

    <button
      v-for="cat in visibleCategories"
      :key="cat.id"
      class="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all"
      :class="
        modelValue === cat.slug
          ? 'bg-brand text-white shadow-sm shadow-brand/30'
          : 'border border-gray-200 text-gray-600 hover:border-gray-400 dark:border-neutral-700 dark:text-neutral-400'
      "
      @click="emit('update:modelValue', cat.slug)"
    >
      <!-- Real image when available, coloured dot otherwise -->
      <img
        v-if="cat.thumbnailCatUrl"
        :src="catThumb(cat.thumbnailCatUrl, 32)"
        :alt="cat.name"
        class="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
        :class="modelValue === cat.slug ? 'ring-1 ring-white/60' : ''"
      />
      <span
        v-else
        class="h-3 w-3 shrink-0 rounded-full"
        :style="{
          background:
            modelValue === cat.slug
              ? 'rgba(255,255,255,0.7)'
              : getCategoryVisual(cat.name, cat.slug).color,
        }"
      />
      {{ cat.name }}
    </button>

    <!-- "More" trigger -->
    <button
      v-if="hiddenCount > 0"
      class="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3.5 py-1.5 text-[13px] font-semibold transition-all hover:border-gray-400 dark:border-neutral-700 dark:text-neutral-400"
      :class="hasHiddenSelection ? 'border-brand/40 text-brand' : 'text-gray-600'"
      @click="open = true"
    >
      <Icon name="solar:widget-2-linear" size="14" />
      {{ hasHiddenSelection ? selectedName : `${hiddenCount} more` }}
      <Icon name="solar:alt-arrow-down-linear" size="14" />
    </button>
  </div>

  <!-- Category picker modal -->
  <BaseModal
    v-model="open"
    title="All categories"
    max-width="md"
    no-padding
  >
    <!-- Search -->
    <div
      class="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="relative">
        <Icon
          name="solar:magnifer-linear"
          size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Search categories…"
          class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-8 pr-4 text-[13px] placeholder-gray-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>
    </div>

    <div class="p-4">
      <!-- All -->
      <button
        class="mb-3 flex w-full items-center gap-3 rounded-xl p-3 text-left text-[13px] font-semibold transition-colors"
        :class="
          modelValue === null
            ? 'bg-brand/10 text-brand dark:bg-brand/20'
            : 'text-gray-600 hover:bg-gray-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
        "
        @click="select(null)"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-700"
        >
          <Icon
            name="solar:tag-horizontal-linear"
            size="20"
            class="text-gray-500 dark:text-neutral-400"
          />
        </div>
        <span class="flex-1">All categories</span>
        <Icon
          v-if="modelValue === null"
          name="solar:check-circle-linear"
          size="16"
          class="text-brand"
        />
      </button>

      <div
        v-if="!filteredCategories.length"
        class="py-10 text-center text-sm text-gray-400 dark:text-neutral-500"
      >
        No categories match "{{ search }}"
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="flex items-center gap-2.5 rounded-xl p-3 text-left transition-colors"
          :class="
            modelValue === cat.slug
              ? 'bg-brand/10 ring-1 ring-brand/30 dark:bg-brand/20'
              : 'hover:bg-gray-50 dark:hover:bg-neutral-800'
          "
          @click="select(cat.slug)"
        >
          <!-- Real image when available, gradient icon tile otherwise -->
          <img
            v-if="cat.thumbnailCatUrl"
            :src="catThumb(cat.thumbnailCatUrl, 80)"
            :alt="cat.name"
            class="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
          <div
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :style="{ background: getCategoryVisual(cat.name, cat.slug).gradient }"
          >
            <Icon
              :name="getCategoryVisual(cat.name, cat.slug).icon"
              size="20"
              class="text-white drop-shadow"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="truncate text-[13px] font-semibold"
              :class="
                modelValue === cat.slug
                  ? 'text-brand'
                  : 'text-gray-800 dark:text-neutral-200'
              "
            >
              {{ cat.name }}
            </p>
          </div>
          <Icon
            v-if="modelValue === cat.slug"
            name="solar:check-circle-linear"
            size="15"
            class="shrink-0 text-brand"
          />
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useElementSize } from '@vueuse/core'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import { getCategoryVisual } from '~~/layers/commerce/app/utils/categoryIconMap'
import { catThumb } from '~~/layers/core/app/utils/cloudinary'

defineOptions({ inheritAttrs: false })

const GAP = 8

const props = defineProps<{
  categories: Array<{
    id: number
    name: string
    slug: string
    thumbnailCatUrl?: string | null
  }>
  modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [slug: string | null] }>()

const open = ref(false)
const search = ref('')
const measureRow = ref<HTMLElement | null>(null)
const pillBar = ref<HTMLElement | null>(null)
const visibleCount = ref(5)

const { width: containerWidth } = useElementSize(pillBar)

watch(
  [containerWidth, () => props.categories.length],
  () => nextTick(recalculate),
  { immediate: true },
)

function recalculate() {
  if (!measureRow.value || !containerWidth.value) return

  const children = Array.from(measureRow.value.children) as HTMLElement[]
  if (children.length < 2) return

  const allBtnWidth = children[0].offsetWidth
  const moreBtnWidth = children[children.length - 1].offsetWidth
  const pills = children.slice(1, children.length - 1)

  let used = allBtnWidth + GAP
  let count = 0

  for (let i = 0; i < pills.length; i++) {
    const pillWidth = pills[i].offsetWidth + GAP
    const reserve = i < pills.length - 1 ? moreBtnWidth + GAP : 0
    if (used + pillWidth + reserve > containerWidth.value) break
    used += pillWidth
    count++
  }

  visibleCount.value = count
}

const visibleCategories = computed(() =>
  props.categories.slice(0, visibleCount.value),
)
const hiddenCount = computed(
  () => props.categories.length - visibleCount.value,
)

const hasHiddenSelection = computed(
  () =>
    props.modelValue !== null &&
    !visibleCategories.value.some((c) => c.slug === props.modelValue),
)

const selectedName = computed(
  () => props.categories.find((c) => c.slug === props.modelValue)?.name ?? '',
)

const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.categories
  return props.categories.filter((c) => c.name.toLowerCase().includes(q))
})

const select = (slug: string | null) => {
  emit('update:modelValue', slug)
  open.value = false
  search.value = ''
}
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
