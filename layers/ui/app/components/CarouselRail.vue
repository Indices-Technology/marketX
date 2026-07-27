<!--
  CarouselRail — a horizontal scroll rail wrapped in a light frame with desktop
  ‹ › arrow controls and edge fade cues. Borrowed from the "one card, sliding
  tiles" carousel pattern to keep a row of content in a single contained unit
  instead of a bare strip that bleeds off the page edge.

  Mobile keeps native swipe (arrows hide < md). Arrows auto-hide at the start /
  end of the range. Drop the row items straight into the default slot — this
  component owns the flex track, the gap, and the scrolling.

  Frame chrome is deliberately light (gray-100 border, no shadow) so it contains
  without turning every product row into a heavy "card".
-->
<template>
  <div class="cr-frame" :class="{ 'cr-frame--plain': plain }">
    <div
      v-if="fade"
      class="cr-fade cr-fade--l"
      :class="{ 'opacity-0': atStart }"
    />
    <div
      v-if="fade"
      class="cr-fade cr-fade--r"
      :class="{ 'opacity-0': atEnd }"
    />

    <button
      v-show="!atStart"
      type="button"
      class="cr-arrow cr-arrow--l"
      aria-label="Scroll back"
      @click="page(-1)"
    >
      <Icon name="solar:alt-arrow-left-linear" size="18" />
    </button>
    <button
      v-show="!atEnd"
      type="button"
      class="cr-arrow cr-arrow--r"
      aria-label="Scroll forward"
      @click="page(1)"
    >
      <Icon name="solar:alt-arrow-right-linear" size="18" />
    </button>

    <div
      ref="track"
      class="cr-track"
      :style="{ gap: gap + 'px', padding: pad }"
      @scroll="measure"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

withDefaults(
  defineProps<{
    /** gap between items, px */
    gap?: number
    /** show edge fade cues */
    fade?: boolean
    /** drop the border/bg frame — just arrows + scroll */
    plain?: boolean
    /** inner padding (CSS value) */
    pad?: string
  }>(),
  { gap: 12, fade: true, plain: false, pad: '12px' },
)

const track = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(false)

function measure() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 4
  atEnd.value = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4
}

function page(dir: number) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
}

let ro: ResizeObserver | null = null
onMounted(async () => {
  await nextTick()
  measure()
  // Recompute when the track resizes or its children populate (async data).
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    ro = new ResizeObserver(() => measure())
    ro.observe(track.value)
  }
  window.addEventListener('resize', measure)
})
onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<style scoped>
.cr-frame {
  position: relative;
  overflow: hidden;
}
.cr-frame:not(.cr-frame--plain) {
  border-radius: 1rem;
  border: 1px solid rgb(243 244 246); /* gray-100 */
  background: #fff;
}
:global(.dark) .cr-frame:not(.cr-frame--plain) {
  border-color: rgb(38 38 38); /* neutral-800 */
  background: rgb(10 10 10); /* neutral-950 */
}

.cr-track {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.cr-track::-webkit-scrollbar {
  display: none;
}

.cr-fade {
  pointer-events: none;
  position: absolute;
  top: 0;
  z-index: 10;
  height: 100%;
  width: 2rem;
  transition: opacity 0.2s;
}
.cr-fade--l {
  left: 0;
  background: linear-gradient(to right, #fff, transparent);
}
.cr-fade--r {
  right: 0;
  background: linear-gradient(to left, #fff, transparent);
}
:global(.dark) .cr-fade--l {
  background: linear-gradient(to right, rgb(10 10 10), transparent);
}
:global(.dark) .cr-fade--r {
  background: linear-gradient(to left, rgb(10 10 10), transparent);
}

.cr-arrow {
  display: none;
  position: absolute;
  top: 50%;
  z-index: 20;
  height: 2rem;
  width: 2rem;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgb(243 244 246);
  background: #fff;
  color: rgb(31 41 55);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
  transition: background 0.15s;
}
.cr-arrow:hover {
  background: rgb(249 250 251);
}
.cr-arrow--l {
  left: 0.5rem;
}
.cr-arrow--r {
  right: 0.5rem;
}
:global(.dark) .cr-arrow {
  border-color: rgb(38 38 38);
  background: rgb(23 23 23);
  color: rgb(229 229 229);
}
:global(.dark) .cr-arrow:hover {
  background: rgb(38 38 38);
}
@media (min-width: 768px) {
  .cr-arrow {
    display: flex;
  }
}
</style>
