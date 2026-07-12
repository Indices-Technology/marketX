<template>
  <div
    ref="wrapper"
    class="group relative h-full w-full bg-black"
    @mouseenter="showControls = true"
    @mouseleave="playing && (showControls = false)"
    @touchstart.passive="onTouchStart"
  >
    <video
      ref="videoEl"
      :src="optimizedSrc"
      :poster="resolvedPoster"
      :preload="nearViewport ? 'metadata' : 'none'"
      :autoplay="autoplay"
      :loop="loop"
      class="h-full w-full object-contain"
      playsinline
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMeta"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @waiting="buffering = true"
      @canplay="buffering = false"
      @click="togglePlay"
    />

    <!-- Buffering spinner -->
    <div
      v-if="buffering"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <Icon name="eos-icons:loading" size="36" class="text-white/80" />
    </div>

    <!-- Big play overlay (shown when paused) -->
    <Transition name="fade">
      <button
        v-if="!playing && !buffering"
        class="absolute inset-0 flex items-center justify-center"
        aria-label="Play"
        @click="togglePlay"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform active:scale-95"
        >
          <Icon name="solar:play-bold" size="36" class="translate-x-0.5 text-white" />
        </div>
      </button>
    </Transition>

    <!-- Bottom controls bar -->
    <Transition name="slide-up">
      <div
        v-show="showControls || !playing"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8"
      >
        <!-- Progress bar -->
        <div
          class="relative mb-2 h-1 cursor-pointer rounded-full bg-white/30"
          @click="seek"
        >
          <div
            class="absolute left-0 top-0 h-full rounded-full bg-white/20"
            :style="{ width: `${bufferedPct}%` }"
          />
          <div
            class="absolute left-0 top-0 h-full rounded-full bg-brand transition-none"
            :style="{ width: `${progressPct}%` }"
          />
          <div
            class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
            :style="{ left: `calc(${progressPct}% - 6px)` }"
          />
        </div>

        <!-- Buttons row -->
        <div class="flex items-center gap-2">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:scale-95"
            :aria-label="playing ? 'Pause' : 'Play'"
            @click="togglePlay"
          >
            <Icon :name="playing ? 'solar:pause-bold' : 'solar:play-bold'" size="20" />
          </button>

          <span class="flex-1 text-[11px] tabular-nums text-white/80">
            {{ fmtTime(currentTime) }} / {{ fmtTime(duration) }}
          </span>

          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:scale-95"
            :aria-label="isMuted ? 'Unmute' : 'Mute'"
            @click="toggleMute"
          >
            <Icon
              :name="isMuted ? 'solar:muted-linear' : 'solar:volume-loud-linear'"
              size="18"
            />
          </button>

          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:scale-95"
            aria-label="Fullscreen"
            @click="toggleFullscreen"
          >
            <Icon
              :name="isFullscreen ? 'solar:minimize-square-3-linear' : 'solar:maximize-square-3-linear'"
              size="20"
            />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useState } from '#imports'
import { videoFeedUrl, videoThumb } from '~~/layers/core/app/utils/cloudinary'

const props = withDefaults(
  defineProps<{
    src: string
    poster?: string
    preload?: string
    autoplay?: boolean
    loop?: boolean
  }>(),
  {
    poster: undefined,
    preload: 'metadata',
    autoplay: false,
    loop: false,
  },
)

// ── Global mute state — same key as useFeedSound, no cross-layer import needed
const soundEnabled = useState('feed-sound-enabled', () => false)
const isMuted = computed(() => !soundEnabled.value)

watch(
  isMuted,
  (val) => {
    if (videoEl.value) videoEl.value.muted = val
  },
  { immediate: false },
)

// ── Cloudinary optimization ──────────────────────────────────────────────────
const optimizedSrc = computed(() => videoFeedUrl(props.src))
const resolvedPoster = computed(
  () => props.poster || videoThumb(props.src, { width: 720, height: 720 }),
)

// ── Refs ─────────────────────────────────────────────────────────────────────
const videoEl = ref<HTMLVideoElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)

const playing = ref(false)
const buffering = ref(false)
const showControls = ref(true)
const isFullscreen = ref(false)
const nearViewport = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const bufferedPct = ref(0)

const progressPct = computed(() =>
  duration.value ? (currentTime.value / duration.value) * 100 : 0,
)

// ── Controls visibility ──────────────────────────────────────────────────────
let hideTimer: ReturnType<typeof setTimeout> | null = null

function onTouchStart() {
  showControls.value = true
  if (hideTimer) clearTimeout(hideTimer)
  if (playing.value) {
    hideTimer = setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

// ── Playback ─────────────────────────────────────────────────────────────────
function togglePlay() {
  const v = videoEl.value
  if (!v) return
  if (v.paused) {
    v.muted = isMuted.value
    v.play()
  } else {
    v.pause()
  }
}

function toggleMute() {
  soundEnabled.value = !soundEnabled.value
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  currentTime.value = v.currentTime
  if (v.buffered.length) {
    bufferedPct.value =
      (v.buffered.end(v.buffered.length - 1) / v.duration) * 100
  }
}

function onMeta() {
  const v = videoEl.value
  if (!v) return
  duration.value = v.duration
  v.muted = isMuted.value
}

function seek(e: MouseEvent) {
  const v = videoEl.value
  if (!v || !duration.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  v.currentTime = ((e.clientX - rect.left) / rect.width) * duration.value
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    wrapper.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function fmtTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ── IntersectionObserver — defer preload until near viewport ─────────────────
let io: IntersectionObserver | null = null

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  io = new IntersectionObserver(
    (entries) => {
      if (entries[0]) nearViewport.value = entries[0].isIntersecting
    },
    { rootMargin: '200px' },
  )
  if (wrapper.value) io.observe(wrapper.value)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  io?.disconnect()
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
