<template>
  <div>
    <!-- SVG bar chart -->
    <div class="relative h-40 w-full" aria-hidden="true">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        class="h-full w-full overflow-visible"
      >
        <!-- Y-axis gridlines -->
        <line
          v-for="y in gridLines"
          :key="y"
          :x1="0"
          :y1="y"
          :x2="W"
          :y2="y"
          class="stroke-gray-100 dark:stroke-neutral-800"
          stroke-width="1"
        />

        <!-- Bars -->
        <rect
          v-for="(p, i) in bars"
          :key="i"
          :x="p.x"
          :y="p.y"
          :width="barW"
          :height="p.h"
          rx="3"
          class="fill-brand opacity-80"
        />
      </svg>

      <!-- Zero-line / baseline -->
      <div class="absolute bottom-0 left-0 right-0 h-px bg-gray-200 dark:bg-neutral-700" />
    </div>

    <!-- X-axis labels: show ~6 evenly spaced -->
    <div class="mt-1.5 flex justify-between">
      <span
        v-for="label in xLabels"
        :key="label"
        class="text-[10px] text-gray-400 dark:text-neutral-500"
      >{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  points: Array<{ date: string; revenue: number; orders: number; views: number }>
}>()

const W = 600
const H = 120
const PADDING = 4

const maxRevenue = computed(() => Math.max(...props.points.map((p) => p.revenue), 1))

const barW = computed(() => {
  const n = props.points.length
  return Math.max(2, (W - PADDING * 2) / n - 2)
})

const bars = computed(() =>
  props.points.map((p, i) => {
    const n = props.points.length
    const slotW = (W - PADDING * 2) / n
    const x = PADDING + i * slotW + (slotW - barW.value) / 2
    const h = Math.max(2, (p.revenue / maxRevenue.value) * (H - PADDING))
    const y = H - h
    return { x, y, h }
  }),
)

const gridLines = computed(() => {
  return [H * 0.25, H * 0.5, H * 0.75].map((v) => Math.round(v))
})

// Show ~5 evenly spaced x labels
const xLabels = computed(() => {
  const pts = props.points
  if (!pts.length) return []
  const step = Math.max(1, Math.floor(pts.length / 5))
  const labels: string[] = []
  for (let i = 0; i < pts.length; i += step) {
    const d = new Date(pts[i]!.date)
    labels.push(d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }))
  }
  return labels
})
</script>
