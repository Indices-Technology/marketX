<!-- layers/map/app/components/MapView.vue -->
<template>
  <div class="map-root">
    <div ref="mapEl" class="map-canvas" aria-label="Sellers near you" />

    <!-- Right controls: view-mode toggle + style switcher -->
    <div class="map-controls-right">
      <!-- View mode segmented control -->
      <div class="view-mode-group">
        <button
          v-for="m in viewModes"
          :key="m.id"
          class="vm-btn"
          :class="{ 'vm-btn--active': viewMode === m.id }"
          :title="m.label"
          @click="$emit('update:viewMode', m.id)"
        >
          <Icon :name="m.icon" size="13" />
          <span class="vm-label">{{ m.label }}</span>
        </button>
      </div>

      <!-- Style switcher -->
      <div class="style-group">
        <button
          v-for="s in mapStyles"
          :key="s.id"
          class="style-btn"
          :class="{ 'style-btn--active': activeStyle === s.id }"
          :title="s.label"
          @click="switchStyle(s.id)"
        >
          <Icon :name="s.icon" size="15" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { IMapSeller, IMapSquare } from '../types/map.types'

export type ViewMode = 'stores' | 'both' | 'squares'

const props = defineProps<{
  sellers: IMapSeller[]
  squares: IMapSquare[]
  userLat: number | null
  userLng: number | null
  selectedSlug: string | null
  radiusKm: number
  viewMode?: ViewMode
}>()

const emit = defineEmits<{
  'select-seller': [seller: IMapSeller]
  'select-square': [square: IMapSquare]
  'deselect': []
  'update:viewMode': [mode: ViewMode]
}>()

const viewModes: { id: ViewMode; icon: string; label: string }[] = [
  { id: 'stores',  icon: 'mdi:store-outline',      label: 'Stores'  },
  { id: 'both',    icon: 'mdi:layers-outline',       label: 'Both'    },
  { id: 'squares', icon: 'mdi:storefront-outline',   label: 'Squares' },
]

const mapEl = ref<HTMLElement | null>(null)
let map: any = null
let maplibregl: any = null

const markerMap = new Map<string, { marker: any; el: HTMLElement }>()
const squareMarkerMap = new Map<string, { marker: any; el: HTMLElement }>()
let userMarker: any = null
const CLUSTER_ZOOM = 13  // below this zoom → show clusters; at/above → show individual pins

// ── Map styles ────────────────────────────────────────────────────────────────
// Defaults are ALL keyless and CORS-open on ANY domain — this matters: Stadia/MapTiler
// "free" keys only authorise localhost, so they 401 in production and the map renders
// blank (the bug where tiles show locally but not live). Production-safe sources:
//   • CARTO dark-matter — keyless vector dark basemap (matches the dark UI)
//   • OpenFreeMap liberty — keyless OSM vector streets
//   • Esri World Imagery — keyless raster satellite
// Override any of them with a keyed Stadia/MapTiler style via runtimeConfig
// (NUXT_PUBLIC_MAP_STYLE_DARK / _STREETS / _SATELLITE) without touching code.
const rc = useRuntimeConfig().public as Record<string, string | undefined>
const MAP_STYLES: Record<'dark' | 'streets' | 'satellite', any> = {
  dark:    rc.mapStyleDark    || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  streets: rc.mapStyleStreets || 'https://tiles.openfreemap.org/styles/liberty',
  satellite: rc.mapStyleSatellite || {
    version: 8,
    sources: {
      'esri-imagery': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [{ id: 'esri-imagery', type: 'raster', source: 'esri-imagery' }],
  },
}
const mapStyles = [
  { id: 'dark',      icon: 'mdi:map-outline',         label: 'Dark' },
  { id: 'streets',   icon: 'mdi:city-variant-outline', label: 'Light' },
  { id: 'satellite', icon: 'mdi:satellite-variant',    label: 'Satellite' },
]
const activeStyle = ref<keyof typeof MAP_STYLES>('dark')

function switchStyle(id: keyof typeof MAP_STYLES) {
  if (!map || id === activeStyle.value) return
  activeStyle.value = id
  map.setStyle(MAP_STYLES[id])
  // Re-add sources/layers + markers after style reloads
  map.once('styledata', () => {
    upsertRadiusCircle()
    addClusterLayers()
    // DOM markers survive style changes — no re-add needed.
    // Re-sync the canvas container class so pin/cluster visibility is correct.
    togglePinVisibility(map.getZoom())
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!import.meta.client || !mapEl.value) return

  maplibregl = (await import('maplibre-gl')).default
  await import('maplibre-gl/dist/maplibre-gl.css')

  const centerLng = props.userLng ?? 3.3792
  const centerLat = props.userLat ?? 6.5244

  map = new maplibregl.Map({
    container: mapEl.value,
    style: MAP_STYLES[activeStyle.value],
    center: [centerLng, centerLat],
    zoom: 12,
    attributionControl: false,
    pitchWithRotate: false,
    maxZoom: 18,
    minZoom: 6,
    maxBounds: [[2.69, 4.24], [14.68, 13.87]], // Nigeria bounds
  })

  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

  // Tap empty area → deselect
  map.on('click', () => emit('deselect'))

  map.on('load', () => {
    placeUserDot()
    upsertRadiusCircle()
    addClusterLayers()
    renderPins()
    renderSquarePins()
  })

  // Toggle cluster vs individual markers after zoom settles.
  // Using 'zoomend' (not 'zoom') avoids calling setLayoutProperty on every
  // animation frame, which corrupts the GL layer state during rapid zoom.
  map.on('zoomend', () => {
    togglePinVisibility(map.getZoom())
  })
})

onUnmounted(() => {
  map?.remove()
  map = null
  squareMarkerMap.clear()
})

// ── Radius circle ─────────────────────────────────────────────────────────────
function circleGeoJSON(lat: number, lng: number, km: number) {
  const steps = 80
  const coords: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI
    const dLat = (km / 111.32) * Math.cos(a)
    const dLng = (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a)
    coords.push([lng + dLng, lat + dLat])
  }
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [coords] },
      properties: {},
    }],
  }
}

function upsertRadiusCircle() {
  if (!map || !props.userLat || !props.userLng) return
  const data = circleGeoJSON(props.userLat, props.userLng, props.radiusKm)
  const src = map.getSource('radius-circle') as any
  if (src) {
    src.setData(data)
  } else {
    map.addSource('radius-circle', { type: 'geojson', data })
    map.addLayer({
      id: 'radius-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: { 'fill-color': '#F43F5E', 'fill-opacity': 0.04 },
    })
    map.addLayer({
      id: 'radius-line',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#F43F5E',
        'line-opacity': 0.3,
        'line-width': 1.5,
        'line-dasharray': [5, 4],
      },
    })
  }
}

watch(() => [props.radiusKm, props.userLat, props.userLng], () => {
  if (map?.loaded()) upsertRadiusCircle()
})

// ── Clustering ────────────────────────────────────────────────────────────────
function sellersToGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: props.sellers.map((s) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
      properties: { slug: s.store_slug, count: 1 },
    })),
  }
}

function addClusterLayers() {
  if (!map) return

  // Remove existing source/layers if present (style switch calls this again)
  if (map.getSource('sellers-cluster')) {
    for (const id of ['cluster-count', 'clusters']) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    map.removeSource('sellers-cluster')
  }

  map.addSource('sellers-cluster', {
    type: 'geojson',
    data: sellersToGeoJSON(),
    cluster: true,
    clusterMaxZoom: CLUSTER_ZOOM - 1, // stop clustering at zoom 13
    clusterRadius: 55,
  })

  // Cluster bubble — maxzoom keeps it from rendering above CLUSTER_ZOOM
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'sellers-cluster',
    maxzoom: CLUSTER_ZOOM,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#F43F5E', 10, '#e11d48', 30, '#be123c'],
      'circle-radius': ['step', ['get', 'point_count'], 22, 10, 28, 30, 34],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.92,
    },
  })

  // Cluster count label
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'sellers-cluster',
    maxzoom: CLUSTER_ZOOM,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
    },
    paint: { 'text-color': '#ffffff' },
  })

  // Click cluster → zoom in.
  // MapLibre v3 uses Promise; v2 used callback. We handle both.
  map.on('click', 'clusters', (e: any) => {
    e.originalEvent?.stopPropagation()
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    if (!features.length) return
    const clusterId = features[0].properties.cluster_id
    const coords = (features[0].geometry as any).coordinates.slice()
    const src = map.getSource('sellers-cluster') as any
    const result = src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      // v2 callback path
      if (err) return
      map.flyTo({ center: coords, zoom: zoom + 0.5, duration: 500 })
    })
    // v3 Promise path — result is a Promise when callback API is absent
    if (result && typeof result.then === 'function') {
      result.then((zoom: number) => {
        map.flyTo({ center: coords, zoom: zoom + 0.5, duration: 500 })
      }).catch(() => {})
    }
  })

  map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
}

function upsertClusterData() {
  if (!map) return
  const src = map.getSource('sellers-cluster') as any
  if (src) src.setData(sellersToGeoJSON())
}

function applyViewMode(zoom?: number) {
  if (!map) return
  const z = zoom ?? map.getZoom()
  const mode = props.viewMode ?? 'both'
  const container = map.getCanvasContainer()

  // Store DOM markers: hide when squares-only OR below cluster zoom
  const showStorePins = mode !== 'squares' && z >= CLUSTER_ZOOM
  container.classList.toggle('pins-hidden', !showStorePins)

  // Square DOM markers: hide when stores-only
  container.classList.toggle('hide-square-pins', mode === 'stores')

  // Cluster GL layers: force-hide when squares-only (layer maxzoom handles the rest)
  const hideClusters = mode === 'squares'
  for (const id of ['clusters', 'cluster-count']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', hideClusters ? 'none' : 'visible')
  }
}

// Keep old name as alias so all existing call sites keep working
const togglePinVisibility = (zoom: number) => applyViewMode(zoom)

// ── User dot ──────────────────────────────────────────────────────────────────
function placeUserDot() {
  if (!map || !props.userLat || !props.userLng) return
  const el = document.createElement('div')
  el.className = 'user-dot'
  el.innerHTML = `<div class="user-pulse"></div><div class="user-core"></div>`
  userMarker = new maplibregl.Marker({ element: el, anchor: 'center', className: 'user-dot-marker' })
    .setLngLat([props.userLng, props.userLat])
    .addTo(map)
}

watch(() => [props.userLat, props.userLng], ([lat, lng]) => {
  if (!map || !lat || !lng) return
  if (userMarker) {
    userMarker.setLngLat([lng as number, lat as number])
  } else {
    placeUserDot()
  }
  map.flyTo({ center: [lng, lat], zoom: 13, duration: 1000 })
})

// ── Seller pins ───────────────────────────────────────────────────────────────
watch(() => props.sellers, renderPins, { deep: true })

function renderPins() {
  if (!map || !maplibregl) return

  const newSlugs = new Set(props.sellers.map((s) => s.store_slug))

  // Remove stale
  for (const [slug, { marker }] of markerMap.entries()) {
    if (!newSlugs.has(slug)) {
      marker.remove()
      markerMap.delete(slug)
    }
  }

  // Add new
  for (const seller of props.sellers) {
    if (markerMap.has(seller.store_slug)) {
      // Update existing pin's online state without full rebuild
      const { el } = markerMap.get(seller.store_slug)!
      const pin = el.querySelector('.seller-pin') as HTMLElement | null
      if (pin) {
        pin.classList.toggle('pin-offline', !seller.isOnline)
      }
      continue
    }

    const el = buildPinEl(seller)
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('select-seller', seller)
    })

    const marker = new maplibregl.Marker({ element: el, anchor: 'top' })
      .setLngLat([seller.longitude, seller.latitude])
      .addTo(map)

    markerMap.set(seller.store_slug, { marker, el })
  }

  // Update cluster source with new seller data
  upsertClusterData()

  // Apply zoom-based visibility immediately after render
  if (map?.loaded()) togglePinVisibility(map.getZoom())

  updateSelectedStyle()
}

// ── Selected highlight ────────────────────────────────────────────────────────
watch(() => props.selectedSlug, updateSelectedStyle)

function updateSelectedStyle() {
  for (const [slug, { el }] of markerMap.entries()) {
    const pin = el.querySelector('.seller-pin') as HTMLElement | null
    if (!pin) continue
    pin.classList.toggle('selected', slug === props.selectedSlug)
  }
}

// ── Fly to selected ───────────────────────────────────────────────────────────
watch(() => props.selectedSlug, (slug) => {
  if (!slug || !map) return
  const seller = props.sellers.find((s) => s.store_slug === slug)
  if (seller) {
    map.flyTo({
      center: [seller.longitude, seller.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 600,
      offset: [0, -80],
    })
  }
})

// Re-apply pin visibility whenever view mode changes
watch(() => props.viewMode, () => { if (map?.loaded()) applyViewMode() })

// ── Square pins ───────────────────────────────────────────────────────────
watch(() => props.squares, renderSquarePins, { deep: true })

function renderSquarePins() {
  if (!map || !maplibregl) return

  const newIds = new Set(props.squares.map((sq) => sq.id))

  // Remove stale
  for (const [id, { marker }] of squareMarkerMap.entries()) {
    if (!newIds.has(id)) {
      marker.remove()
      squareMarkerMap.delete(id)
    }
  }

  // Add new
  for (const square of props.squares) {
    if (squareMarkerMap.has(square.id)) continue

    const el = buildSquarePinEl(square)
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('select-square', square)
    })

    // 'square-pin-marker' className keeps these visible even when pins-hidden is active
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', className: 'square-pin-marker' })
      .setLngLat([square.longitude, square.latitude])
      .addTo(map)

    squareMarkerMap.set(square.id, { marker, el })
  }
}

function buildSquarePinEl(square: IMapSquare): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'sq-pin-wrap'

  const accent = safeColor(square.accentColor)
  const name = esc(square.name.slice(0, 20))
  const location = esc([square.city, square.state].filter(Boolean).join(', '))
  const initials = esc(square.name.slice(0, 2).toUpperCase())

  wrap.innerHTML = `
    <div class="sq-pulse" style="--sq-color:${accent}"></div>
    <div class="sq-pin" style="--sq-color:${accent}">
      ${square.iconUrl
        ? `<img src="${esc(square.iconUrl)}" class="sq-icon-img" alt="" loading="lazy" />`
        : `<span class="sq-initials">${initials}</span>`
      }
      <div class="sq-label">${name}</div>
    </div>
    <div class="sq-tip" role="tooltip">
      <div class="sq-tip-name">${esc(square.name)}</div>
      ${location ? `<div class="sq-tip-loc">📍 ${location}</div>` : ''}
      <div class="sq-tip-stats">
        <span>${fmt(square.memberCount)} sellers</span>
        <span class="tt-dot">·</span>
        <span>${fmt(square.followerCount)} followers</span>
      </div>
      <a href="/squares/${esc(square.slug)}" class="sq-tip-visit" onclick="event.stopPropagation()">
        Explore Square →
      </a>
    </div>
  `

  return wrap
}

// ── Pin builder ───────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// Pins are built with innerHTML from seller-controlled fields (store_name, location,
// square name, logo/icon URLs). Escape every interpolated value to prevent stored XSS
// — e.g. a store named '"><img src=x onerror=…>' would otherwise run on the public map.
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
// Colours flow into inline `style` attributes — only allow hex, else fall back.
function safeColor(c?: string | null): string {
  return c && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#f59e0b'
}

function buildPinEl(seller: IMapSeller): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'pin-wrap'

  const logoUrl = esc(seller.store_logo ?? '')
  const initials = esc((seller.store_name ?? seller.store_slug ?? '?').slice(0, 2).toUpperCase())
  const name = esc((seller.store_name ?? seller.store_slug ?? '').slice(0, 16))
  const location = esc(seller.locationLabel || seller.city || '')
  const pulseClass = seller.hasActiveDeal
    ? 'pin-pulse-deal'
    : seller.isPremium
      ? 'pin-pulse-premium'
      : seller.isOpenNow
        ? 'pin-pulse-open'
        : ''

  // Status line for tooltip
  let statusLine = ''
  if (seller.isOnline) {
    statusLine = seller.isOpenNow
      ? `<span class="tt-online">● Online now</span>${seller.closesAt ? ` · closes ${esc(seller.closesAt)}` : ''}`
      : `<span class="tt-online">● Online</span>`
  } else {
    const seen = seller.lastSeenLabel ? ` · ${esc(seller.lastSeenLabel)}` : ''
    statusLine = `<span class="tt-offline">○ Offline${seen}</span>`
  }

  const openBadge = seller.isOpenNow
    ? `<span class="tt-badge tt-badge--open">Open</span>`
    : (seller.businessHours ? `<span class="tt-badge tt-badge--closed">Closed</span>` : '')

  const sq = seller.square
  const squareBadge = sq
    ? (() => {
        const color = safeColor(sq.accentColor)
        return `<a href="/squares/${esc(sq.slug)}" class="tt-square" style="background:${color}22;color:${color};border-color:${color}44" onclick="event.stopPropagation()">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          ${esc(sq.name)}
        </a>`
      })()
    : ''

  wrap.innerHTML = `
    ${pulseClass ? `<div class="${pulseClass}"></div>` : ''}
    <div class="seller-pin${seller.hasActiveDeal ? ' pin-deal' : ''}${seller.isPremium && !seller.hasActiveDeal ? ' pin-premium' : ''}${!seller.isOnline ? ' pin-offline' : ''}">
      ${logoUrl
        ? `<img src="${logoUrl}" class="pin-logo" alt="" loading="lazy" />`
        : `<span class="pin-initials">${initials}</span>`
      }
      ${seller.hasActiveDeal ? '<div class="pin-deal-dot"></div>' : ''}
      ${seller.isOpenNow && !seller.hasActiveDeal ? '<div class="pin-open-ring"></div>' : ''}
    </div>
    <div class="pin-status-dot ${seller.isOnline ? 'pin-status-dot--online' : 'pin-status-dot--offline'}"></div>
    <div class="pin-name${!seller.isOnline ? ' pin-name--offline' : ''}">${name}</div>
    <div class="pin-tooltip" role="tooltip">
      <div class="tt-header">
        <div class="tt-name">${esc(seller.store_name ?? seller.store_slug ?? '')}</div>
        ${openBadge}
      </div>
      ${location ? `<div class="tt-loc">📍 ${location} · ${seller.distanceKm.toFixed(1)}km</div>` : ''}
      <div class="tt-stats">
        <span>${fmt(seller.followerCount)} followers</span>
        <span class="tt-dot">·</span>
        <span>${seller.productCount} products</span>
      </div>
      ${squareBadge}
      ${seller.hasActiveDeal ? '<div class="tt-deal">🏷️ Active deal</div>' : ''}
      ${seller.isPremium ? '<div class="tt-premium">⭐ Premium store</div>' : ''}
      <div class="tt-status">${statusLine}</div>
      <a href="/sellers/profile/${esc(seller.store_slug)}" class="tt-visit" onclick="event.stopPropagation()">
        View store →
      </a>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${seller.latitude},${seller.longitude}" target="_blank" rel="noopener" class="tt-directions" onclick="event.stopPropagation()">
        Get Directions ↗
      </a>
    </div>
  `

  return wrap
}
</script>

<style>
/* ── Root + canvas ────────────────────────────────────────────────────────────── */
.map-root {
  position: relative;
  width: 100%;
  height: 100%;
}
.map-canvas {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
}

/* ── Right controls column ───────────────────────────────────────────────────── */
.map-controls-right {
  position: absolute;
  bottom: 36px;
  right: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

/* ── View mode segmented control ─────────────────────────────────────────────── */
.view-mode-group {
  display: flex;
  flex-direction: row;
  gap: 2px;
  background: rgba(10, 15, 30, 0.85);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 3px;
  backdrop-filter: blur(12px);
}
.vm-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 10px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.vm-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.vm-btn--active {
  background: #F43F5E;
  color: #fff;
  box-shadow: 0 2px 6px rgba(244,63,94,0.4);
}
.vm-label { line-height: 1; }

/* ── Style switcher ──────────────────────────────────────────────────────────── */
.style-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.style-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(10, 15, 30, 0.85);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.55);
  backdrop-filter: blur(12px);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  cursor: pointer;
}
.style-btn:hover { background: rgba(30, 40, 65, 0.95); color: #fff; }
.style-btn--active {
  background: #F43F5E;
  border-color: #F43F5E;
  color: #fff;
  box-shadow: 0 2px 8px rgba(244,63,94,0.4);
}

/* ── User location dot ────────────────────────────────────────────────────────── */
.user-dot { position: relative; width: 20px; height: 20px; }
.user-core {
  position: absolute; inset: 3px; border-radius: 50%;
  background: #F43F5E; border: 2.5px solid #fff;
  box-shadow: 0 2px 8px rgba(244,63,94,0.5); z-index: 2;
}
.user-pulse {
  position: absolute; inset: -6px; border-radius: 50%;
  background: rgba(244,63,94,0.25);
  animation: userPulse 2.2s ease-out infinite; z-index: 1;
}
@keyframes userPulse {
  0%   { transform: scale(0.7); opacity: 0.8; }
  70%  { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* ── Pin wrapper ─────────────────────────────────────────────────────────────── */
.pin-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

/* ── Pulse rings ─────────────────────────────────────────────────────────────── */
.pin-pulse-deal,
.pin-pulse-premium {
  position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 52px; height: 52px;
  border-radius: 50%; z-index: 0;
}
.pin-pulse-deal    { background: rgba(244,63,94,0.2); animation: pinPulse 1.8s ease-out infinite; }
.pin-pulse-premium { background: rgba(124,58,237,0.2); animation: pinPulse 2.4s ease-out infinite; }
.pin-pulse-open    { background: rgba(34,197,94,0.18); animation: pinPulseOpen 2.8s ease-out infinite; }
@keyframes pinPulse {
  0%   { transform: translateX(-50%) scale(0.85); opacity: 0.9; }
  70%  { transform: translateX(-50%) scale(1.65); opacity: 0; }
  100% { transform: translateX(-50%) scale(1.65); opacity: 0; }
}
@keyframes pinPulseOpen {
  0%   { transform: translateX(-50%) scale(0.9); opacity: 0.7; }
  60%  { transform: translateX(-50%) scale(1.55); opacity: 0; }
  100% { transform: translateX(-50%) scale(1.55); opacity: 0; }
}

/* ── Pin bubble ──────────────────────────────────────────────────────────────── */
.seller-pin {
  position: relative; z-index: 1;
  width: 52px; height: 52px;
  border-radius: 50%;
  background: #1e293b;
  border: 3px solid #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  overflow: hidden;
}
.seller-pin:hover,
.seller-pin.selected {
  transform: scale(1.18);
  border-color: #F43F5E;
  box-shadow: 0 6px 22px rgba(244,63,94,0.5), 0 2px 6px rgba(0,0,0,0.4);
}
.pin-deal    { border-color: #F43F5E; }
.pin-premium { border-color: #7c3aed; }
.pin-offline {
  border-color: rgba(255,255,255,0.25) !important;
  opacity: 0.5;
  filter: grayscale(50%);
}
.pin-offline:hover,
.pin-offline.selected {
  opacity: 0.9; filter: none; border-color: #F43F5E !important;
}

/* ── Logo / initials ─────────────────────────────────────────────────────────── */
.pin-logo { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.pin-initials {
  font-size: 13px; font-weight: 800;
  color: rgba(255,255,255,0.85);
  font-family: 'Manrope', system-ui, sans-serif;
  letter-spacing: 0.02em;
}

/* ── Open ring (green animated border on pin when store is open now) ─────────── */
.pin-open-ring {
  position: absolute; inset: -3px;
  border-radius: 50%;
  border: 2px solid #22c55e;
  animation: openRingPulse 2.5s ease-in-out infinite;
  pointer-events: none; z-index: 3;
}
@keyframes openRingPulse {
  0%, 100% { opacity: 0.9; box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
  50%       { opacity: 0.6; box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}

/* ── Deal dot ────────────────────────────────────────────────────────────────── */
.pin-deal-dot {
  position: absolute; top: 3px; right: 3px;
  width: 8px; height: 8px;
  border-radius: 50%; background: #F43F5E;
  border: 1.5px solid #1e293b; z-index: 2;
}

/* ── Online dot ──────────────────────────────────────────────────────────────── */
.pin-status-dot {
  position: absolute; top: 2px; right: 2px;
  width: 11px; height: 11px;
  border-radius: 50%; border: 2px solid #0f172a; z-index: 2;
}
.pin-status-dot--online  { background: #22c55e; }
.pin-status-dot--offline { background: #6b7280; }

/* ── Name label ──────────────────────────────────────────────────────────────── */
.pin-name {
  margin-top: 4px; max-width: 76px;
  font-size: 10px; font-weight: 700; color: #fff;
  text-align: center; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7);
  font-family: 'Manrope', system-ui, sans-serif;
  pointer-events: none;
}
.pin-name--offline { color: rgba(255,255,255,0.45); }

/* ── Tooltip ─────────────────────────────────────────────────────────────────── */
/* On mobile (touch) we skip CSS hover tooltips — taps open the bottom sheet instead */
@media (hover: hover) {
  .pin-wrap:hover .pin-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
}
.pin-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: rgba(8, 12, 28, 0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 12px 14px 10px;
  min-width: 190px;
  max-width: 230px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.7);
  backdrop-filter: blur(20px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 200;
}
.pin-tooltip::after {
  content: '';
  position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: rgba(8, 12, 28, 0.98);
}
.tt-header {
  display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;
}
.tt-name {
  font-size: 12px; font-weight: 800; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.tt-badge {
  flex-shrink: 0; border-radius: 9999px;
  font-size: 9px; font-weight: 800; padding: 2px 6px;
}
.tt-badge--open   { background: rgba(34,197,94,0.15); color: #22c55e; }
.tt-badge--closed { background: rgba(107,114,128,0.15); color: #9ca3af; }
.tt-loc {
  font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tt-stats {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 5px;
}
.tt-dot { color: rgba(255,255,255,0.25); }
.tt-square {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 800;
  border-radius: 9999px; padding: 3px 7px;
  border: 1px solid transparent;
  margin-bottom: 5px;
  text-decoration: none;
  transition: opacity 0.12s;
  cursor: pointer;
}
.tt-square:hover { opacity: 0.8; }
.tt-deal    { font-size: 10px; font-weight: 700; color: #F43F5E; margin-bottom: 3px; }
.tt-premium { font-size: 10px; font-weight: 700; color: #a78bfa; margin-bottom: 3px; }
.tt-status {
  font-size: 10px; font-weight: 600;
  padding-top: 6px; margin-top: 5px;
  border-top: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 8px;
}
.tt-online  { color: #22c55e; }
.tt-offline { color: #9ca3af; }
.tt-visit {
  display: block; width: 100%;
  text-align: center;
  background: #F43F5E;
  color: #fff; font-size: 11px; font-weight: 700;
  border-radius: 8px; padding: 6px 0;
  text-decoration: none;
  transition: background 0.15s;
}
.tt-visit:hover { background: #e11d48; }
.tt-directions {
  display: block; width: 100%;
  text-align: center;
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 700;
  border-radius: 8px; padding: 6px 0;
  text-decoration: none;
  margin-top: 6px;
  transition: background 0.15s, color 0.15s;
}
.tt-directions:hover { background: rgba(255,255,255,0.13); color: #fff; }

/* ── Pin visibility (cluster mode + view mode) ───────────────────────────────── */
/* Store markers hidden below CLUSTER_ZOOM or when viewMode is squares-only */
.maplibregl-canvas-container.pins-hidden .maplibregl-marker:not(.user-dot-marker):not(.square-pin-marker) {
  display: none !important;
}
/* Square markers hidden when viewMode is stores-only */
.maplibregl-canvas-container.hide-square-pins .square-pin-marker {
  display: none !important;
}

/* ── Square pin ──────────────────────────────────────────────────────────────── */
.sq-pin-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.sq-pulse {
  position: absolute;
  top: 4px; left: 50%;
  transform: translateX(-50%);
  width: 68px; height: 52px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--sq-color) 25%, transparent);
  animation: sqPulse 3s ease-out infinite;
  z-index: 0;
}
@keyframes sqPulse {
  0%   { transform: translateX(-50%) scale(0.88); opacity: 0.85; }
  65%  { transform: translateX(-50%) scale(1.55); opacity: 0; }
  100% { transform: translateX(-50%) scale(1.55); opacity: 0; }
}

.sq-pin {
  position: relative; z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 68px;
  padding: 7px 6px 5px;
  border-radius: 14px;
  background: #0f172a;
  border: 2.5px solid var(--sq-color);
  box-shadow: 0 4px 18px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06),
              0 0 12px color-mix(in srgb, var(--sq-color) 30%, transparent);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.sq-pin:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(0,0,0,0.7), 0 0 20px color-mix(in srgb, var(--sq-color) 50%, transparent);
}

.sq-icon-img {
  width: 28px; height: 28px;
  border-radius: 7px;
  object-fit: cover;
}
.sq-initials {
  font-size: 12px; font-weight: 900;
  color: var(--sq-color);
  font-family: 'Manrope', system-ui, sans-serif;
  line-height: 1;
}
.sq-label {
  font-size: 9px; font-weight: 800;
  color: rgba(255,255,255,0.9);
  text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 58px;
  font-family: 'Manrope', system-ui, sans-serif;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ── Square tooltip ───────────────────────────────────────────────────────────── */
@media (hover: hover) {
  .sq-pin-wrap:hover .sq-tip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
}
.sq-tip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: rgba(8, 12, 28, 0.98);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 12px 14px 10px;
  min-width: 196px;
  max-width: 240px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.7);
  backdrop-filter: blur(20px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 200;
}
.sq-tip::after {
  content: '';
  position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: rgba(8, 12, 28, 0.98);
}
.sq-tip-name {
  font-size: 12px; font-weight: 800; color: #fff;
  margin-bottom: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sq-tip-loc {
  font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sq-tip-stats {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 8px;
}
.sq-tip-visit {
  display: block; width: 100%;
  text-align: center;
  background: #f59e0b;
  color: #000; font-size: 11px; font-weight: 800;
  border-radius: 8px; padding: 6px 0;
  text-decoration: none;
  transition: background 0.15s;
}
.sq-tip-visit:hover { background: #d97706; }

/* ── MapLibre attribution ─────────────────────────────────────────────────────── */
.maplibregl-ctrl-attrib {
  background: rgba(0,0,0,0.5) !important;
  color: rgba(255,255,255,0.5) !important;
  border-radius: 6px !important; font-size: 10px !important;
}
.maplibregl-ctrl-attrib a { color: rgba(255,255,255,0.6) !important; }
</style>
