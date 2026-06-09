<template>
  <!--
    Cloudinary URLs: transformed at source (WebP/AVIF via f_auto, sized, quality-tuned).
    External/static URLs: routed through NuxtImg's IPX provider for on-the-fly WebP.
    Both paths get loading="lazy" + decoding="async" for free.
    Parent class is merged via $attrs (Vue merges multiple :class bindings automatically).
  -->
  <img
    v-if="isCloudinary"
    :src="cloudSrc"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    :class="fitClass"
    v-bind="$attrs"
    @error="$emit('error', $event)"
    @load="$emit('load', $event)"
  />
  <NuxtImg
    v-else-if="src"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    format="webp"
    loading="lazy"
    :class="fitClass"
    v-bind="$attrs"
    @error="$emit('error', $event)"
    @load="$emit('load', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'scale'
    quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low'
  }>(),
  {
    fit: 'cover',
    quality: 'auto:good',
  },
)

defineEmits<{ error: [e: Event]; load: [e: Event] }>()

const isCloudinary = computed(
  () => !!props.src && props.src.includes('cloudinary.com'),
)

const cloudSrc = computed(() =>
  cloudinaryUrl(props.src, {
    width: props.width,
    height: props.height,
    crop: props.fit === 'contain' ? 'fit' : props.fit === 'fill' ? 'scale' : 'fill',
    quality: props.quality,
    format: 'auto',
  }),
)

// Just the object-fit class — parent class comes through $attrs and is merged by Vue
const FIT_CLASS = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  scale: 'object-scale-down',
} as const

const fitClass = computed(() => FIT_CLASS[props.fit])
</script>
