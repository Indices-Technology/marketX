<!--
  BaseMedia — the one place that decides how an arbitrary upload is delivered
  and framed.

  Sellers upload whatever their phone produced: 4:5 catalogue shots, square
  collages, landscape spec sheets, 3000 px flyers. Every surface that rendered
  those with a bare `object-cover` sliced the sides off — a spec sheet lost its
  callouts, a 2×2 collage lost two of its four photos — and several handed the
  browser the ORIGINAL Cloudinary URL, which is a multi-megabyte file on a
  Nigerian mobile connection.

  Two jobs, both handled here so no call site has to think about it:

  1. Delivery — the source is always requested through Cloudinary at `c_limit`
     (scale to fit, never crop) inside a box bounded by the container's longest
     side and bucketed so a few sizes serve every viewport and stay CDN-cached.
     `c_limit` is the important part: crop at source and then letterbox in CSS
     and you letterbox a crop — the discarded pixels never reach the browser,
     and the delivered image reports the box's own ratio, so it always looks
     like a perfect fit whatever it started as.

  2. Framing — because delivery preserves the ratio, the image's natural size
     IS the source's shape, and the fit follows from it. `tolerance` is the
     fraction of the frame `object-cover` would throw away: a 9:16 clip in a
     full-screen frame loses ~11 % and stays edge-to-edge, a square collage in
     that same frame loses ~37 % and is shown whole, on the flat surface the
     call site names via `backdropClass`.

  No blurred bed behind the letterbox. It looked good and cost too much: a
  full-bleed `filter: blur()` per media item is re-composited by the GPU every
  frame it moves, and on a feed of multi-photo carousels that measured at 2.2M
  px² of live blur on a 390x664 phone — enough to drag the swipe. Baking the
  blur into the asset removed the compositing cost but not the taste for it;
  flat is faster still, and reads as deliberate rather than as an effect.
-->
<template>
  <div
    ref="boxRef"
    class="relative h-full w-full overflow-hidden"
    :class="backdropClass"
  >
    <video
      v-if="type === 'VIDEO' && resolvedSrc"
      ref="mediaEl"
      :src="resolvedSrc"
      :poster="posterSrc"
      class="relative h-full w-full transition-opacity duration-300"
      :class="[objectClass, loaded ? 'opacity-100' : 'opacity-0']"
      v-bind="$attrs"
      @loadedmetadata="onVideoMeta"
    />
    <img
      v-else-if="type !== 'VIDEO' && resolvedSrc"
      ref="mediaEl"
      :src="resolvedSrc"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="relative h-full w-full transition-opacity duration-300"
      :class="[objectClass, loaded ? 'opacity-100' : 'opacity-0']"
      v-bind="$attrs"
      @load="onImageLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  cloudinaryUrl,
  videoFeedUrl,
  videoThumb,
} from '~~/layers/core/app/utils/cloudinary'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src?: string | null
    type?: 'IMAGE' | 'VIDEO'
    alt?: string
    /**
     * smart   — fill the frame only when the crop is minor, else show whole.
     * cover   — always fill (crops as much as it takes).
     * contain — always whole.
     */
    fit?: 'smart' | 'cover' | 'contain'
    /**
     * Fraction of the frame `cover` may discard before `smart` shows the media
     * whole instead. Full-bleed surfaces want this tight; a browse grid, whose
     * fixed row height makes letterboxing costly, can afford to be looser.
     */
    tolerance?: number
    /** Cap on the delivered longest side, in CSS px before DPR. */
    maxSize?: number
    /** Surface the media sits on — seen in the letterbox bands, and while
        the media is still loading. */
    backdropClass?: string
    eager?: boolean
  }>(),
  {
    src: null,
    type: 'IMAGE',
    alt: '',
    fit: 'smart',
    tolerance: 0.18,
    maxSize: 1080,
    backdropClass: 'bg-gray-100 dark:bg-neutral-900',
  },
)

const emit = defineEmits<{ load: []; error: [e: Event] }>()

const boxRef = ref<HTMLElement | null>(null)
const mediaEl = ref<HTMLImageElement | HTMLVideoElement | null>(null)
const loaded = ref(false)

// ── Geometry ─────────────────────────────────────────────────────────────
const boxW = ref(0)
const boxH = ref(0)
const natW = ref(0)
const natH = ref(0)

let ro: ResizeObserver | null = null
const measure = () => {
  const el = boxRef.value
  if (!el) return
  boxW.value = el.clientWidth
  boxH.value = el.clientHeight
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(measure)
    if (boxRef.value) ro.observe(boxRef.value)
  }
})
onUnmounted(() => ro?.disconnect())

// A new src is a new asset — its shape and load state don't carry over.
watch(
  () => props.src,
  () => {
    loaded.value = false
    natW.value = 0
    natH.value = 0
  },
)

const onImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  natW.value = img.naturalWidth
  natH.value = img.naturalHeight
  loaded.value = true
  emit('load')
}
const onVideoMeta = (e: Event) => {
  const v = e.target as HTMLVideoElement
  natW.value = v.videoWidth
  natH.value = v.videoHeight
  loaded.value = true
  emit('load')
}
const onError = (e: Event) => {
  // Still reveal it — a broken <img> beats an invisible element the user
  // can't tell apart from a load that never finishes.
  loaded.value = true
  emit('error', e)
}

// ── Delivery ─────────────────────────────────────────────────────────────
// A handful of buckets rather than the exact pixel width: every viewport would
// otherwise request its own rendition, and each one is a Cloudinary
// transformation billed and cached separately.
const BUCKETS = [240, 320, 400, 480, 640, 800, 1080, 1440]

const targetSize = computed(() => {
  const longest = Math.max(boxW.value, boxH.value)
  // Before the measurement lands (SSR, first tick) fall back to the cap, so
  // the markup is never emitted with an untransformed original.
  if (!longest) return props.maxSize
  const dpr =
    typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1
  return Math.min(
    BUCKETS.find((b) => b >= longest * dpr) ?? 1440,
    props.maxSize,
  )
})

const resolvedSrc = computed(() => {
  if (!props.src) return ''
  if (props.type === 'VIDEO') return videoFeedUrl(props.src)
  return cloudinaryUrl(props.src, {
    width: targetSize.value,
    height: targetSize.value,
    crop: 'limit', // fit inside the box, never discard pixels at source
    quality: 'auto:good',
    format: 'auto',
  })
})

const posterSrc = computed(() =>
  props.type === 'VIDEO' && props.src
    ? videoThumb(props.src, { width: targetSize.value, crop: 'limit' })
    : undefined,
)

// ── Framing ──────────────────────────────────────────────────────────────
/** Fraction of the media `object-cover` would crop away in this box. */
const coverLoss = computed(() => {
  if (!boxW.value || !boxH.value || !natW.value || !natH.value) return 0
  const box = boxW.value / boxH.value
  const media = natW.value / natH.value
  return 1 - Math.min(box / media, media / box)
})

const objectClass = computed(() => {
  if (props.fit === 'cover') return 'object-cover'
  if (props.fit === 'contain') return 'object-contain'
  // Unmeasured, `coverLoss` is 0 and this reads as cover — the right default
  // for the common case, and invisible either way: the media is held at
  // opacity-0 until `load`, which is also when the real shape arrives.
  return coverLoss.value <= props.tolerance ? 'object-cover' : 'object-contain'
})

defineExpose({ mediaEl, boxRef })
</script>
