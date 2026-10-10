<template>
  <section class="map-shell" :aria-label="t('map.layers.shell.mapAria')">
    <div ref="mapElement" class="map-view">
      <div v-if="errorMessage" class="map-init-error">{{ errorMessage }}</div>
      <div v-if="hoverText" class="map-overlay map-overlay-top">
        <span class="chip chip-hover">{{ hoverText }}</span>
      </div>

      <div
        v-if="(measureMode && measurePointCount > 0) || pinCount > 0"
        class="map-overlay map-overlay-middle-right"
      >
        <!--
          The buttons live inside the Leaflet container: without stopping the events
          here every tap on them would also reach the map and be recorded as a new
          measurement point / pin (which is what broke re-measuring after a clear).
        -->
        <button
          v-if="measureMode && measurePointCount > 0"
          class="measure-clear-button"
          type="button"
          @click.stop="clearMeasurement"
          @dblclick.stop
          @pointerdown.stop
          @mousedown.stop
          @touchstart.stop
        >
          <Eraser :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ t('map.layers.shell.clearMeasurement') }}</span>
        </button>
        <button
          v-if="pinCount > 0"
          class="measure-clear-button"
          type="button"
          :title="t('map.layers.shell.clearPins')"
          :aria-label="t('map.layers.shell.clearPins')"
          @click.stop="clearPins"
          @dblclick.stop
          @pointerdown.stop
          @mousedown.stop
          @touchstart.stop
        >
          <Eraser :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ t('map.layers.shell.clearPins') }}</span>
        </button>
      </div>

      <div
        v-if="activePin && pinInfoVisible"
        class="map-overlay map-pin-info"
        role="dialog"
        :aria-label="t('map.layers.shell.pinInfoTitle')"
      >
        <!--
          The panel lives inside the Leaflet container, so every pointer event is stopped
          on its buttons: otherwise the tap would also reach the map and count as a map click.
        -->
        <p class="map-pin-coordinate">
          <span>{{ t('map.layers.shell.pinCoordinate') }}</span>
          <strong>{{ pinCoordinateText }}</strong>
        </p>
        <div class="map-pin-actions">
          <button
            class="map-pin-action map-pin-action-add"
            type="button"
            :disabled="!canAddPinToPorts"
            :title="pinAddDisabledReason || undefined"
            :aria-label="canAddPinToPorts ? t('map.layers.shell.pinAddToPorts') : pinAddDisabledReason"
            @click.stop="addPinToPorts"
            @dblclick.stop
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            {{ t('map.layers.shell.pinAddToPorts') }}
          </button>
          <button
            class="map-pin-action map-pin-action-delete"
            type="button"
            @click.stop="removeActivePin"
            @dblclick.stop
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <aside class="map-tools map-tools-primary" :aria-label="t('map.layers.shell.primaryTools')">
      <button
        class="map-tool map-icon-tool basemap-trigger"
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
        v-if="pinAvailable"
        class="map-tool map-icon-tool pin-trigger"
        :class="{ active: pinPlacing }"
        type="button"
        :title="t('map.layers.shell.pinTool')"
        :aria-label="t('map.layers.shell.pinTool')"
        :aria-pressed="pinPlacing"
        @click="togglePinPlacing"
      >
        <MapPinPlus :size="18" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <button
        class="map-tool map-icon-tool more-trigger"
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
        <!-- Reference layers first (timezone / graticule), maritime layers below. -->
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
          <span v-if="timezoneLayerEnabled" class="map-layer-remove">
            <X :size="13" :stroke-width="2.2" aria-hidden="true" />
          </span>
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
          <span v-if="graticuleEnabled" class="map-layer-remove">
            <X :size="13" :stroke-width="2.2" aria-hidden="true" />
          </span>
        </button>
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
          <span v-if="maritimeLayerIds.has(option.id)" class="map-layer-remove">
            <X :size="13" :stroke-width="2.2" aria-hidden="true" />
          </span>
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
        <span class="map-layer-remove">
          <X :size="13" :stroke-width="2.2" aria-hidden="true" />
        </span>
      </button>
    </aside>

    <p v-if="mapHint" class="map-feedback">{{ mapHint }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { defaultMapSource } from '@/config/region'
import {
  Clock3,
  Eraser,
  CloudSun,
  Grid3X3,
  Layers3,
  List,
  MapPinPlus,
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
import { formatCoordinate, formatCoordinateLabel } from '@/components/map/core/coordinates'
import type { MapPin } from '@/components/map/controllers/types'
import { basemaps } from '@/components/map/modules/base'
import { maritimeLayerOptions, type MaritimeLayerId } from '@/components/map/modules/maritime'
import type { MeteoPointQueryResult } from '@/components/map/modules/meteo'
import type { MeteoLayerId } from '@/components/map/controllers/meteoLayerController'
import { timezoneLayerMetadata } from '@/components/map/modules/timezone'
import { useDistanceStore } from '@/stores/distance'
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
  pinAvailable?: boolean
  errorMessage?: string | null
}>(), {
  routeEditAvailable: true,
  turnEditAvailable: true,
  clearAvailable: true,
  pinAvailable: true,
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
  (event: 'turn-point-edit', payload: { routeSeq: number; lon: number; lat: number; userAdded?: boolean }): void
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
const distance = useDistanceStore()

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
const measurePointCount = ref(0)
const pinPlacing = ref(false)
/** 地图上标点的数量：决定「清除全部标点」按钮是否出现（标点本身由 PinController 持有）。 */
const pinCount = ref(0)
/** 信息框当前对应的标点：最近放下或最近点中的那个，多个标点并存时跟着它切换。 */
const activePin = ref<MapPin | null>(null)
const pinInfoVisible = ref(false)
/** The pin info box shows itself for four seconds, then hides until a pin is tapped again. */
const PIN_INFO_DURATION = 4000
/**
 * 标点记住了自己加到港口列表的 portId：store 的 addCoordinatePort() 用
 * `${longitude}~${latitude}` 生成 portId，清除标点时要按这个 portId 找回索引再删。
 * 按标点 id 分组保存，重复添加同一个标点也不会漏删。
 */
const pinPortIds = new Map<number, string[]>()
/**
 * 已经加到港口列表的标点 id：地图上这些标点的位置由港口坐标点代表（PinController 会撤掉
 * 标点自身的图形和 label），信息框里的「加到港口列表」因此置灰。用 reactive Set 让按钮跟着变。
 */
const pinsAddedToPorts = reactive(new Set<number>())
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
const keepViewportOnNextSync = ref(false)
const basemapOptions = computed(() => basemaps(defaultMapSource()))
const activeBasemapId = ref(basemapOptions.value[0]?.id || 'domestic')

let mapAdapter: LeafletMapAdapter | null = null
let mapHintTimer: ReturnType<typeof window.setTimeout> | null = null
let pinInfoTimer: ReturnType<typeof window.setTimeout> | null = null
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

/**
 * Set by the host before an in-place edit (turn point drag / coordinate change) so
 * the next sync does not re-fit and re-zoom the map under the user's finger.
 */
function preserveViewport() {
  keepViewportOnNextSync.value = true
}

function syncMapFromProps() {
  if (!mapAdapter || !mapReady.value) return
  mapAdapter.setPorts(props.ports)
  if (!props.trackSegments.length && !props.turningPoints.length) {
    mapAdapter.clearRoute()
  } else {
    mapAdapter.setRouteData(
      props.routePoints,
      props.trackSegments,
      props.turningPoints,
      !keepViewportOnNextSync.value,
    )
  }
  keepViewportOnNextSync.value = false
  emit('map-data-synced', { routeCount: props.trackSegments.length })
}

function syncRoutePointConfig() {
  mapAdapter?.setRoutePointConfig(props.routePointConfig)
}

function syncInteractionModes() {
  mapAdapter?.setRouteEditMode(props.routeEditEnabled)
  mapAdapter?.setTurnDragMode(props.turnEditEnabled)
}

function closeLayerMenus() {
  basemapMenuVisible.value = false
  moreMenuVisible.value = false
}

/**
 * Tapping anywhere outside an open layer menu closes it. The trigger buttons and
 * the popups themselves are ignored so their own click handlers keep working
 * (`pointerdown` capture still sees taps on the Leaflet canvas).
 */
function onDocumentPointerDown(event: Event) {
  if (!basemapMenuVisible.value && !moreMenuVisible.value) return
  const target = event.target as HTMLElement | null
  if (!target || typeof target.closest !== 'function') return
  if (target.closest('.basemap-trigger, .more-trigger, .basemap-popup, .map-more-popup')) return
  closeLayerMenus()
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
  measurePointCount.value = 0
}

/** Clears the drawn measurement but keeps the tool active (see the floating button). */
function clearMeasurement() {
  mapAdapter?.clearMeasurement()
  measurePointCount.value = 0
}

/** Same coordinate text as the pin label on the map (see formatCoordinateLabel). */
const pinCoordinateText = computed(() => (activePin.value ? formatCoordinateLabel(activePin.value.lon, activePin.value.lat) : ''))

/** 当前标点为什么不能「加到港口列表」：空字符串代表按钮可用（用于 title / aria-label）。 */
const pinAddDisabledReason = computed(() => {
  if (!activePin.value) return t('map.layers.shell.pinAddToPortsDisabled')
  if (pinsAddedToPorts.has(activePin.value.id)) return t('map.layers.shell.pinAlreadyAdded')
  if (distance.hasDistanceResult) return t('map.layers.shell.pinAddToPortsDisabled')
  return ''
})

/**
 * 已有航程结果时不允许再往港口列表加坐标点：加到港口列表本身会清空航程结果，
 * 产品要求此时按钮置灰并说明原因（见按钮的 title / aria-label）。
 * 已经加过的标点同样置灰，避免同一坐标加出重复的港口行。
 */
const canAddPinToPorts = computed(() => Boolean(activePin.value) && !pinAddDisabledReason.value)

function clearPinInfoTimer() {
  if (pinInfoTimer === null) return
  window.clearTimeout(pinInfoTimer)
  pinInfoTimer = null
}

function showPinInfo() {
  clearPinInfoTimer()
  if (!activePin.value) return
  pinInfoVisible.value = true
  pinInfoTimer = window.setTimeout(() => {
    pinInfoVisible.value = false
    pinInfoTimer = null
  }, PIN_INFO_DURATION)
}

function hidePinInfo() {
  clearPinInfoTimer()
  pinInfoVisible.value = false
}

/** Leaving the pin placing mode for another tool: the pins themselves stay on the map. */
function disablePinPlacing() {
  if (!pinPlacing.value) return
  mapAdapter?.setPinPlacingMode(false)
  pinPlacing.value = false
}

/** The pin tool is exclusive with measuring, route editing and the meteo query tool. */
function togglePinPlacing() {
  const next = !pinPlacing.value
  if (next) {
    clearMeasureMode()
    setMeteoQueryMode(false, true)
    mapAdapter?.setRouteEditMode(false)
    mapAdapter?.setTurnDragMode(false)
    emit('edit-modes-disabled')
    basemapMenuVisible.value = false
    moreMenuVisible.value = false
  }
  pinPlacing.value = mapAdapter?.setPinPlacingMode(next) ?? false
  if (pinPlacing.value) showNotice(t('map.layers.shell.pinPlacingHint'))
}

function addPinToPorts() {
  const target = activePin.value
  if (!target || !canAddPinToPorts.value) return
  // `addCoordinatePort(latitude, longitude)` is the same entry point the distance tab's
  // coordinate dialog uses.
  distance.addCoordinatePort(target.lat, target.lon)
  // The store appends the new coordinate row and builds its portId as `${longitude}~${latitude}`.
  // Read that id back (instead of re-deriving the store's format here) so the pin remembers
  // exactly which rows it owns and "clear all pins" can remove them again.
  const addedRow = distance.portPoints[distance.portPoints.length - 1]
  const isOwnRow = addedRow?.port.isCoordinate
    && Number(addedRow.port.longitude) === target.lon
    && Number(addedRow.port.latitude) === target.lat
  if (isOwnRow) {
    const owned = pinPortIds.get(target.id)
    if (owned) owned.push(addedRow.port.portId)
    else pinPortIds.set(target.id, [addedRow.port.portId])
  }
  // The port point now represents this coordinate: drop the pin's marker and its label, keep the
  // record plus the invisible hit circle, and remember that its "add" button must stay disabled.
  pinsAddedToPorts.add(target.id)
  mapAdapter?.markPinAdded(target.id)
  // The box closes right away instead of lingering over the port point that just appeared.
  hidePinInfo()
  showNotice(t('map.layers.shell.pinAddedNotice'))
}

/** Removes the ports every map pin added, looking each one up by its portId (indices shift). */
function removeAddedPinPorts(portIds: string[]) {
  portIds.forEach((portId) => {
    const index = distance.portPoints.findIndex((row) => row.port.portId === portId)
    if (index >= 0) distance.removePort(index)
  })
}

/** The info box delete button: drops the pin the box refers to, just like before. */
function removeActivePin() {
  const target = activePin.value
  if (!target) return
  mapAdapter?.removePin(target.id)
  activePin.value = null
  hidePinInfo()
}

/**
 * 清除全部标点（与测量工具的清除按钮同一位置/样式）。
 * 地图上的标点、信息框一律清掉；这些标点加到港口列表里的坐标点则要看航程结果：
 * 已经有航程结果时那些港口行已经参与过航线计算，删掉会让结果和港口列表对不上，
 * 因此只清标点、保留港口行，并用提示说明原因（见 pinClearKeptPorts）。
 */
function clearPins() {
  mapAdapter?.clearPins()
  const keepsAddedPorts = distance.hasDistanceResult
  const keptPortCount = keepsAddedPorts
    ? [...pinPortIds.values()].reduce((total, portIds) => total + portIds.length, 0)
    : 0
  if (!keepsAddedPorts) {
    pinPortIds.forEach((portIds) => removeAddedPinPorts(portIds))
  }
  pinPortIds.clear()
  pinsAddedToPorts.clear()
  pinCount.value = 0
  activePin.value = null
  hidePinInfo()
  if (keptPortCount > 0) showNotice(t('map.layers.shell.pinClearKeptPorts'))
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
    disablePinPlacing()
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
    disablePinPlacing()
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
  disablePinPlacing()
  setMeteoQueryMode(false, true)
  emit('route-edit-toggle')
}

function requestTurnEditToggle() {
  clearMeasureMode()
  disablePinPlacing()
  setMeteoQueryMode(false, true)
  emit('turn-edit-toggle')
}

function toggleMeasure(mode: Exclude<MeasureMode, null>) {
  const nextMode = measureMode.value === mode ? null : mode
  if (nextMode) {
    disablePinPlacing()
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
  disablePinPlacing()
  setMeteoQueryMode(false, true)
  mapAdapter?.setRouteEditMode(false)
  mapAdapter?.setTurnDragMode(false)
}

function reset() {
  mapAdapter?.reset()
  measureMode.value = null
  pinPlacing.value = false
  pinCount.value = 0
  activePin.value = null
  pinPortIds.clear()
  pinsAddedToPorts.clear()
  hidePinInfo()
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
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
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
      onMeasurementChange: ({ pointCount }) => {
        measurePointCount.value = pointCount
      },
      onPinPlaced: (placedPin) => {
        activePin.value = placedPin
        showPinInfo()
      },
      onPinClick: (tappedPin) => {
        activePin.value = tappedPin
        showPinInfo()
      },
      onPinCountChange: (count) => {
        pinCount.value = count
      },
      onPinPlacingChange: (placing) => {
        pinPlacing.value = placing
      },
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
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  if (mapHintTimer) window.clearTimeout(mapHintTimer)
  clearPinInfoTimer()
  meteoQueryRequest?.abort()
  mapAdapter?.destroy()
  mapAdapter = null
})

defineExpose({
  clearRoute,
  clearMeasurement,
  preserveViewport,
  clearInteractionModes,
  getDiagnostics,
  reset,
  showNotice,
  takeRouteScreenshot,
  whenRendered,
  invalidateSize,
})
</script>

<style scoped>
/*
 * 标点信息框：半透明浮层（同 .map-error / .map-notice 的定位约定），
 * 放在左上角避开左下角的已启用图层 chip 与右下的工具列。
 */
.map-overlay.map-pin-info {
  top: calc(16px + var(--ion-safe-area-top, env(safe-area-inset-top, 0px)));
  right: auto;
  left: 10px;
  display: block;
  width: min(238px, calc(100% - 84px));
  padding: 8px 10px 9px;
  border: 1px solid var(--line, rgba(16, 42, 67, 0.16));
  border-radius: 8px;
  /* 半透明，避免完全挡住底下的地图 */
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 6px 18px rgba(16, 42, 67, 0.2);
  backdrop-filter: blur(3px);
  /* 浮层自己接收点击，否则会穿透到地图 */
  pointer-events: auto;
}

.map-pin-coordinate {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  color: var(--ink-2, #334e68);
  font-size: 11px;
  line-height: 1.3;
}

.map-pin-coordinate strong {
  color: var(--ink-1, #102a43);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.map-pin-actions {
  display: flex;
  gap: 6px;
  margin-top: 7px;
}

.map-pin-action {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(16, 42, 67, 0.24);
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.map-pin-action-add {
  border-color: #007986;
  background: #007986;
  color: #ffffff;
}

.map-pin-action-delete {
  background: rgba(255, 255, 255, 0.92);
  color: var(--danger, #b83b2e);
}

/* 已有航程结果时「加到港口列表」置灰，原因见按钮的 title / aria-label */
.map-pin-action-add:disabled {
  border-color: rgba(16, 42, 67, 0.18);
  background: rgba(16, 42, 67, 0.12);
  color: var(--ink-2, #334e68);
  cursor: not-allowed;
}

/*
 * 图层删除按钮统一命中区：气泡行与已启用图层 chip 都用同一图标（X 13 / 2.2）
 * 和同一个 20×20 命中盒，外层按钮（≥32px）仍是实际点击区域。
 */
.map-layer-remove {
  display: grid;
  width: 20px;
  height: 20px;
  flex: none;
  place-items: center;
  border-radius: 4px;
}

.map-more-popup :deep(.map-more-popup-item) {
  grid-template-columns: 18px minmax(0, 1fr) auto;
}

.map-more-popup :deep(.map-more-popup-item > span:nth-child(2)) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 落点模式下的十字光标（类加在 Leaflet 容器即 .map-view 上） */
.map-view.pin-placing-mode-active {
  cursor: crosshair;
}

/*
 * 标点透明命中圈：fill/stroke 都是透明的，默认不接收指针事件；
 * 比照 .leaflet-route-hit-line 的做法在这里显式打开命中。
 */
.map-view :deep(path.leaflet-pin-hit-circle.leaflet-interactive) {
  pointer-events: all;
  cursor: pointer;
}
</style>