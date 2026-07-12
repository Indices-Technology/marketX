<!--
  AppIcon — MarketX's semantic icon layer.

  Components reference icons by MEANING (`<AppIcon name="home" :active="..." />`),
  and this single map decides which glyph actually renders. That means the whole
  app's iconography can be restyled — or a bespoke `mx:` brand icon slotted in —
  by editing THIS file, instead of touching hundreds of call sites.

  Base set: Solar (rounded, warm, premium). Convention:
    default → -linear (outline, inactive)   active → -bold (filled, selected)

  Unmapped names pass straight through, so raw `solar:*` / `mdi:*` / `mx:*` names
  still work and migration can be incremental.
-->
<template>
  <Icon :name="resolved" :size="size" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

type IconPair = { default: string; active: string }

const ICONS: Record<string, IconPair> = {
  // ── Primary navigation ──────────────────────────────────────────────
  home: { default: 'solar:home-2-linear', active: 'solar:home-2-bold' },
  discover: { default: 'solar:compass-linear', active: 'solar:compass-bold' },
  reels: {
    default: 'solar:clapperboard-play-linear',
    active: 'solar:clapperboard-play-bold',
  },
  nearby: {
    default: 'solar:map-point-wave-linear',
    active: 'solar:map-point-wave-bold',
  },
  squares: { default: 'solar:shop-2-linear', active: 'solar:shop-2-bold' },
  // ── Actions ─────────────────────────────────────────────────────────
  create: { default: 'solar:add-circle-linear', active: 'solar:add-circle-bold' },
  notifications: { default: 'solar:bell-linear', active: 'solar:bell-bold' },
  inbox: { default: 'solar:chat-round-linear', active: 'solar:chat-round-bold' },
  cart: {
    default: 'solar:cart-large-2-linear',
    active: 'solar:cart-large-2-bold',
  },
  signin: { default: 'solar:login-3-linear', active: 'solar:login-3-linear' },
}

const props = withDefaults(
  defineProps<{
    name: string
    active?: boolean
    size?: number | string
  }>(),
  { active: false, size: 24 },
)

const resolved = computed(() => {
  const entry = ICONS[props.name]
  if (!entry) return props.name // unmapped → pass raw icon name through
  return props.active ? entry.active : entry.default
})
</script>
