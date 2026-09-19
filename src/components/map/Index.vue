<template>
  <section class="map-shell" :aria-label="t('map.layers.shell.mapAria')">
    <div ref="mapElement" class="map-view">
      <div v-if="errorMessage" class="map-init-error">{{ errorMessage }}</div>
      <div v-if="hoverText" class="map-overlay map-overlay-top">
        <span class="chip chip-hover">{{ hoverText }}</span>
      </div>
    </div>

    <aside class="map-tools map-tools-primary" :aria-label="t('map.layers.shell.primaryTools')">
      <button
        class="map-tool map-icon-tool"
        :class="{ active: basemapMenuVisible }"
        type="button"
        :title="t('map.layers.basemap.section')"
        :aria-label="t('map.layers.basemap.section')"
        :aria-expanded="basemapMenuVisible"
        @click="toggleBasemapMenu"
      >
        <Layers3 :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        v-if="routeEditAvailable"
        class="map-tool map-icon-tool"
        :class="{ active: routeEditEnabled, unavailable: !hasRoute }"
        type="button"
        :title="t('map.layers.shell.routePointSettings')"
        :aria-label="t('map.layers.shell.routePointSettings')"
        :aria-pressed="routeEditEnabled"
        @click="requestRouteEditToggle"
      >
        <Route :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        v-if="turnEditAvailable"
        class="map-tool map-icon-tool"
        :class="{ active: turnEditEnabled, unavailable: !hasRoute }"
        type="button"
        :title="t('map.layers.shell.turnPointSettings')"
        :aria-label="t('map.layers.shell.turnPointSettings')"
        :aria-pressed="turnEditEnabled"
        @click="requestTurnEditToggle"
      >
        <Waypoints :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        v-if="clearAvailable"
        class="map-tool map-icon-tool map-tool-danger"
        :class="{ unavailable: !hasRoute && !ports.length }"
        type="button"
        :title="t('map.layers.shell.clearRoute')"
        :aria-label="t('map.layers.shell.clearRoute')"
        :disabled="!hasRoute && !ports.length"
        @click="emit('clear-route')"
      >
        <Trash2 :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>

      <div v-if="basemapMenuVisible" class="basemap-popup" role="menu" :aria-label="t('map.layers.basemap.select')">
        <button
          v-for="option in basemapOptions"
          :key="option.id"
          class="basemap-popup-item"
          :class="{ active: activeBasemapId === option.id }"
          type="button"
          role="menuitemradio"
          :aria-checked="activeBasemapId === option.id"
          @click="selectBasemap(option.id)"
        >
          <span class="basemap-popup-preview" :style="{ backgroundImage: `url(${option.previewUrl})` }"></span>
          <span>{{ option.shortName }}</span>
        </button>
      </div>
    </aside>

    <!-- Meteorological layers are deferred to the next release. -->
    <aside v-if="meteoFeatureEnabled" class="map-tools map-tools-meteo" :aria-label="t('map.layers.meteo.toolGroup')">
      <button
        class="map-tool map-icon-tool"
        :class="{ active: meteoPanelVisible || meteoQueryEnabled }"
        type="button"
        :title="t('map.layers.meteo.title')"
        :aria-label="t('map.layers.meteo.title')"
        :aria-expanded="meteoPanelVisible"
        @click="toggleMeteoPanel"
      >
        <CloudSun :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
    </aside>

    <section v-if="meteoFeatureEnabled && meteoPanelVisible" class="meteo-layer-panel" :aria-label="t('map.layers.meteo.title')">
      <header class="meteo-layer-header">
        <span><CloudSun :size="16" :stroke-width="1.9" aria-hidden="true" /> {{ t('map.layers.meteo.title') }}</span>
        <button class="meteo-query-close" type="button" :title="t('map.layers.meteo.closeLayerPanel')" :aria-label="t('map.layers.meteo.closeLayerPanel')" @click="closeMeteoPanel">
          <X :size="16" :stroke-width="2" aria-hidden="true" />
        </button>
      </header>
      <div class="meteo-layer-actions" role="group" :aria-label="t('map.layers.meteo.layerSwitchGroup')">
        <button
          class="meteo-layer-action"
          :class="{ active: meteoQueryEnabled }"
          type="button"
          :aria-pressed="meteoQueryEnabled"
          @click="toggleMeteoQuery"
        >
          <CloudSun :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ t('map.layers.meteo.toggleQuery') }}</span>
        </button>
        <button
          v-for="option in meteoLayerOptions"
          :key="option.id"
          class="meteo-layer-action"
          :class="{ active: meteoLayerIds.has(option.id) }"
          type="button"
          :aria-pressed="meteoLayerIds.has(option.id)"
          :disabled="meteoGridLoading"
          @click="toggleMeteoLayer(option.id)"
        >
          <component :is="option.icon" :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ option.shortName }}</span>
        </button>
      </div>
      <label class="meteo-particle-toggle" :class="{ disabled: !meteoLayerIds.has('current') }">
        <input
          type="checkbox"
          :checked="meteoParticlesVisible"
          :disabled="!meteoLayerIds.has('current') || meteoGridLoading"
          @change="toggleMeteoParticles"
        >
        <Waves :size="16" :stroke-width="1.9" aria-hidden="true" />
        <span>{{ t('map.layers.meteo.particles') }}</span>
      </label>
      <p v-if="meteoGridLoading" class="meteo-layer-status">{{ t('map.layers.meteo.updatingViewport') }}</p>
      <p v-else-if="meteoGridSummary" class="meteo-layer-status">{{ meteoGridSummary }}</p>
      <p class="meteo-layer-source">{{ meteoGridProvider || 'Open-Meteo' }} · {{ t('map.layers.meteo.referenceOnly') }}</p>
    </section>

    <aside class="map-tools map-tools-secondary" :aria-label="t('map.layers.shell.secondaryTools')">
      <button
        class="map-tool map-icon-tool"
        :class="{ active: moreMenuVisible }"
        type="button"
        :title="t('map.layers.shell.layersMenu')"
        :aria-label="t('map.layers.shell.layersMenu')"
        :aria-expanded="moreMenuVisible"
        @click="toggleMoreMenu"
      >
        <List :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        class="map-tool map-icon-tool"
        :class="{ active: measureMode === 'distance' }"
        type="button"
        :title="t('map.layers.shell.measureDistance')"
        :aria-label="t('map.layers.shell.measureDistance')"
        :aria-pressed="measureMode === 'distance'"
        @click="toggleMeasure('distance')"
      >
        <Ruler :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        class="map-tool map-icon-tool"
        :class="{ active: measureMode === 'area' }"
        type="button"
        :title="t('map.layers.shell.measureArea')"
        :aria-label="t('map.layers.shell.measureArea')"
        :aria-pressed="measureMode === 'area'"
        @click="toggleMeasure('area')"
      >
        <SquareDashedMousePointer :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>

      <div v-if="moreMenuVisible" class="map-more-popup" role="menu" :aria-label="t('map.layers.maritime.section')">
        <button
          v-for="option in maritimeOptions"
          :key="option.id"
          class="map-more-popup-item"
          :class="{ active: maritimeLayerIds.has(option.id) }"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="maritimeLayerIds.has(option.id)"
          :disabled="loadingMaritimeLayerId === option.id"
          @click="toggleMaritimeLayer(option.id)"
        >
          <span class="map-layer-swatch" :style="{ background: option.color }"></span>
          <span>{{ option.shortName }}</span>
        </button>
        <button
          class="map-more-popup-item"
          :class="{ active: timezoneLayerEnabled }"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="timezoneLayerEnabled"
          :disabled="timezoneLayerLoading"
          @click="toggleTimezoneLayer"
        >
          <Clock3 :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ timezoneMetadata.shortName }}</span>
        </button>
        <button
          class="map-more-popup-item"
          :class="{ active: graticuleEnabled }"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="graticuleEnabled"
          @click="toggleGraticule"
        >
          <Grid3X3 :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ t('map.layers.shell.graticule') }}</span>
        </button>
      </div>
    </aside>

    <section v-if="meteoFeatureEnabled && (meteoQueryLoading || meteoQueryResult || meteoQueryError)" class="meteo-query-panel" aria-live="polite">
      <header class="meteo-query-header">
        <span><CloudSun :size="16" :stroke-width="1.9" aria-hidden="true" /> {{ t('map.layers.meteo.title') }}</span>
        <button class="meteo-query-close" type="button" :title="t('map.layers.meteo.closeQuery')" :aria-label="t('map.layers.meteo.closeQuery')" @click="closeMeteoQuery">
          <X :size="16" :stroke-width="2" aria-hidden="true" />
        </button>
      </header>
      <p v-if="meteoQueryResult" class="meteo-query-meta">
        {{ formatCoordinate(meteoQueryResult.lat, 'N', 'S') }} / {{ formatCoordinate(meteoQueryResult.lon, 'E', 'W') }}
        <span v-if="meteoObservedAt">{{ meteoObservedAt }}</span>
      </p>
      <p v-if="meteoQueryLoading" class="meteo-query-status">{{ t('map.layers.meteo.querying') }}</p>
      <p v-else-if="meteoQueryError" class="meteo-query-status meteo-query-error">{{ meteoQueryError }}</p>
      <template v-else-if="meteoQueryResult">
        <dl class="meteo-query-grid">
          <div><dt>{{ t('map.layers.meteo.params.windSpeed') }}</dt><dd>{{ formatValue(meteoQueryResult.weather?.windSpeedKn, 'kn') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.windDirection') }}</dt><dd>{{ formatDirection(meteoQueryResult.weather?.windDirection) }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.windGust') }}</dt><dd>{{ formatValue(meteoQueryResult.weather?.windGustKn, 'kn') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.pressure') }}</dt><dd>{{ formatValue(meteoQueryResult.weather?.pressureHpa, 'hPa') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.temperature') }}</dt><dd>{{ formatValue(meteoQueryResult.weather?.temperatureC, '°C') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.waveHeight') }}</dt><dd>{{ formatValue(meteoQueryResult.marine?.waveHeightM, 'm') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.waveDirection') }}</dt><dd>{{ formatDirection(meteoQueryResult.marine?.waveDirection) }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.wavePeriod') }}</dt><dd>{{ formatValue(meteoQueryResult.marine?.wavePeriodS, 's') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.current') }}</dt><dd>{{ formatValue(meteoQueryResult.marine?.currentSpeedKn, 'kn') }}</dd></div>
          <div><dt>{{ t('map.layers.meteo.params.currentDirection') }}</dt><dd>{{ formatDirection(meteoQueryResult.marine?.currentDirection) }}</dd></div>
        </dl>
        <p class="meteo-query-source">Open-Meteo · {{ t('map.layers.meteo.weatherOnlyReference') }}</p>
      </template>
    </section>

    <aside v-if="activeLayers.length" class="map-active-layers" :aria-label="t('map.layers.shell.activeLayers')">
      <button
        v-for="layer in activeLayers"
        :key="layer.id"
        class="map-active-layer"
        type="button"
        :title="t('map.layers.shell.closeLayer', { name: layer.name })"
        :aria-label="t('map.layers.shell.closeLayer', { name: layer.name })"
        @click="closeActiveLayer(layer.id)"
      >
        <span class="map-layer-swatch" :style="{ background: layer.color }"></span>
        <span>{{ layer.name }}</span>
        <X :size="13" :stroke-width="2.2" aria-hidden="true" />
      </button>
    </aside>

    <p v-if="mapHint" class="map-feedback">{{ mapHint }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Clock3,
  CloudSun,
  Grid3X3,
  Layers3,
  List,
  Route,
  Ruler,
  SquareDashedMousePointer,
  Trash2,
  Waypoints,
  Wind,
  Waves,
  X,
} from 'lucide-vue-next'
import { LeafletMapAdapter, type MeasureMode } from '@/components/map/leafletAdapter'
import { basemaps } from '@/components/map/modules/base'
import { maritimeLayerOptions, type MaritimeLayerId } from '@/components/map/modules/maritime'
import type { MeteoPointQueryResult } from '@/components/map/modules/meteo'
import type { MeteoLayerId } from '@/components/map/controllers/meteoLayerController'
import { timezoneLayerMetadata } from '@/components/map/modules/timezone'
import type { RoutePointConfig } from '@/types/map'
import type { Port, RoutePathItem, RoutePoint } from '@/types/protocol'

const props = withDefaults(defineProps<{
  ports: Port[]
  routePoints: RoutePoint[]
  trackSegments: RoutePathItem[]
  turningPoints: RoutePoint[]
  routePointConfig: RoutePointConfig[]
  routeEditEnabled: boolean
  turnEditEnabled: boolean
  routeEditAvailable?: boolean
  turnEditAvailable?: boolean
  clearAvailable?: boolean
  errorMessage?: string | null
}>(), {
  routeEditAvailable: true,
  turnEditAvailable: true,
  clearAvailable: true,
  errorMessage: null,
})

const emit = defineEmits<{
  (event: 'ready'): void
  (event: 'error', message: string): void
  (event: 'map-data-synced', payload: { routeCount: number }): void
  (event: 'map-notice', message: string): void
  (event: 'route-edit-toggle'): void
  (event: 'turn-edit-toggle'): void
  (event: 'edit-modes-disabled'): void
  (event: 'clear-route'): void
  (event: 'route-point-click', wayPointId: number): void
  (event: 'turn-point-create', payload: { anchorRouteSeq: number; lon: number; lat: number }): void
  (event: 'turn-point-edit', payload: { routeSeq: number; lon: number; lat: number }): void
  (event: 'turn-point-drag-commit', payload: { routeSeq: number; lon: number; lat: number }): void
}>()

interface ActiveLayer {
  id: string
  name: string
  color: string
}

interface MeteoLayerOption {
  id: MeteoLayerId
  shortName: string
  icon: typeof Wind
}

const { t, locale } = useI18n()

const meteoLayerOptions = computed<MeteoLayerOption[]>(() => [
  { id: 'wind', shortName: t('map.layers.meteo.layer.wind'), icon: Wind },
  { id: 'wave-height', shortName: t('map.layers.meteo.layer.waveHeight'), icon: Waves },
  { id: 'wave-direction', shortName: t('map.layers.meteo.layer.waveDirection'), icon: Wind },
  { id: 'current', shortName: t('map.layers.meteo.layer.current'), icon: Waves },
  { id: 'pressure', shortName: t('map.layers.meteo.layer.pressure'), icon: CloudSun },
])

// The H5 meteorological UI and data requests are intentionally deferred to the next release.
const meteoFeatureEnabled = false

const mapElement = ref<HTMLElement | null>(null)
const hoverText = ref<string | null>(null)
const mapHint = ref('')
const mapReady = ref(false)
const routeEditEnabled = computed(() => props.routeEditEnabled)
const turnEditEnabled = computed(() => props.turnEditEnabled)
const hasRoute = computed(() => props.trackSegments.length > 0)
const maritimeOptions = computed(() => maritimeLayerOptions())
const timezoneMetadata = computed(() => timezoneLayerMetadata())
const maritimeLayerIds = reactive(new Set<MaritimeLayerId>())
const loadingMaritimeLayerId = ref<MaritimeLayerId | null>(null)
const timezoneLayerEnabled = ref(false)
const timezoneLayerLoading = ref(false)
const graticuleEnabled = ref(false)
const measureMode = ref<MeasureMode>(null)
const meteoQueryEnabled = ref(false)
const meteoQueryLoading = ref(false)
const meteoQueryResult = ref<MeteoPointQueryResult | null>(null)
const meteoQueryError = ref('')
const meteoPanelVisible = ref(false)
const meteoGridLoading = ref(false)
const meteoGridSummary = ref('')
const meteoGridProvider = ref('')
const meteoParticlesVisible = ref(false)
const meteoLayerIds = reactive(new Set<MeteoLayerId>())
const basemapMenuVisible = ref(false)
const moreMenuVisible = ref(false)
const basemapOptions = computed(() => basemaps())
const activeBasemapId = ref(basemapOptions.value[0]?.id || 'domestic')

let mapAdapter: LeafletMapAdapter | null = null
let mapHintTimer: ReturnType<typeof window.setTimeout> | null = null
let meteoQueryRequest: AbortController | null = null
let meteoQueryVersion = 0

// Meteorological API request helpers are deferred to the next release.

const activeLayers = computed<ActiveLayer[]>(() => {
  const layers = maritimeOptions.value
    .filter((option) => maritimeLayerIds.has(option.id))
    .map((option) => ({ id: `maritime:${option.id}`, name: option.shortName, color: option.color }))
  if (timezoneLayerEnabled.value) {
    layers.push({ id: 'timezone', name: timezoneMetadata.value.shortName, color: '#775ca8' })
  }
  if (graticuleEnabled.value) {
    layers.push({ id: 'graticule', name: t('map.layers.shell.graticule'), color: '#4b6d78' })
  }
  return layers
})

function showNotice(message: string) {
  if (mapHintTimer) window.clearTimeout(mapHintTimer)
  mapHint.value = message
  mapHintTimer = window.setTimeout(() => {
    mapHint.value = ''
    mapHintTimer = null
  }, 2400)
}

function syncMapFromProps() {
  if (!mapAdapter || !mapReady.value) return
  mapAdapter.setPorts(props.ports)
  if (!props.trackSegments.length && !props.turningPoints.length) {
    mapAdapter.clearRoute()
  } else {
    mapAdapter.setRouteData(props.routePoints, props.trackSegments, props.turningPoints)
  }
  emit('map-data-synced', { routeCount: props.trackSegments.length })
}

function syncRoutePointConfig() {
  mapAdapter?.setRoutePointConfig(props.routePointConfig)
}

function syncInteractionModes() {
  mapAdapter?.setRouteEditMode(props.routeEditEnabled)
  mapAdapter?.setTurnDragMode(props.turnEditEnabled)
}

function toggleBasemapMenu() {
  basemapMenuVisible.value = !basemapMenuVisible.value
  moreMenuVisible.value = false
}

function toggleMoreMenu() {
  moreMenuVisible.value = !moreMenuVisible.value
  basemapMenuVisible.value = false
}

function selectBasemap(id: string) {
  activeBasemapId.value = mapAdapter?.setBasemap(id) || activeBasemapId.value
  basemapMenuVisible.value = false
}

function clearMeasureMode() {
  measureMode.value = mapAdapter?.setMeasureMode(null) ?? null
}

function formatCoordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(3)}°${value >= 0 ? positive : negative}`
}

function formatValue(value: number | null | undefined, unit: string): string {
  return value === null || value === undefined ? t('map.layers.shell.noData') : `${value.toFixed(1)} ${unit}`
}

function formatDirection(value: number | null | undefined): string {
  return value === null || value === undefined ? t('map.layers.shell.noData') : `${Math.round(value)}°`
}

const meteoObservedAt = computed(() => {
  const observedAt = meteoQueryResult.value?.weather?.observedAt || meteoQueryResult.value?.marine?.observedAt
  return observedAt ? `${observedAt.replace('T', ' ')} UTC` : ''
})

function setMeteoQueryMode(enabled: boolean, clearResult = false) {
  if (clearResult) {
    meteoQueryRequest?.abort()
    meteoQueryRequest = null
    meteoQueryVersion += 1
    meteoQueryLoading.value = false
    meteoQueryResult.value = null
    meteoQueryError.value = ''
    mapAdapter?.clearMeteoQueryPoint()
  }
  meteoQueryEnabled.value = mapAdapter?.setMeteoQueryMode(enabled) ?? false
}

function toggleMeteoQuery() {
  const enabled = !meteoQueryEnabled.value
  if (enabled) {
    clearMeasureMode()
    mapAdapter?.setRouteEditMode(false)
    mapAdapter?.setTurnDragMode(false)
    emit('edit-modes-disabled')
    basemapMenuVisible.value = false
    moreMenuVisible.value = false
  }
  setMeteoQueryMode(enabled, !enabled)
  if (enabled) showNotice(t('map.layers.meteo.notifyQueryEnabled'))
}

function toggleMeteoPanel() {
  const nextVisible = !meteoPanelVisible.value
  meteoPanelVisible.value = nextVisible
  if (nextVisible) {
    clearMeasureMode()
    setMeteoQueryMode(false, true)
    mapAdapter?.setRouteEditMode(false)
    mapAdapter?.setTurnDragMode(false)
    emit('edit-modes-disabled')
    basemapMenuVisible.value = false
    moreMenuVisible.value = false
  }
}

function closeMeteoPanel() {
  meteoPanelVisible.value = false
  setMeteoQueryMode(false, true)
  meteoGridLoading.value = false
  meteoGridSummary.value = ''
  meteoGridProvider.value = ''
  meteoParticlesVisible.value = false
  meteoLayerIds.clear()
  mapAdapter?.clearMeteoLayers()
}

async function toggleMeteoLayer(id: MeteoLayerId) {
  if (!mapAdapter || meteoGridLoading.value) return
  const visible = !meteoLayerIds.has(id)
  try {
    const result = await mapAdapter.setMeteoLayerVisible(id, visible)
    if (result.visible) {
      meteoLayerIds.add(id)
      activeBasemapId.value = result.activeBasemapId
    } else {
      meteoLayerIds.delete(id)
      if (id === 'current') meteoParticlesVisible.value = false
    }
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('map.layers.meteo.layerLoadFailed'))
  }
}

async function toggleMeteoParticles(event: Event) {
  const target = event.target as HTMLInputElement
  const visible = await mapAdapter?.setMeteoParticlesVisible(target.checked)
  meteoParticlesVisible.value = Boolean(visible)
}

// async function requestMeteoPoint(lon: number, lat: number) {
//   meteoQueryRequest?.abort()
//   const request = new AbortController()
//   meteoQueryRequest = request
//   const version = ++meteoQueryVersion
//   meteoQueryLoading.value = true
//   meteoQueryError.value = ''
//   meteoQueryResult.value = null
//   mapAdapter?.setMeteoQueryPoint(lon, lat)
//   try {
//     const result = await queryMeteoPoint({ lon, lat }, getMeteoApiOptions(), request.signal)
//     if (version !== meteoQueryVersion) return
//     meteoQueryResult.value = result
//   } catch (error) {
//     if (error instanceof DOMException && error.name === 'AbortError') return
//     if (version !== meteoQueryVersion) return
//     meteoQueryError.value = error instanceof Error ? error.message : '气象海况查询失败'
//   } finally {
//     if (version === meteoQueryVersion) {
//       meteoQueryLoading.value = false
//       meteoQueryRequest = null
//     }
//   }
// }

function closeMeteoQuery() {
  setMeteoQueryMode(false, true)
}

function requestRouteEditToggle() {
  clearMeasureMode()
  setMeteoQueryMode(false, true)
  emit('route-edit-toggle')
}

function requestTurnEditToggle() {
  clearMeasureMode()
  setMeteoQueryMode(false, true)
  emit('turn-edit-toggle')
}

function toggleMeasure(mode: Exclude<MeasureMode, null>) {
  const nextMode = measureMode.value === mode ? null : mode
  if (nextMode) {
    setMeteoQueryMode(false, true)
    mapAdapter?.setRouteEditMode(false)
    mapAdapter?.setTurnDragMode(false)
    emit('edit-modes-disabled')
  }
  measureMode.value = mapAdapter?.setMeasureMode(nextMode) ?? null
}

function toggleGraticule() {
  graticuleEnabled.value = mapAdapter?.toggleGraticule() ?? false
  moreMenuVisible.value = false
}

async function toggleMaritimeLayer(id: MaritimeLayerId) {
  if (!mapAdapter || loadingMaritimeLayerId.value) return
  const visible = !maritimeLayerIds.has(id)
  loadingMaritimeLayerId.value = id
  try {
    const result = await mapAdapter.setMaritimeLayerVisible(id, visible)
    if (result.visible) maritimeLayerIds.add(id)
    else maritimeLayerIds.delete(id)
    activeBasemapId.value = result.activeBasemapId
    const option = maritimeOptions.value.find((item) => item.id === id)
    if (result.visible && option) {
      showNotice(t('map.layers.shell.maritimeEnabledNotice', { name: option.name }))
    }
    moreMenuVisible.value = false
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('map.layers.shell.maritimeLayerLoadFailed'))
  } finally {
    loadingMaritimeLayerId.value = null
  }
}

async function toggleTimezoneLayer() {
  if (!mapAdapter || timezoneLayerLoading.value) return
  timezoneLayerLoading.value = true
  try {
    const result = await mapAdapter.setTimezoneLayerVisible(!timezoneLayerEnabled.value)
    timezoneLayerEnabled.value = result.visible
    activeBasemapId.value = result.activeBasemapId
    if (result.visible) showNotice(t('map.layers.shell.timezoneEnabledNotice', { name: timezoneMetadata.value.name }))
    moreMenuVisible.value = false
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('map.layers.shell.timezoneLayerLoadFailed'))
  } finally {
    timezoneLayerLoading.value = false
  }
}

function closeActiveLayer(id: string) {
  if (id.startsWith('maritime:')) {
    void toggleMaritimeLayer(id.slice('maritime:'.length) as MaritimeLayerId)
    return
  }
  if (id === 'timezone') {
    void toggleTimezoneLayer()
    return
  }
  if (id === 'graticule') toggleGraticule()
}

function clearInteractionModes() {
  clearMeasureMode()
  setMeteoQueryMode(false, true)
  mapAdapter?.setRouteEditMode(false)
  mapAdapter?.setTurnDragMode(false)
}

function reset() {
  mapAdapter?.reset()
  measureMode.value = null
  closeMeteoQuery()
  closeMeteoPanel()
}

function clearRoute() {
  mapAdapter?.clearRoute()
}

async function whenRendered() {
  await mapAdapter?.whenRendered()
}

function invalidateSize() {
  mapAdapter?.invalidateSize()
}

async function takeRouteScreenshot() {
  return mapAdapter?.takeRouteScreenshot() ?? null
}

function getDiagnostics() {
  return mapAdapter?.getDiagnostics()
}

watch(
  () => [props.ports, props.trackSegments, props.turningPoints],
  () => syncMapFromProps(),
  { deep: true, flush: 'post' },
)
watch(() => props.routePointConfig, () => syncRoutePointConfig(), { deep: true, flush: 'post' })
watch(() => [props.routeEditEnabled, props.turnEditEnabled], () => syncInteractionModes(), { flush: 'post' })
watch(locale, () => mapAdapter?.updateLocale())

onMounted(async () => {
  if (!mapElement.value) {
    emit('error', t('map.layers.shell.containerMissing'))
    return
  }
  mapAdapter = new LeafletMapAdapter(mapElement.value)
  try {
    await mapAdapter.init({
      onTrackHover: (text) => {
        hoverText.value = text
      },
      onMapNotice: (message) => {
        showNotice(message)
        emit('map-notice', message)
      },
      // Meteorological callbacks are intentionally not registered in this release.
      onRoutePointClick: (wayPointId) => emit('route-point-click', wayPointId),
      onTurnPointCreateRequest: (payload) => emit('turn-point-create', payload),
      onTurnPointEditRequest: (payload) => emit('turn-point-edit', payload),
      onTurnPointDragCommit: (payload) => emit('turn-point-drag-commit', payload),
    })
    mapReady.value = true
    syncRoutePointConfig()
    syncInteractionModes()
    syncMapFromProps()
    emit('ready')
  } catch (error) {
    emit('error', error instanceof Error ? error.message : t('map.layers.shell.initFailed'))
  }
})

onBeforeUnmount(() => {
  if (mapHintTimer) window.clearTimeout(mapHintTimer)
  meteoQueryRequest?.abort()
  mapAdapter?.destroy()
  mapAdapter = null
})

defineExpose({
  clearRoute,
  clearInteractionModes,
  getDiagnostics,
  reset,
  showNotice,
  takeRouteScreenshot,
  whenRendered,
  invalidateSize,
})
</script>