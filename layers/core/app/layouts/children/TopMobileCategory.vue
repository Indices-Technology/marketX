<template>
  <div
    class="border-b border-gray-200/60 bg-white/90 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/90"
    v-bind="$attrs"
  >
    <div class="scrollbar-hide flex items-center gap-1 overflow-x-auto px-3 py-2">
      <button
        v-for="tab in FEED_TABS"
        :key="tab.id"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
        :class="activeTab === tab.id
          ? 'bg-brand/10 text-brand'
          : 'text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-white/6 dark:hover:text-neutral-100'"
        @click="setTab(tab.id)"
      >
        <Icon :name="tab.icon" size="14" class="shrink-0" />
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeedTab } from '~~/layers/feed/app/composables/useFeedTab'

defineOptions({ inheritAttrs: false })

const { activeTab, setTab, FEED_TABS } = useFeedTab()
</script>

<style scoped>
/* Hide on desktop — desktop uses SideNav */
@media (min-width: 768px) {
  div {
    display: none;
  }
}

.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
